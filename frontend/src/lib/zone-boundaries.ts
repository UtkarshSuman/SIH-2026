/**
 * Authentic Geographic Area Boundaries for Disaster Zones.
 * Backed by real OpenStreetMap administrative boundary polygons cached in zone_boundaries_cache.json.
 * Provides real curved multi-point polygons replacing circular buffers and fake pentagons.
 */

import cachedBoundariesData from "../data/zone_boundaries_cache.json";

export interface GeoJSONFeature {
  type: "Feature";
  geometry: {
    type: "Polygon" | "MultiPolygon";
    coordinates: any;
  };
  properties: {
    zone_id?: string;
    zone_name?: string;
    display_name?: string;
    admin_level?: number | string;
    [key: string]: any;
  };
}

export interface ZoneBoundaryQuery {
  zoneId?: string;
  lat?: number;
  lng?: number;
  minLat?: number | null;
  maxLat?: number | null;
  minLon?: number | null;
  maxLon?: number | null;
  boundaryCoordinates?: [number, number][];
  coordinates?: [number, number][];
  bbox?: number[];
  boundary?: GeoJSONFeature | null;
}

// Map of zoneId -> GeoJSON Feature
export const KNOWN_ZONE_GEOJSON_FEATURES: Record<string, GeoJSONFeature> = {};

// Map of zoneId -> Leaflet [lat, lng][] coordinates
export const KNOWN_ZONE_BOUNDARIES: Record<string, [number, number][]> = {};

// Populate from OpenStreetMap boundary cache
if (cachedBoundariesData && Array.isArray((cachedBoundariesData as any).features)) {
  for (const feature of (cachedBoundariesData as any).features) {
    const zoneId = feature.properties?.zone_id;
    if (!zoneId) continue;

    KNOWN_ZONE_GEOJSON_FEATURES[zoneId] = feature as GeoJSONFeature;

    const geom = feature.geometry;
    if (geom && geom.coordinates) {
      if (geom.type === "Polygon" && Array.isArray(geom.coordinates[0])) {
        // GeoJSON standard: [lng, lat] -> Leaflet standard: [lat, lng]
        KNOWN_ZONE_BOUNDARIES[zoneId] = geom.coordinates[0].map(
          ([lon, lat]: [number, number]) => [lat, lon] as [number, number]
        );
      } else if (geom.type === "MultiPolygon" && Array.isArray(geom.coordinates)) {
        // Pick the largest ring across all polygon parts
        let largestRing: [number, number][] = [];
        for (const poly of geom.coordinates) {
          if (Array.isArray(poly) && Array.isArray(poly[0])) {
            if (poly[0].length > largestRing.length) {
              largestRing = poly[0];
            }
          }
        }
        if (largestRing.length > 0) {
          KNOWN_ZONE_BOUNDARIES[zoneId] = largestRing.map(
            ([lon, lat]: [number, number]) => [lat, lon] as [number, number]
          );
        }
      }
    }
  }
}

/**
 * Check if a zone has an authentic OSM boundary feature
 */
export function hasRealBoundary(zone: ZoneBoundaryQuery): boolean {
  if (zone.boundary && zone.boundary.geometry) return true;
  if (!zone.zoneId) return false;
  return Boolean(
    KNOWN_ZONE_GEOJSON_FEATURES[zone.zoneId] ||
    KNOWN_ZONE_BOUNDARIES[zone.zoneId] ||
    findCaseInsensitive(zone.zoneId, KNOWN_ZONE_GEOJSON_FEATURES)
  );
}

/**
 * Returns the authentic GeoJSON feature for a zone, or null if only circle fallback should be used.
 */
export function getZoneBoundaryFeature(zone: ZoneBoundaryQuery): GeoJSONFeature | null {
  if (zone.boundary && zone.boundary.geometry) {
    return zone.boundary;
  }
  if (!zone.zoneId) return null;

  if (KNOWN_ZONE_GEOJSON_FEATURES[zone.zoneId]) {
    return KNOWN_ZONE_GEOJSON_FEATURES[zone.zoneId];
  }

  const matched = findCaseInsensitive(zone.zoneId, KNOWN_ZONE_GEOJSON_FEATURES);
  if (matched) return matched;

  return null;
}

