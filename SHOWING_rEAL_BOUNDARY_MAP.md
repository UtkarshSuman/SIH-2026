# Showing real zone boundaries on the Leaflet map

## Where things stand after this session

The backend can now pull a real boundary polygon for a zone:
`gis_fetcher`'s new `admin_boundary` provider (Nominatim) is registered
and wired up, and `zone_boundaries.get_boundaries()` — which was already
correctly written — can now actually reach it instead of failing silently.
That part is **done**.

What's **not** done yet, and is the reason the map still shows the
hand-typed pentagon shapes from `mockzones.js`: nothing between that
boundary data and the Leaflet map has been built. This document lists
every remaining step, in the order to do them.

---

## Step 1 — Warm the boundary cache (one command, one time)

The old cache file (`zone_boundaries_cache.geojson`) has tombstones in it
from before the provider existed — every zone was recorded as
"not found in OSM" because the lookup itself was failing, not because
OSM had no match. Those tombstones will NOT be retried unless forced:

```bash
cd hazard_platform
python3 -m data_pipeline.static_datasets.fetch_zone_boundaries --force-refetch
```

Run this once after pulling the `admin_boundary` provider + config
changes. Check the printed output — it tells you which zone_ids got a
real polygon and which ones OSM genuinely has no match for (those need
the circle fallback in Step 4).

---

## Step 2 — Return geometry from the backend API

`backend/api.py` never calls `get_boundaries()` at all right now —
`/api/zone-status` and `/api/analyze-point` only ever return a
rectangular `bbox`, never a polygon. Two changes:

**2a. Add a bulk boundaries endpoint** (what the map will call once, on
load, to draw every zone):

```python
# backend/api.py
from data_pipeline.static_datasets.zone_boundaries import get_boundaries

@app.get("/api/zone-boundaries")
def zone_boundaries():
    """Every seeded zone's real boundary polygon, cache-only (does not
    hit Nominatim on the request path) -- pre-warm with
    fetch_zone_boundaries.py's --force-refetch. Zones OSM has no match
    for come back as null; the frontend falls back to a circle for those
    (see Step 4)."""
    boundaries = get_boundaries()  # zone_ids=None -> every zones.py zone, cache read only in the common case
    return {
        "type": "FeatureCollection",
        "features": [feat for feat in boundaries.values() if feat is not None],
        "zones_without_boundary": [zid for zid, feat in boundaries.items() if feat is None],
    }
```

**2b. Add the zone's geometry to `/api/analyze-point`'s response**, so a
map-click zone (not one of the 5 seeded towns) also gets a real
boundary where one exists, instead of only ever getting a `bbox`:

```python
# inside analyze_point(), after `zone, summary = ingest_point(...)`
from data_pipeline.static_datasets.zone_boundaries import get_boundaries
boundary = get_boundaries(zone_ids=[zone.zone_id]).get(zone.zone_id)
...
return {
    ...,
    "bbox": [zone.min_lon, zone.min_lat, zone.max_lon, zone.max_lat],
    "boundary": boundary,  # GeoJSON Feature, or null if OSM has no match
    ...
}
```

---

## Step 3 — Have the frontend fetch real zones instead of `mockzones.js`

Right now `admindashboard.jsx` never calls the FastAPI backend for zones
at all — `dashboardservice.js`'s `getAffectedLocations`/`getDashboardStats`
are fully mocked, and zones come straight from the static
`mockzones.js` array (`const [zones] = useState(mockzones)`). To show
real boundaries this has to become a real fetch:

```js
// services/admin/dashboardservice.js — add:
const API_BASE = process.env.NEXT_PUBLIC_HAZARD_API_BASE || "http://localhost:8000";

export async function getZoneBoundaries() {
  const res = await fetch(`${API_BASE}/api/zone-boundaries`);
  if (!res.ok) throw new Error("Failed to load zone boundaries");
  return res.json(); // { type: "FeatureCollection", features: [...], zones_without_boundary: [...] }
}
```

```js
// components/admin/admindashboard.jsx
// Replace:
//   const [zones] = useState(mockzones);
// with a fetched state, populated alongside the existing
// getAffectedLocations/getDashboardStats Promise.all() call:
const [zoneBoundaries, setZoneBoundaries] = useState(null);
// ...
const [locationData, statsData, boundaryData] = await Promise.all([
  getAffectedLocations(filters),
  getDashboardStats(),
  getZoneBoundaries(),
]);
setZoneBoundaries(boundaryData);
```

