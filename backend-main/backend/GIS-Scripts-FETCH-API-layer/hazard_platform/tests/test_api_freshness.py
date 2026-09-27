"""Tests for api.py's freshness reporting: _score_zone's oldest_recorded_at
return value and _freshness_fields()'s stale/data_recorded_at output.

`api.store` is monkeypatched to a throwaway SQLite file per test (not the
real hazard_readings.db api.py opens at import time), and _refresh_if_stale
is stubbed to a no-op -- so these tests need no network access, no
gis_fetcher install, and no zones.py registration for the test zone_id,
and never touch real production data.
"""
from __future__ import annotations

from datetime import datetime, timedelta, timezone

import pytest
from fastapi.testclient import TestClient

from backend import api
from data_pipeline.cleaning import STALE_AFTER
from data_pipeline.hazard_reading_store import HazardReadingStore
from data_pipeline.models import HazardReading, HazardType

TEST_ZONE_ID = "Z-TEST-FRESHNESS-01"

# Minimal parameters per hazard -- build_feature_dict just does dict
# lookups, so these don't need to be realistic, only present.
_PARAMS = {
    HazardType.FLOOD: {"rainfall_mm_24h": 10.0, "elevation_m": 50.0},
    HazardType.LANDSLIDE: {"slope_deg": 5.0},
    HazardType.EROSION: {"wave_energy_index": 0.2},
    HazardType.CLOUDBURST: {"humidity_pct": 60.0},
}


@pytest.fixture
def isolated_store(tmp_path, monkeypatch):
    """Point api.store at a throwaway SQLite file for this test only, and
    disable the live auto-refresh (it would otherwise try to call
    gis_fetcher for an unregistered test zone_id) so each test exercises
    _score_zone/_freshness_fields purely against what it saves directly."""
    test_store = HazardReadingStore(db_path=str(tmp_path / "test_hazard_readings.db"))
    monkeypatch.setattr(api, "store", test_store)
    monkeypatch.setattr(api, "_refresh_if_stale", lambda zone_id: None)
    return test_store


def _save(store: HazardReadingStore, hazard_type: HazardType, recorded_at: datetime) -> None:
    store.save(HazardReading(
        zone_id=TEST_ZONE_ID,
        hazard_type=hazard_type,
        source="test",
        recorded_at=recorded_at,
        parameters=_PARAMS[hazard_type],
    ))


def test_all_fresh_reports_not_stale(isolated_store):
    now = datetime.now(timezone.utc)
    for hazard_type in HazardType:
        _save(isolated_store, hazard_type, now)

    _classification, _result, oldest_recorded_at = api._score_zone(TEST_ZONE_ID)
    fields = api._freshness_fields(oldest_recorded_at)

    assert fields["stale"] is False
    assert fields["data_recorded_at"] is not None


def test_one_old_reading_reports_stale_even_if_others_fresh(isolated_store):
    """The whole point of using OLDEST rather than newest recorded_at:
    3 fresh hazards + 1 old one should still flag the response stale."""
    now = datetime.now(timezone.utc)
    old = now - STALE_AFTER - timedelta(hours=1)

    _save(isolated_store, HazardType.FLOOD, old)
    _save(isolated_store, HazardType.LANDSLIDE, now)
    _save(isolated_store, HazardType.EROSION, now)
    _save(isolated_store, HazardType.CLOUDBURST, now)

    _classification, _result, oldest_recorded_at = api._score_zone(TEST_ZONE_ID)
    fields = api._freshness_fields(oldest_recorded_at)

    assert oldest_recorded_at == old
    assert fields["stale"] is True


def test_no_readings_raises_value_error(isolated_store):
    with pytest.raises(ValueError):
        api._score_zone("Z-TEST-NEVER-INGESTED-01")


def test_zone_status_endpoint_surfaces_freshness_fields(isolated_store):
    now = datetime.now(timezone.utc)
    for hazard_type in HazardType:
        _save(isolated_store, hazard_type, now)

    client = TestClient(api.app)
    resp = client.get(f"/api/zone-status/{TEST_ZONE_ID}")

    assert resp.status_code == 200
    body = resp.json()
    assert body["stale"] is False
    assert "data_recorded_at" in body


def test_zone_status_endpoint_flags_stale_when_refresh_would_fail(isolated_store):
    """Simulates _refresh_if_stale's real failure path (e.g. live refetch
    failed silently) by leaving a genuinely old reading in place -- the
    stubbed no-op refresh above stands in for that failure. Response
    should still come back 200 with stale=True, not hide the staleness."""
    old = datetime.now(timezone.utc) - STALE_AFTER - timedelta(hours=2)
    for hazard_type in HazardType:
        _save(isolated_store, hazard_type, old)

    client = TestClient(api.app)
    resp = client.get(f"/api/zone-status/{TEST_ZONE_ID}")

    assert resp.status_code == 200
    body = resp.json()
    assert body["stale"] is True
