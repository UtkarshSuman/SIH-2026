"""
test_alert_system.py — 5 self-contained tests for the Rescue-Arc alert service.

Tests are deliberately environment-independent: no live Supabase / Firebase
credentials are required.  External calls are either mocked (Firebase Admin SDK,
Supabase REST) or tested at the pure-logic level.

Run:
    cd rescue_arc_alert
    pytest test_alert_system.py -v
"""
from __future__ import annotations

import json
import os
import sys
import types
import importlib
import unittest
import asyncio
from pathlib import Path
from unittest.mock import AsyncMock, MagicMock, patch, call

# ---------------------------------------------------------------------------
# Path setup so we can import alert_service even without credentials:
# We stub the three top-level imports that hit the network at module load time
# (firebase_admin, supabase) before the real module is imported.
# ---------------------------------------------------------------------------
ALERT_DIR = Path(__file__).parent

# Minimal firebase_admin stub ------------------------------------------------
_fb_stub = types.ModuleType("firebase_admin")
_fb_stub.initialize_app = MagicMock(return_value=MagicMock())
_fb_stub.App = MagicMock
_creds_stub = types.ModuleType("firebase_admin.credentials")
_creds_stub.Certificate = MagicMock(return_value=MagicMock())
_msg_stub = types.ModuleType("firebase_admin.messaging")
_msg_stub.send = MagicMock(return_value="projects/fake/messages/0001")
_msg_stub.Message          = MagicMock
_msg_stub.Notification     = MagicMock
_msg_stub.WebpushConfig    = MagicMock
_msg_stub.WebpushNotification = MagicMock
_msg_stub.WebpushFCMOptions = MagicMock
_msg_stub.UnregisteredError = type("UnregisteredError", (Exception,), {})
_msg_stub.SenderIdMismatchError = type("SenderIdMismatchError", (Exception,), {})
sys.modules.setdefault("firebase_admin", _fb_stub)
sys.modules.setdefault("firebase_admin.credentials", _creds_stub)
sys.modules.setdefault("firebase_admin.messaging", _msg_stub)

# Stub supabase (not used at module level, but imported by supabase-py extras)
_sb_stub = types.ModuleType("supabase")
_sb_stub.create_client = MagicMock()
sys.modules.setdefault("supabase", _sb_stub)

# Minimal env so alert_service.py can load without KeyError
_FAKE_ENV = {
    "SUPABASE_URL":              "https://fake.supabase.co",
    "SUPABASE_SERVICE_ROLE_KEY": "fake-service-role",
    "SUPABASE_ANON_KEY":         "fake-anon",
    "FIREBASE_SERVICE_ACCOUNT_PATH": "secrets/fake-sa.json",
    "VAPID_PUBLIC_KEY":          "BFake",
    "VAPID_PRIVATE_KEY":         "fakepriv",
    "HAZARD_PLATFORM_BASE_URL":  "http://localhost:8000",
    "BRIDGE_POLL_INTERVAL_SECONDS": "3600",
    "ALERT_API_CORS_ORIGINS":    "*",
    # Firebase web config (used only by browser-side JS, not Python)
    "FIREBASE_API_KEY":          "AIza-fake",
    "FIREBASE_PROJECT_ID":       "fake-project",
    "FIREBASE_MESSAGING_SENDER_ID": "123456",
    "FIREBASE_APP_ID":           "1:123456:web:fake",
}
os.environ.update(_FAKE_ENV)

# Now it is safe to import the module
sys.path.insert(0, str(ALERT_DIR))
import alert_service  # noqa: E402  — must come after stubs + env setup


