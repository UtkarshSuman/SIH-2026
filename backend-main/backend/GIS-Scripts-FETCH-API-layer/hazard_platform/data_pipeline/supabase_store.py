"""Supabase persistence for raw GIS readings, ML outputs, and relocation plans."""
from __future__ import annotations

import json
import os
from datetime import datetime
from typing import Any, Optional
from urllib.error import HTTPError
from urllib.parse import urlencode
from urllib.request import Request, urlopen
from uuid import uuid4

from data_pipeline.models import DataQuality, HazardReading, HazardType


class SupabaseHazardReadingStore:
    """PostgREST adapter matching HazardReadingStore's public read/write API."""

    def __init__(self, url: Optional[str] = None, service_key: Optional[str] = None) -> None:
        self.url = (url or os.environ["SUPABASE_URL"]).rstrip("/")
        self.service_key = service_key or os.environ["SUPABASE_SERVICE_ROLE_KEY"]

    def _request(self, method: str, table: str, query: Optional[dict[str, str]] = None, payload: Any = None, prefer: str = "return=representation") -> Any:
        suffix = f"?{urlencode(query)}" if query else ""
        request = Request(
            f"{self.url}/rest/v1/{table}{suffix}",
            data=json.dumps(payload).encode("utf-8") if payload is not None else None,
            method=method,
            headers={"apikey": self.service_key, "Authorization": f"Bearer {self.service_key}", "Content-Type": "application/json", "Prefer": prefer},
        )
        try:
            with urlopen(request, timeout=30) as response:
                body = response.read().decode("utf-8")
                return json.loads(body) if body else None
        except HTTPError as exc:
            detail = exc.read().decode("utf-8", errors="replace")
            raise RuntimeError(f"Supabase {method} {table} failed ({exc.code}): {detail}") from exc

    def save(self, reading: HazardReading) -> None:
        self._ensure_zone(reading.zone_id)
        self._request("POST", "HazardReading", payload={
            "id": self._id(),
            "zoneId": reading.zone_id, "hazardType": reading.hazard_type.value, "source": reading.source,
            "recordedAt": reading.recorded_at.isoformat(), "parameters": reading.parameters,
            "dataQuality": reading.data_quality.value, "imputedFields": [], "droppedFields": [],
        })

    @staticmethod
    def _id() -> str:
        return uuid4().hex

    def _ensure_zone(self, zone_id: str) -> None:
        if self._request("GET", "Zone", {"zoneId": f"eq.{zone_id}", "limit": "1"}):
            return
        from zones import get_zone
        zone = get_zone(zone_id)
        lon, lat = zone.center
        self._request("POST", "Zone", payload={"id": self._id(), "zoneId": zone.zone_id, "name": zone.name, "state": "Unassigned",
            "district": "Unassigned", "lat": lat, "lng": lon, "minLon": zone.min_lon, "minLat": zone.min_lat,
            "maxLon": zone.max_lon, "maxLat": zone.max_lat})

    def latest_for_zone(self, zone_id: str, hazard_type: HazardType) -> Optional[HazardReading]:
        rows = self._request("GET", "HazardReading", {"zoneId": f"eq.{zone_id}", "hazardType": f"eq.{hazard_type.value}", "order": "recordedAt.desc", "limit": "1"})
        return self._to_reading(rows[0]) if rows else None

    def history_for_zone(self, zone_id: str, hazard_type: HazardType, limit: int = 100) -> list[HazardReading]:
        rows = self._request("GET", "HazardReading", {"zoneId": f"eq.{zone_id}", "hazardType": f"eq.{hazard_type.value}", "order": "recordedAt.desc", "limit": str(limit)})
        return [self._to_reading(row) for row in rows]

    @staticmethod
    def _to_reading(row: dict[str, Any]) -> HazardReading:
        return HazardReading(zone_id=row["zoneId"], hazard_type=HazardType(row["hazardType"]), source=row["source"],
            recorded_at=datetime.fromisoformat(row["recordedAt"].replace("Z", "+00:00")), parameters=row["parameters"],
            data_quality=DataQuality(row["dataQuality"]))

    def publish_assessment(self, zone: Any, classification: Any, priority: Any, readings: dict[HazardType, HazardReading]) -> None:
        """Persist the single map-ready ML view and its analytical history."""
        existing = self._request("GET", "Zone", {"zoneId": f"eq.{zone.zone_id}", "limit": "1"})
        lon, lat = zone.center
        if not existing:
            self._request("POST", "Zone", payload={"id": self._id(), "zoneId": zone.zone_id, "name": zone.name, "state": "Unassigned", "district": "Unassigned",
                "lat": lat, "lng": lon, "minLon": zone.min_lon, "minLat": zone.min_lat, "maxLon": zone.max_lon, "maxLat": zone.max_lat})

        scores = {hazard.value: float(classification.scores.get(hazard, 0.0)) for hazard in HazardType}
        parameters = {key: value for reading in readings.values() for key, value in reading.parameters.items()}
        patch = {"zoneColor": classification.color.value, "worstHazard": classification.worst_hazard.value,
            "worstScore": classification.worst_score, "priority": priority.priority.value, "priorityScore": priority.priority_score,
            "floodScore": scores["FLOOD"], "landslideScore": scores["LANDSLIDE"], "erosionScore": scores["EROSION"],
            "cloudburstScore": scores["CLOUDBURST"], "isRedZone": classification.color.value == "RED", "isStale": False,
            "lastAssessedAt": datetime.utcnow().isoformat() + "Z"}
        self._request("PATCH", "Zone", {"zoneId": f"eq.{zone.zone_id}"}, patch)
        self._request("POST", "HazardHistory", payload={"id": self._id(), "zoneId": zone.zone_id, "floodScore": scores["FLOOD"],
            "landslideScore": scores["LANDSLIDE"], "erosionScore": scores["EROSION"], "cloudburstScore": scores["CLOUDBURST"],
            "worstScore": classification.worst_score, "zoneColor": classification.color.value,
            "rainfallMm": parameters.get("rainfall_24h_mm"), "riverLevelM": parameters.get("river_level_m"),
            "soilSaturationPct": parameters.get("soil_saturation_pct")})
        self.rebuild_relocation_plans()

    def rebuild_relocation_plans(self) -> None:
        """Allocate each active RED/YELLOW zone to nearest available safe sites."""
        zones = self._request("GET", "Zone", {"zoneColor": "in.(RED,YELLOW)", "order": "priorityScore.desc"})
        sites = self._request("GET", "RelocationSite", {"status": "eq.ACTIVE"})
        remaining = {site["id"]: max(0, int(site["remainingCapacity"])) for site in sites}
        for zone in zones:
            demand = max(0, int(zone["population"]))
            unallocated = demand
            choices = sorted(sites, key=lambda site: (site["lat"] - zone["lat"]) ** 2 + (site["lng"] - zone["lng"]) ** 2)
            allocations = []
            for site in choices:
                assigned = min(unallocated, remaining[site["id"]])
                if assigned <= 0:
                    continue
                distance_km = round((((site["lat"] - zone["lat"]) ** 2 + (site["lng"] - zone["lng"]) ** 2) ** 0.5) * 111, 2)
                allocations.append({"site": site, "allocated": assigned, "distance": distance_km})
                remaining[site["id"]] -= assigned
                unallocated -= assigned
                if unallocated == 0:
                    break
            timeline = "24h - Immediate" if zone["priority"] == "IMMEDIATE" else "7-14 days - Planned"
            plans = self._request("POST", "RelocationPlan", {"on_conflict": "zoneId"}, {"id": self._id(), "zoneId": zone["zoneId"],
                "totalEvacuees": demand, "timeline": timeline, "shortfall": unallocated, "isFullyAccommodated": unallocated == 0,
                "priorityRank": max(1, int(round((1 - float(zone["priorityScore"])) * 100)))}, "resolution=merge-duplicates,return=representation")
            plan = plans[0]
            self._request("DELETE", "RelocationAllocation", {"planId": f"eq.{plan['id']}"}, prefer="return=minimal")
            for allocation in allocations:
                self._request("POST", "RelocationAllocation", payload={"id": self._id(), "planId": plan["id"], "siteId": allocation["site"]["id"],
                    "allocatedPopulation": allocation["allocated"], "distanceKm": allocation["distance"], "routeStatus": "CLEAR"})


def using_supabase() -> bool:
    return bool(os.environ.get("SUPABASE_URL") and os.environ.get("SUPABASE_SERVICE_ROLE_KEY"))