/**
 * Returns an array of [lat, lng] pairs representing the closed area boundary polygon
 * for any given zone object.
 */
export function getZoneBoundary(zone: ZoneBoundaryQuery): [number, number][] {
  // 1. Direct boundaryCoordinates or coordinates property
  if (Array.isArray(zone.boundaryCoordinates) && zone.boundaryCoordinates.length >= 3) {
    return zone.boundaryCoordinates;
  }
  if (Array.isArray(zone.coordinates) && zone.coordinates.length >= 3) {
    return zone.coordinates;
  }

  // 2. From boundary GeoJSON if attached
  if (zone.boundary && zone.boundary.geometry?.coordinates) {
    const geom = zone.boundary.geometry;
    if (geom.type === "Polygon" && Array.isArray(geom.coordinates[0])) {
      return geom.coordinates[0].map(([lon, lat]: [number, number]) => [lat, lon] as [number, number]);
    }
    if (geom.type === "MultiPolygon" && Array.isArray(geom.coordinates[0]?.[0])) {
      return geom.coordinates[0][0].map(([lon, lat]: [number, number]) => [lat, lon] as [number, number]);
    }
  }

  // 3. Pre-mapped authentic boundary polygon from OSM cache by zoneId
  if (zone.zoneId && KNOWN_ZONE_BOUNDARIES[zone.zoneId]) {
    return KNOWN_ZONE_BOUNDARIES[zone.zoneId];
  }

  if (zone.zoneId) {
    const matchedCoords = findCaseInsensitive(zone.zoneId, KNOWN_ZONE_BOUNDARIES);
    if (matchedCoords) return matchedCoords;
  }

  // 4. From Bounding Box (minLon, minLat, maxLon, maxLat)
  const minLat = zone.minLat ?? (zone.bbox ? zone.bbox[1] : null);
  const maxLat = zone.maxLat ?? (zone.bbox ? zone.bbox[3] : null);
  const minLon = zone.minLon ?? (zone.bbox ? zone.bbox[0] : null);
  const maxLon = zone.maxLon ?? (zone.bbox ? zone.bbox[2] : null);

  if (minLat != null && maxLat != null && minLon != null && maxLon != null) {
    const latSpan = Math.abs(maxLat - minLat);
    const lonSpan = Math.abs(maxLon - minLon);
    return [
      [minLat + latSpan * 0.2, minLon],
      [maxLat - latSpan * 0.2, minLon],
      [maxLat, minLon + lonSpan * 0.25],
      [maxLat, maxLon - lonSpan * 0.25],
      [maxLat - latSpan * 0.2, maxLon],
      [minLat + latSpan * 0.2, maxLon],
      [minLat, maxLon - lonSpan * 0.3],
      [minLat, minLon + lonSpan * 0.3],
    ];
  }

  // 5. Fallback generated from center lat/lng
  const lat = zone.lat ?? 20.5937;
  const lng = zone.lng ?? 78.9629;
  const dLat = 0.025;
  const dLon = 0.028;

  return [
    [lat + dLat * 0.85, lng - dLon * 0.35],
    [lat + dLat * 0.95, lng + dLon * 0.45],
    [lat + dLat * 0.35, lng + dLon * 0.95],
    [lat - dLat * 0.45, lng + dLon * 0.85],
    [lat - dLat * 0.95, lng + dLon * 0.25],
    [lat - dLat * 0.85, lng - dLon * 0.55],
    [lat - dLat * 0.25, lng - dLon * 0.95],
    [lat + dLat * 0.45, lng - dLon * 0.85],
  ];
}

/**
 * Returns a GeoJSON FeatureCollection of all available authentic boundaries
 */
export function getAllZoneBoundariesFeatureCollection() {
  return cachedBoundariesData;
}

function findCaseInsensitive<T>(key: string, record: Record<string, T>): T | undefined {
  const target = key.toLowerCase();
  for (const k of Object.keys(record)) {
    if (k.toLowerCase() === target) {
      return record[k];
    }
  }
  return undefined;
}