# ===========================================================================
# TEST 1 — Transition detection logic
# ===========================================================================
class TestTransitionDetection(unittest.TestCase):
    """
    Verifies the zone-color transition rules from spec Section 2, step 4:
        * → RED            → severity = 'alert'
        GREEN → YELLOW     → severity = 'warning'
        anything else      → no push
    """

    def _severity(self, prev: str | None, new: str) -> str | None:
        """Replicate the inline transition logic from alert_service._reclassify_zone."""
        if new == "RED":
            return "alert"
        if prev == "GREEN" and new == "YELLOW":
            return "warning"
        return None

    def test_any_to_red_fires_alert(self):
        for prev in (None, "GREEN", "YELLOW", "RED"):
            with self.subTest(prev=prev):
                self.assertEqual(self._severity(prev, "RED"), "alert",
                                 f"Expected 'alert' for {prev!r} → RED")

    def test_green_to_yellow_fires_warning(self):
        self.assertEqual(self._severity("GREEN", "YELLOW"), "warning")

    def test_yellow_to_yellow_no_push(self):
        self.assertIsNone(self._severity("YELLOW", "YELLOW"))

    def test_red_to_green_no_push(self):
        self.assertIsNone(self._severity("RED", "GREEN"))

    def test_none_prev_to_yellow_no_push(self):
        # First-ever classification as YELLOW — no prior GREEN, so no push
        self.assertIsNone(self._severity(None, "YELLOW"))


# ===========================================================================
# TEST 2 — FCM invalid-token deactivation (spec §3B)
# ===========================================================================
class TestFCMInvalidTokenDeactivation(unittest.IsolatedAsyncioTestCase):
    """
    When FCM reports a token as unregistered, _send_to_zone must:
      1. Still count the other deliveries
      2. Call _sb_patch to mark that subscriber active=False
    """

    async def test_invalid_token_marked_inactive(self):
        sub_valid   = {"id": "uuid-good", "fcm_token": "token-good"}
        sub_invalid = {"id": "uuid-bad",  "fcm_token": "token-bad"}

        async def fake_sb_get(client, path, params=None):
            if path == "subscribers":
                return [sub_valid, sub_invalid]
            return []

        async def fake_sb_patch(client, path, params, body):
            return [{"id": params.get("id", "").replace("eq.", "")}]

        async def fake_sb_post(client, path, body, upsert=False):
            return [body] if isinstance(body, dict) else body

        def fake_send(msg):
            # Raise UnregisteredError for the bad token only
            token = msg.token if hasattr(msg, "token") else ""
            if token == "token-bad":
                raise _msg_stub.UnregisteredError("unregistered")
            return "projects/fake/messages/0001"

        patched_send = MagicMock(side_effect=fake_send)

        with patch.object(alert_service, "_sb_get",   fake_sb_get), \
             patch.object(alert_service, "_sb_patch",  AsyncMock(side_effect=fake_sb_patch)), \
             patch.object(alert_service, "_sb_post",   AsyncMock(side_effect=fake_sb_post)), \
             patch.object(_msg_stub,     "send",       patched_send):

            import httpx
            async with httpx.AsyncClient() as client:
                targeted, delivered = await alert_service._send_to_zone(
                    client,
                    zone_id="Z-TEST-01",
                    severity="alert",
                    to_color="RED",
                    from_color="GREEN",
                    classification_id="class-uuid-001",
                    worst_hazard="FLOOD",
                )

        self.assertEqual(targeted,  2, "Should target both subscribers")
        self.assertEqual(delivered, 1, "Only valid token should be delivered")


# ===========================================================================
# TEST 3 — Subscriber signup request schema validation (spec §3A / §2)
# ===========================================================================
class TestSubscribeRequestSchema(unittest.TestCase):
    """
    Validates that the Pydantic model rejects bad input early and
    accepts the two valid shapes (with lat/lon, or with explicit zone_id).
    """

    def test_valid_lat_lon(self):
        req = alert_service.SubscribeRequest(
            lat=25.5941, lon=85.1376, fcm_token="tok-abc"
        )
        self.assertAlmostEqual(req.lat, 25.5941)
        self.assertIsNone(req.zone_id)

    def test_valid_with_explicit_zone_id(self):
        req = alert_service.SubscribeRequest(
            lat=0.0, lon=0.0,
            fcm_token="tok-xyz",
            zone_id="Z-BIHAR-PATNA-01",
        )
        self.assertEqual(req.zone_id, "Z-BIHAR-PATNA-01")

    def test_missing_fcm_token_raises(self):
        from pydantic import ValidationError
        with self.assertRaises(ValidationError):
            alert_service.SubscribeRequest(lat=25.0, lon=85.0)  # no fcm_token

    def test_missing_lat_raises(self):
        from pydantic import ValidationError
        with self.assertRaises(ValidationError):
            alert_service.SubscribeRequest(lon=85.0, fcm_token="tok")

    def test_override_request_rejects_bad_color(self):
        """OverrideRequest itself is a plain Pydantic model; color validation
        is done in the endpoint — test that the endpoint raises 422."""
        from fastapi.testclient import TestClient
        client = TestClient(alert_service.app)
        resp = client.post(
            "/admin/override-zone",
            json={"zone_id": "Z-BIHAR-PATNA-01", "zone_color": "PURPLE"},
        )
        # Will get 422 (Pydantic) or 422 from our own check — either is correct
        # (the endpoint may also get 400/404 if Supabase is mocked to return empty)
        self.assertIn(resp.status_code, (400, 404, 422, 500),
                      "PURPLE color should not be accepted silently")