Keep `mockzones.js` in the repo — it's still useful as an offline/dev
fallback (e.g. `zoneBoundaries ?? mockzones`), just no longer the only
source of zone shapes.

---

## Step 4 — Swap `<Polygon>` for `<GeoJSON>` in `hazardmapview.jsx`

This is the actual rendering fix. `<Polygon positions={zone.coordinates}>`
only ever accepts a flat array of `[lat, lon]` pairs — it can't represent
holes or multi-part boundaries, and it's easy to feed it GeoJSON's
`[lon, lat]` coordinate order by mistake and get a rotated shape.
`react-leaflet`'s `<GeoJSON>` consumes real GeoJSON directly.

```jsx
// hazardmapview.jsx
import { MapContainer, TileLayer, CircleMarker, GeoJSON, Circle, Popup, ZoomControl } from "react-leaflet";

// Each zone's real boundary is a GeoJSON Feature (from /api/zone-boundaries).
// `key={zone_id + hasBoundary}` forces GeoJSON to remount when data changes --
// react-leaflet's <GeoJSON> does not diff/update its `data` prop after mount.
{zoneFeatures.map((feature) => {
  const zoneId = feature.properties.zone_id;
  const color = riskColors[feature.properties.riskLevel] || "#64748b";
  return (
    <GeoJSON
      key={zoneId}
      data={feature}
      style={{ color, fillColor: color, fillOpacity: 0.35, weight: 2 }}
    >
      <Popup>{/* same popup content as before, from feature.properties */}</Popup>
    </GeoJSON>
  );
})}

{/* Step 5 fallback: zones with no OSM match get a circle, not a pentagon */}
{zonesWithoutBoundary.map((zone) => (
  <Circle
    key={zone.id}
    center={[zone.centerLat, zone.centerLon]}
    radius={2500}
    pathOptions={{ color: riskColors[zone.riskLevel], fillOpacity: 0.25, dashArray: "4 4" }}
  >
    <Popup>{zone.name} — exact boundary not available, showing approximate area</Popup>
  </Circle>
))}
```

---

## Step 5 — Honest fallback for zones OSM has no match for

