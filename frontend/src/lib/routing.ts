/**
 * FEATURE: Fetches a real road-following route between two points via
 * OSRM's free public routing server (no API key). Returns coordinates
 * as [lat, lng] pairs, ready for a Leaflet Polyline.
 * INSTALLATION: none - plain REST call, no SDK.
 *
 * NOTE: router.project-osrm.org is a free PUBLIC DEMO server - fine for
 * a hackathon demo's occasional route lookups, NOT rate-limit-safe for
 * production traffic. Before any real deployment, switch to a
 * self-hosted OSRM instance or a paid routing API (Mapbox Directions,
 * OpenRouteService).
 */
export async function fetchRoadRoute(
  from: { lat: number; lng: number },
  to: { lat: number; lng: number }
): Promise<[number, number][]> {
  const url = `https://router.project-osrm.org/route/v1/driving/${from.lng},${from.lat};${to.lng},${to.lat}?overview=full&geometries=geojson`;
  const res = await fetch(url);
  if (!res.ok) throw new Error("Routing request failed");
  const data = await res.json();
  return data.routes[0].geometry.coordinates.map(([lng, lat]: [number, number]) => [lat, lng]);
}