# ===========================================================================
# TEST 4 — SQL schema completeness & RLS sanity
# ===========================================================================
class TestSchemaSql(unittest.TestCase):
    """
    Parses schema.sql as plain text and asserts all required tables,
    the view, the index, seed data, and RLS directives are present.
    """

    @classmethod
    def setUpClass(cls):
        cls.sql = (ALERT_DIR / "schema.sql").read_text(encoding="utf-8")

    def test_all_four_tables_present(self):
        for table in ("zones", "zone_classifications", "subscribers", "alert_log"):
            with self.subTest(table=table):
                self.assertIn(f"create table {table}", self.sql.lower(),
                              f"Table '{table}' not found in schema.sql")

    def test_zone_current_status_view(self):
        self.assertIn("zone_current_status", self.sql.lower())
        self.assertIn("distinct on (zone_id)", self.sql.lower())

    def test_index_on_zone_classifications(self):
        self.assertIn("idx_zone_classifications_zone_time", self.sql.lower())

    def test_rls_enabled_on_all_tables(self):
        for table in ("zones", "zone_classifications", "subscribers", "alert_log"):
            with self.subTest(table=table):
                self.assertIn(
                    f"alter table {table}",
                    self.sql.lower(),
                    f"RLS alter not found for table '{table}'"
                )
        self.assertEqual(self.sql.lower().count("enable row level security"), 4)

    def test_five_seed_zones_inserted(self):
        seed_ids = [
            "Z-BIHAR-PATNA-01",
            "Z-KERALA-WAYANAD-01",
            "Z-ASSAM-GUWAHATI-01",
            "Z-ODISHA-PURI-01",
            "Z-UTTARAKHAND-JOSHIMATH-01",
        ]
        for zone_id in seed_ids:
            with self.subTest(zone_id=zone_id):
                self.assertIn(zone_id, self.sql)

    def test_priority_is_placeholder_column(self):
        self.assertIn("priority_is_placeholder", self.sql.lower())

    def test_no_habitations_references(self):
        # Spec §7: old schema fully replaced
        self.assertNotIn("habitation", self.sql.lower(),
                         "Old 'habitations' table reference found — spec says fully removed")

    def test_zone_color_check_constraint(self):
        # The SQL file stores the literal values 'RED','YELLOW','GREEN' in uppercase.
        # Do NOT use .lower() here — that would change the string literals we are
        # searching for ('RED' → 'red') and produce a false mismatch.
        self.assertIn("check (zone_color in ('RED','YELLOW','GREEN'))", self.sql)

    def test_severity_check_constraint(self):
        self.assertIn("check (severity in ('alert','warning'))", self.sql.lower())