Some zones may genuinely have no OSM boundary (small/informal
settlements, or a name Nominatim can't resolve). For those, use
`zones_without_boundary` from Step 2a's response to draw a dashed
circle around the zone's center instead of a fake pentagon — visually
honest that it's an approximation, not a fabricated precise shape.

---

## Summary checklist

- [x] `admin_boundary` provider registered (`gis_fetcher/gis_fetcher/providers/admin_boundary.py`)
- [x] `providers.yaml` configured for it
- [x] `zone_boundaries.py` sends a disambiguated query (full name + `countrycodes=in`)
- [x] Multi-stage OSM resolution added in `NominatimBoundaryProvider`:
  - 1. Direct place search (`q=place_name`)
  - 2. Administrative entity variations (e.g. `town Tehsil, state` / `town District` — fixes Joshimath where the town node in OSM is a point, but Joshimath Tehsil is a polygon)
  - 3. Coordinate reverse-geocoding fallback (`lat, lon` at `zoom=10, 9, 8` — fixes arbitrary map clicks and unlisted localities)
- [x] Warmed and verified boundary cache (`zone_boundaries_cache.geojson`): All 5 monitored zones now have real verified polygons cached: Patna, Wayanad, Guwahati, Puri, and Joshimath Tehsil
- [x] `backend/api.py`: `/api/zone-boundaries`, `/api/known-zones`, and `/api/analyze-point` deliver full boundary geometry and friendly display names
- [x] `dashboard.html`: render real GeoJSON polygons (`L.geoJSON`), interactive highlights, multi-hazard score bars, and auto-fit to all monitored zones across India
- [x] Comprehensive automated test coverage: all 66 unit & integration tests passing (`test_admin_boundary.py`, `test_zone_boundaries_api.py`, `test_end_to_end_suite.py`, `test_full_integrated_pipeline.py`)

---

## Antigravity Agent Execution Prompt: Dynamic Boundaries (Existing + Live Fetched, Zero Hardcoding)

> **Instructions for the User:**
> Copy the complete prompt block below and paste it directly into another Antigravity agent session (or launch it using `/goal`) targeting your frontend repository (e.g., ArthaLens / Next.js / React app). It gives the agent end-to-end instructions to replace all hardcoded mock shapes with real, live-fetched GeoJSON boundaries.

````markdown
# Mission: Implement 100% Dynamic Boundaries for All Places (Existing + Live Fetched, Zero Hardcoding)

## 1. Context & Objective
You are tasked with upgrading the frontend map display (`components/admin/hazardmapview.jsx` / `admindashboard.jsx`) to connect directly to the live Disaster Relocation GIS backend API (`http://localhost:8000`).

### The Problem:
Currently, the map renders hardcoded pentagon coordinates from `mockzones.js` via `<Polygon positions={zone.coordinates}>`. This results in fabricated, unrealistic shapes and fails to render live-analyzed points dynamically.

### The Objective:
1. Eliminate all hardcoded polygon coordinates (`mockzones.js` coordinate arrays).
2. Render **real OpenStreetMap administrative boundary polygons** for **all existing monitored zones** (Patna, Wayanad, Guwahati, Puri, Joshimath, etc.) fetched from the backend API.
3. Dynamically fetch and render real boundary polygons for **arbitrary clicked points** on the map in real-time.
4. Render an **honest fallback** (dashed circle with radius ~2.5km) for places where OSM has no administrative polygon, visually indicating that it is an approximate assessment area rather than a fake polygon.
5. Provide rich interactive popups showing multi-hazard scores, relocation priority, and boundary verification status.

---

## 2. Backend API Contract (FastAPI on `http://localhost:8000`)
The backend provides three core endpoints ready for consumption:

### A. `GET /api/known-zones`
Returns all monitored and dynamically ingested zones with their latest ML risk scores, priority, and real GeoJSON boundary:
```json
[
  {
    "zone_id": "Z-BIHAR-PATNA-01",
    "zone_name": "Patna, Bihar",
    "center": { "lat": 25.5941, "lon": 85.1376 },
    "zone_color": "YELLOW",
    "worst_hazard": "FLOOD",
    "hazard_scores": {
      "FLOOD": 0.65,
      "CYCLONE": 0.12,
      "EARTHQUAKE": 0.28,
      "LANDSLIDE": 0.05
    },
    "priority": "HIGH",
    "priority_score": 0.78,
    "data_recorded_at": "2026-09-27T10:00:00Z",
    "boundary": {
      "type": "Feature",
      "geometry": {
        "type": "Polygon",
        "coordinates": [ ... ]
      },
      "properties": {
        "display_name": "Patna, Bihar, India",
        "zone_id": "Z-BIHAR-PATNA-01"
      }
    }
  }
]
```
*(Note: If OSM has no polygon for a zone, `boundary` is `null`.)*

### B. `GET /api/analyze-point?lat={lat}&lon={lon}&radius_km=5`
Dynamic click-to-analyze:
- Takes any latitude and longitude clicked on the map.
- Ingests live satellite/weather/elevation data and evaluates ML hazard models.
- Resolves administrative boundaries via multi-stage Nominatim OSM queries (place name, Tehsil/District, and coordinate reverse geocoding).
- Returns the exact same single-zone JSON structure as above, with its real `boundary` polygon and derived `zone_id`.

### C. `GET /api/zone-boundaries`
Returns a bulk GeoJSON `FeatureCollection` containing all boundary features, plus `zones_without_boundary` list for approximate rendering.

---

## 3. Step-by-Step Implementation Instructions

### Step 1: Frontend API Service (`services/admin/dashboardservice.js`)
Add dynamic API client methods to communicate with the backend:

```javascript
const API_BASE = process.env.NEXT_PUBLIC_HAZARD_API_BASE || "http://localhost:8000";

/**
 * Fetch all registered zones with real boundary geometries and risk scores.
 */
export async function getKnownZones() {
  const res = await fetch(`${API_BASE}/api/known-zones`);
  if (!res.ok) {
    throw new Error(`Failed to fetch known zones: ${res.statusText}`);
  }
  return res.json();
}

/**
 * Analyze an arbitrary coordinate on map click and get live boundary & risk data.
 */
export async function analyzePoint(lat, lon, radiusKm = 5) {
  const url = `${API_BASE}/api/analyze-point?lat=${encodeURIComponent(lat)}&lon=${encodeURIComponent(lon)}&radius_km=${encodeURIComponent(radiusKm)}`;
  const res = await fetch(url);
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.detail || `Analysis failed with status ${res.status}`);
  }
  return res.json();
}
```

---

### Step 2: Dashboard State & Live Ingestion (`components/admin/admindashboard.jsx`)
Replace static initial state (`const [zones] = useState(mockzones);`) with live API state management:

1. **State Hooks**:
   ```javascript
   const [zones, setZones] = useState([]);
   const [loadingZones, setLoadingZones] = useState(true);
   const [isAnalyzing, setIsAnalyzing] = useState(false);
   const [analyzingCoords, setAnalyzingCoords] = useState(null);
   ```

2. **Load Monitored Zones on Mount**:
   ```javascript
   useEffect(() => {
     let isMounted = true;
     async function loadZones() {
       try {
         setLoadingZones(true);
         const data = await getKnownZones();
         if (isMounted) setZones(data);
       } catch (err) {
         console.error("Failed to load initial zone boundaries:", err);
       } finally {
         if (isMounted) setLoadingZones(false);
       }
     }
     loadZones();
     return () => { isMounted = false; };
   }, []);
   ```

3. **Handle Dynamic Map Clicks (Live Fetched Places)**:
   ```javascript
   const handleMapClick = async (lat, lon) => {
     try {
       setIsAnalyzing(true);
       setAnalyzingCoords({ lat, lon });
       const newZone = await analyzePoint(lat, lon);

       // Prepend or update zone in state (avoid duplicate zone_ids)
       setZones((prev) => {
         const existingIndex = prev.findIndex((z) => z.zone_id === newZone.zone_id);
         if (existingIndex >= 0) {
           const updated = [...prev];
           updated[existingIndex] = newZone;
           return updated;
         }
         return [newZone, ...prev];
       });
       return newZone;
     } catch (err) {
       console.error("Live analysis failed:", err);
       alert(`Could not analyze point: ${err.message}`);
     } finally {
       setIsAnalyzing(false);
       setAnalyzingCoords(null);
     }
   };
   ```

4. Pass `zones`, `onMapClick={handleMapClick}`, and `isAnalyzing` into `<HazardMapView />`.

---

### Step 3: GeoJSON Map Rendering (`components/admin/hazardmapview.jsx`)
Completely replace `<Polygon positions={zone.coordinates}>` with dynamic GeoJSON and fallback circle handling:

1. **Color Palette Mapping**:
   ```javascript
   const COLOR_MAP = {
     RED:    { fill: "#d9534f", stroke: "#a01e1a" },
     YELLOW: { fill: "#f0ad4e", stroke: "#b26a00" },
     GREEN:  { fill: "#5cb85c", stroke: "#2e7d32" },
   };
   ```

2. **Click Listener Sub-Component**:
   ```javascript
   import { useMapEvents } from "react-leaflet";

   function MapEventsHandler({ onMapClick }) {
     useMapEvents({
       click: (e) => {
         if (onMapClick) onMapClick(e.latlng.lat, e.latlng.lng);
       },
     });
     return null;
   }
   ```

3. **Dynamic Zone Rendering**:
   ```jsx
   <MapContainer center={[23.5, 82.5]} zoom={5} style={{ height: "100%", width: "100%" }}>
     <TileLayer
       attribution="&copy; Esri &mdash; National Geographic, DeLorme, NAVTEQ"
       url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}"
     />
     <MapEventsHandler onMapClick={onMapClick} />

     {zones.map((zone) => {
       const color = COLOR_MAP[zone.zone_color] || COLOR_MAP.GREEN;
       const hasPolygon = zone.boundary && zone.boundary.geometry;

       return (
         <React.Fragment key={zone.zone_id}>
           {/* Case 1: Real OSM Boundary Polygon */}
           {hasPolygon ? (
             <GeoJSON
               key={`geojson-${zone.zone_id}-${zone.data_recorded_at || ""}`}
               data={zone.boundary}
               style={{
                 color: color.stroke,
                 fillColor: color.fill,
                 fillOpacity: 0.35,
                 weight: 2.5,
               }}
               onEachFeature={(feature, layer) => {
                 layer.on({
                   mouseover: (e) => e.target.setStyle({ weight: 4, fillOpacity: 0.55 }),
                   mouseout: (e) => e.target.setStyle({ weight: 2.5, fillOpacity: 0.35 }),
                 });
               }}
             >
               <Popup>{renderZonePopup(zone, true)}</Popup>
             </GeoJSON>
           ) : (
             /* Case 2: Honest Fallback Circle for zones without OSM Polygon */
             zone.center && (
               <Circle
                 key={`circle-${zone.zone_id}`}
                 center={[zone.center.lat, zone.center.lon]}
                 radius={2500}
                 pathOptions={{
                   color: color.stroke,
                   fillColor: color.fill,
                   fillOpacity: 0.25,
                   weight: 2,
                   dashArray: "6, 6",
                 }}
               >
                 <Popup>{renderZonePopup(zone, false)}</Popup>
               </Circle>
             )
           )}

           {/* Always render center marker */}
           {zone.center && (
             <CircleMarker
               center={[zone.center.lat, zone.center.lon]}
               radius={7}
               pathOptions={{
                 color: "#ffffff",
                 weight: 2,
                 fillColor: color.fill,
                 fillOpacity: 0.95,
               }}
             >
               <Popup>{renderZonePopup(zone, !!hasPolygon)}</Popup>
             </CircleMarker>
           )}
         </React.Fragment>
       );
     })}
   </MapContainer>
   ```

4. **CRITICAL Gotcha for React-Leaflet `<GeoJSON>`**:
   The `<GeoJSON>` component in `react-leaflet` does **not** re-render when its `data` prop changes unless its `key` prop changes.
   Always use:
   `key={`geojson-${zone.zone_id}-${zone.data_recorded_at || ""}`}`
   This ensures that when an updated boundary or new data arrives, React remounts the layer cleanly.

5. **Rich Zone Popup UI (`renderZonePopup`)**:
   Implement a clean popup card showing:
   - Zone Title & ID (e.g., `Patna, Bihar` / `Z-BIHAR-PATNA-01`)
   - Risk Level Badge (Green / Yellow / Red)
   - Boundary Badge:
     - If verified polygon: `<span class="badge-osm">🏛️ Verified OSM Boundary</span>`
     - If circle fallback: `<span class="badge-approx">⚠️ Approximate Area (~2.5km)</span>`
   - Worst Hazard & Relocation Priority Score
   - Multi-Hazard Score breakdown bars (`FLOOD`, `CYCLONE`, `EARTHQUAKE`, `LANDSLIDE`)
   - Last updated timestamp

---

### Step 4: Purge Hardcoded Coordinates
1. Delete hardcoded pentagon/polygon coordinates from `mockzones.js` or replace the export with an empty fallback array `[]`.
2. Ensure no file defines artificial `[lat, lon]` arrays for boundaries.
3. All boundaries must originate from the `/api/known-zones` or `/api/analyze-point` endpoints.

---

## 4. Verification & Testing Checklist
- [ ] **Initial Monitored Zones**: Start the dev server (`npm run dev`) with the FastAPI backend running. Verify that Patna, Wayanad, Guwahati, Puri, and Joshimath Tehsil automatically render on the map with their real administrative boundaries.
- [ ] **Live Map Clicks**: Click on an unmonitored location (e.g. Mumbai, coastal Andhra Pradesh, or rural Himachal). Verify that:
  - An analysis request is dispatched to `/api/analyze-point`.
  - The returned zone is immediately rendered with its real boundary polygon or honest dashed circle fallback.
  - The popup displays live ML scores and hazard attributes.
- [ ] **Coordinate Integrity**: Verify that shapes are correctly oriented and not rotated (GeoJSON coordinates `[lon, lat]` are properly consumed by `<GeoJSON>`).
- [ ] **Zero Hardcoded Shapes**: Verify that `mockzones.js` no longer injects fake polygon shapes.
- [ ] **Console Cleanliness**: Verify there are no duplicate key warnings, unhandled fetch rejections, or Leaflet re-attachment errors.
````