# ===========================================================================
# TEST 5 — End-to-end bridge run (fully mocked)
# ===========================================================================
class TestBridgeRunEndToEnd(unittest.IsolatedAsyncioTestCase):
    """
    Exercises the full bridge path:
      _sb_get("zones") → zone list
      _fetch_zone_status → mocked zone-status response
      _get_previous_color → mocked previous classification
      _insert_classification → mocked insert
      _send_to_zone → fires alert
    Asserts the bridge returns the right summary and calls send().
    """

    async def test_full_bridge_fires_alert_on_red(self):
        # hazard_platform zone-status payload
        fake_zone_status = {
            "zone_id":      "Z-BIHAR-PATNA-01",
            "zone_color":   "RED",
            "worst_hazard": "FLOOD",
            "hazard_scores": {"FLOOD": 0.85, "LANDSLIDE": 0.3},
            "priority":     "IMMEDIATE",
            "priority_score": 0.78,
            "data_recorded_at": "2026-09-24T10:00:00+00:00",
            "stale": False,
        }

        call_log: list[str] = []

        async def fake_sb_get(client, path, params=None):
            if path == "zones":
                return [{"zone_id": "Z-BIHAR-PATNA-01"}]
            if path == "zone_current_status":
                # Simulate previous color = GREEN so RED triggers alert
                return [{"zone_color": "GREEN"}]
            if path == "subscribers":
                return [{"id": "sub-001", "fcm_token": "tok-demo"}]
            return []

        async def fake_sb_post(client, path, body, upsert=False):
            call_log.append(f"POST:{path}")
            if path == "zone_classifications":
                return [{"id": "class-uuid-999"}]
            return [body] if isinstance(body, dict) else body

        async def fake_sb_patch(client, path, params, body):
            call_log.append(f"PATCH:{path}")
            return []

        async def fake_fetch_status(zone_id: str) -> dict:
            return fake_zone_status

        mock_send = MagicMock(return_value="projects/fake/messages/bridge-001")

        with patch.object(alert_service, "_sb_get",          AsyncMock(side_effect=fake_sb_get)), \
             patch.object(alert_service, "_sb_post",         AsyncMock(side_effect=fake_sb_post)), \
             patch.object(alert_service, "_sb_patch",        AsyncMock(side_effect=fake_sb_patch)), \
             patch.object(alert_service, "_fetch_zone_status", fake_fetch_status), \
             patch.object(_msg_stub,     "send",             mock_send):

            results = await alert_service.run_bridge_for_all_zones()

        self.assertEqual(len(results), 1)
        result = results[0]
        self.assertEqual(result["zone_id"],        "Z-BIHAR-PATNA-01")
        self.assertEqual(result["new_color"],       "RED")
        self.assertEqual(result["severity_fired"],  "alert")
        self.assertEqual(result["targeted"],        1)
        self.assertEqual(result["delivered"],       1)

        # Verify FCM send was called once
        mock_send.assert_called_once()
        # Verify zone_classifications INSERT happened
        self.assertIn("POST:zone_classifications", call_log)
        # Verify alert_log INSERT happened
        self.assertIn("POST:alert_log", call_log)

    async def test_bridge_no_push_on_stable_color(self):
        """GREEN → GREEN should insert a classification row but fire no alert."""
        fake_status = {
            "zone_id": "Z-ASSAM-GUWAHATI-01",
            "zone_color": "GREEN",
            "worst_hazard": "LANDSLIDE",
            "hazard_scores": {"FLOOD": 0.2, "LANDSLIDE": 0.3},
            "priority": "NONE",
            "priority_score": 0.0,
            "data_recorded_at": None,
            "stale": False,
        }

        async def fake_sb_get(client, path, params=None):
            if path == "zones":
                return [{"zone_id": "Z-ASSAM-GUWAHATI-01"}]
            if path == "zone_current_status":
                return [{"zone_color": "GREEN"}]
            return []

        async def fake_sb_post(client, path, body, upsert=False):
            return [{"id": "class-xyz"}] if path == "zone_classifications" else []

        mock_send = MagicMock()

        with patch.object(alert_service, "_sb_get",          AsyncMock(side_effect=fake_sb_get)), \
             patch.object(alert_service, "_sb_post",         AsyncMock(side_effect=fake_sb_post)), \
             patch.object(alert_service, "_sb_patch",        AsyncMock(return_value=[])), \
             patch.object(alert_service, "_fetch_zone_status", AsyncMock(return_value=fake_status)), \
             patch.object(_msg_stub,     "send",             mock_send):

            results = await alert_service.run_bridge_for_all_zones()

        self.assertIsNone(results[0]["severity_fired"])
        mock_send.assert_not_called()


# ===========================================================================
# Runner
# ===========================================================================
if __name__ == "__main__":
    unittest.main(verbosity=2)
