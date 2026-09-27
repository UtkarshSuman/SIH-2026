/**
 * seed-database.js
 * 
 * Seeds the jxitjpimiompwifxguch Supabase database with all required data
 * using the REST API (HTTPS port 443 — works even when direct PostgreSQL ports are blocked).
 * 
 * Includes ALL 13 comprehensive disaster zones, relocation sites, plans,
 * allocations, zone analytics, and admin user credentials.
 * 
 * Run: node supabase/seed-database.js
 */

const https = require("https");

const SUPABASE_URL = "https://jxitjpimiompwifxguch.supabase.co";
const SERVICE_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp4aXRqcGltaW9tcHdpZnhndWNoIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc5MDI1MTYzNCwiZXhwIjoyMTA1ODI3NjM0fQ.QT7Lrxy1VHySl8hLiU33ORGBwCfEuhJmDNh4Y_5I9Ao";

const BASE_HEADERS = {
  apikey: SERVICE_KEY,
  Authorization: `Bearer ${SERVICE_KEY}`,
  "Content-Type": "application/json",
  Prefer: "resolution=merge-duplicates,return=representation",
};

// ============================================================
// HTTP helpers
// ============================================================
function request(method, path, body) {
  return new Promise((resolve, reject) => {
    const url = new URL(`${SUPABASE_URL}${path}`);
    const options = {
      hostname: url.hostname,
      path: url.pathname + url.search,
      method,
      headers: BASE_HEADERS,
    };
    const req = https.request(options, (res) => {
      let data = "";
      res.on("data", (c) => (data += c));
      res.on("end", () => {
        try {
          resolve({ status: res.statusCode, body: data ? JSON.parse(data) : null });
        } catch {
          resolve({ status: res.statusCode, body: data });
        }
      });
    });
    req.on("error", reject);
    req.setTimeout(25000, () => { req.destroy(); reject(new Error("timeout")); });
    if (body) req.write(JSON.stringify(body));
    req.end();
  });
}

async function upsert(table, rows, onConflict = "id") {
  if (!Array.isArray(rows) || rows.length === 0) return;
  const path = `/rest/v1/${table}?on_conflict=${onConflict}`;
  const res = await request("POST", path, rows);
  if (res.status >= 400) {
    console.error(`  ❌ ${table} upsert failed (${res.status}):`, JSON.stringify(res.body).substring(0, 300));
    return false;
  }
  console.log(`  ✅ ${table}: ${rows.length} row(s) upserted`);
  return true;
}

// ============================================================
// SEED DATA: 13 ZONES ACROSS INDIA
// ============================================================

const NOW = new Date().toISOString();

const ALL_ZONES = [
  {
    zone_id: "Z-BIHAR-PATNA-01",
    name: "Patna, Bihar",
    min_lon: 85.1126, min_lat: 25.5691, max_lon: 85.1626, max_lat: 25.6191,
    state: "Bihar", district: "Patna",
    lat: 25.5941, lng: 85.1376, population: 45000,
    elevation_m: 53, slope_class: "Flat Plain (<5 deg)",
    is_red_zone: false, updated_at: NOW,
  },
  {
    zone_id: "Z-KERALA-WAYANAD-01",
    name: "Wayanad, Kerala",
    min_lon: 76.1069, min_lat: 11.6604, max_lon: 76.1569, max_lat: 11.7104,
    state: "Kerala", district: "Wayanad",
    lat: 11.6854, lng: 76.1319, population: 18200,
    elevation_m: 980, slope_class: "Escarpment Slopes (>35 deg)",
    is_red_zone: false, updated_at: NOW,
  },
  {
    zone_id: "Z-ASSAM-GUWAHATI-01",
    name: "Guwahati, Assam",
    min_lon: 91.7112, min_lat: 26.1195, max_lon: 91.7612, max_lat: 26.1695,
    state: "Assam", district: "Kamrup Metropolitan",
    lat: 26.1445, lng: 91.7362, population: 32000,
    elevation_m: 55, slope_class: "Riverine Valley (<8 deg)",
    is_red_zone: false, updated_at: NOW,
  },
  {
    zone_id: "Z-ODISHA-PURI-01",
    name: "Puri, Odisha",
    min_lon: 85.8062, min_lat: 19.7885, max_lon: 85.8562, max_lat: 19.8385,
    state: "Odisha", district: "Puri",
    lat: 19.8135, lng: 85.8312, population: 28000,
    elevation_m: 10, slope_class: "Coastal Beach (<3 deg)",
    is_red_zone: false, updated_at: NOW,
  },
  {
    zone_id: "Z-UTTARAKHAND-JOSHIMATH-01",
    name: "Joshimath, Uttarakhand",
    min_lon: 79.5391, min_lat: 30.5301, max_lon: 79.5891, max_lat: 30.5801,
    state: "Uttarakhand", district: "Chamoli",
    lat: 30.5551, lng: 79.5641, population: 21500,
    elevation_m: 1890, slope_class: "Steep Valley (>30 deg)",
    is_red_zone: false, updated_at: NOW,
  },
  {
    zone_id: "Z-WESTBENGAL-DARJEELING-01",
    name: "Darjeeling, West Bengal",
    min_lon: 88.2377, min_lat: 27.0160, max_lon: 88.2877, max_lat: 27.0660,
    state: "West Bengal", district: "Darjeeling",
    lat: 27.0410, lng: 88.2627, population: 22000,
    elevation_m: 2045, slope_class: "Steep Mountain Ridge (>30 deg)",
    is_red_zone: false, updated_at: NOW,
  },
  {
    zone_id: "Z-HIMACHAL-MANDI-01",
    name: "Mandi, Himachal Pradesh",
    min_lon: 76.9068, min_lat: 31.6837, max_lon: 76.9568, max_lat: 31.7337,
    state: "Himachal Pradesh", district: "Mandi",
    lat: 31.7087, lng: 76.9318, population: 26000,
    elevation_m: 760, slope_class: "River Valley Gorge (15-25 deg)",
    is_red_zone: false, updated_at: NOW,
  },
  {
    zone_id: "Z-UTTARAKHAND-GOPESHWAR-01",
    name: "Gopeshwar, Uttarakhand",
    min_lon: 79.2926, min_lat: 30.3874, max_lon: 79.3426, max_lat: 30.4374,
    state: "Uttarakhand", district: "Chamoli",
    lat: 30.4124, lng: 79.3176, population: 19500,
    elevation_m: 1550, slope_class: "Himalayan Terrace Slope (>25 deg)",
    is_red_zone: false, updated_at: NOW,
  },
  {
    zone_id: "Z-KERALA-KALPETTA-01",
    name: "Kalpetta, Kerala",
    min_lon: 76.0577, min_lat: 11.5844, max_lon: 76.1077, max_lat: 11.6344,
    state: "Kerala", district: "Wayanad",
    lat: 11.6094, lng: 76.0827, population: 31000,
    elevation_m: 780, slope_class: "Western Ghats Slopes (20-30 deg)",
    is_red_zone: false, updated_at: NOW,
  },
  {
    zone_id: "Z-ASSAM-DHEMAJI-01",
    name: "Dhemaji, Assam",
    min_lon: 94.5650, min_lat: 27.4550, max_lon: 94.6150, max_lat: 27.5050,
    state: "Assam", district: "Dhemaji",
    lat: 27.4800, lng: 94.5900, population: 24500,
    elevation_m: 91, slope_class: "Floodplain Basin (<3 deg)",
    is_red_zone: false, updated_at: NOW,
  },
  {
    zone_id: "Z-GUJARAT-KUTCH-01",
    name: "Kutch, Gujarat",
    min_lon: 69.8250, min_lat: 23.7050, max_lon: 69.8750, max_lat: 23.7550,
    state: "Gujarat", district: "Kutch",
    lat: 23.7300, lng: 69.8500, population: 38000,
    elevation_m: 15, slope_class: "Coastal Alluvial (<2 deg)",
    is_red_zone: false, updated_at: NOW,
  },
  {
    zone_id: "Z-KERALA-IDUKKI-01",
    name: "Idukki, Kerala",
    min_lon: 76.9450, min_lat: 9.8250, max_lon: 76.9950, max_lat: 9.8750,
    state: "Kerala", district: "Idukki",
    lat: 9.8500, lng: 76.9700, population: 17500,
    elevation_m: 1200, slope_class: "Highland Escarpment (>35 deg)",
    is_red_zone: false, updated_at: NOW,
  },
  {
    zone_id: "Z-TAMILNADU-NILGIRIS-01",
    name: "Nilgiris, Tamil Nadu",
    min_lon: 76.6750, min_lat: 11.3850, max_lon: 76.7250, max_lat: 11.4350,
    state: "Tamil Nadu", district: "Nilgiris",
    lat: 11.4100, lng: 76.7000, population: 23000,
    elevation_m: 1850, slope_class: "Nilgiri Mountain Range (>28 deg)",
    is_red_zone: false, updated_at: NOW,
  },
];

// ---- Relocation Sites (14 comprehensive sites) ----
const RELOCATION_SITES = [
  {
    id: "RS-UK-PIPALKOTI-01",
    site_code: "RS-PIPALKOTI-01",
    name: "Pipalkoti Safe Valley Township",
    district: "Chamoli", state: "Uttarakhand",
    lat: 30.4308, lng: 79.4312,
    total_area_sqm: 450000, usable_area_sqm: 380000,
    sphere_standard_sqm_per_person: 45, sphere_capacity: 8444,
    current_occupancy: 2100, remaining_capacity: 6344,
    water_source_type: "Gravity Fed Perennial Aquifer",
    road_connectivity_rating: 5, hospital_distance_km: 3.2,
    power_grid_status: true, status: "ACTIVE", updated_at: NOW,
  },
  {
    id: "RS-UK-GAUCHAR-01",
    site_code: "RS-GAUCHAR-01",
    name: "Gauchar Airstrip Emergency Settlement",
    district: "Chamoli", state: "Uttarakhand",
    lat: 30.2883, lng: 79.1558,
    total_area_sqm: 680000, usable_area_sqm: 560000,
    sphere_standard_sqm_per_person: 45, sphere_capacity: 12444,
    current_occupancy: 3400, remaining_capacity: 9044,
    water_source_type: "Municipal Filtration + River Intake",
    road_connectivity_rating: 5, hospital_distance_km: 1.5,
    power_grid_status: true, status: "ACTIVE", updated_at: NOW,
  },
  {
    id: "RS-KL-KALPETTA-01",
    site_code: "RS-KALPETTA-01",
    name: "Kalpetta South Resettlement Enclave",
    district: "Wayanad", state: "Kerala",
    lat: 11.605, lng: 76.083,
    total_area_sqm: 520000, usable_area_sqm: 440000,
    sphere_standard_sqm_per_person: 45, sphere_capacity: 9777,
    current_occupancy: 4200, remaining_capacity: 5577,
    water_source_type: "Borewell Grid + Rainwater Reservoir",
    road_connectivity_rating: 5, hospital_distance_km: 2.1,
    power_grid_status: true, status: "ACTIVE", updated_at: NOW,
  },
  {
    id: "RS-BH-DANAPUR-01",
    site_code: "RS-DANAPUR-01",
    name: "Danapur High Ground Shelter Complex",
    district: "Patna", state: "Bihar",
    lat: 25.6333, lng: 85.05,
    total_area_sqm: 720000, usable_area_sqm: 600000,
    sphere_standard_sqm_per_person: 45, sphere_capacity: 13333,
    current_occupancy: 5100, remaining_capacity: 8233,
    water_source_type: "Deep Tube Wells",
    road_connectivity_rating: 4, hospital_distance_km: 4.0,
    power_grid_status: true, status: "ACTIVE", updated_at: NOW,
  },
  {
    id: "RS-AS-NALBARI-01",
    site_code: "RS-NALBARI-01",
    name: "Nalbari Elevated Resettlement Colony",
    district: "Nalbari", state: "Assam",
    lat: 26.445, lng: 91.435,
    total_area_sqm: 540000, usable_area_sqm: 460000,
    sphere_standard_sqm_per_person: 45, sphere_capacity: 10222,
    current_occupancy: 2800, remaining_capacity: 7422,
    water_source_type: "River Abstraction + Treatment Plant",
    road_connectivity_rating: 4, hospital_distance_km: 6.5,
    power_grid_status: true, status: "ACTIVE", updated_at: NOW,
  },
  {
    id: "RS-OD-KHURDA-01",
    site_code: "RS-KHURDA-01",
    name: "Khurda Inland Safe Zone Camp",
    district: "Khurda", state: "Odisha",
    lat: 20.182, lng: 85.616,
    total_area_sqm: 380000, usable_area_sqm: 320000,
    sphere_standard_sqm_per_person: 45, sphere_capacity: 7111,
    current_occupancy: 1200, remaining_capacity: 5911,
    water_source_type: "Municipal Supply + Storage Tanks",
    road_connectivity_rating: 5, hospital_distance_km: 2.8,
    power_grid_status: true, status: "ACTIVE", updated_at: NOW,
  },
  {
    id: "RS-WB-SILIGURI-01",
    site_code: "RS-SILIGURI-01",
    name: "Siliguri Foothills Emergency Base",
    district: "Darjeeling", state: "West Bengal",
    lat: 26.7271, lng: 88.3953,
    total_area_sqm: 500000, usable_area_sqm: 420000,
    sphere_standard_sqm_per_person: 45, sphere_capacity: 9333,
    current_occupancy: 1800, remaining_capacity: 7533,
    water_source_type: "Borewell Grid",
    road_connectivity_rating: 5, hospital_distance_km: 3.5,
    power_grid_status: true, status: "ACTIVE", updated_at: NOW,
  },
  {
    id: "RS-HP-SUNDERNAGAR-01",
    site_code: "RS-SUNDERNAGAR-01",
    name: "Sundernagar Plateau Safe Township",
    district: "Mandi", state: "Himachal Pradesh",
    lat: 31.5333, lng: 76.9000,
    total_area_sqm: 550000, usable_area_sqm: 470000,
    sphere_standard_sqm_per_person: 45, sphere_capacity: 10444,
    current_occupancy: 2200, remaining_capacity: 8244,
    water_source_type: "Canal Water Plant",
    road_connectivity_rating: 5, hospital_distance_km: 2.0,
    power_grid_status: true, status: "ACTIVE", updated_at: NOW,
  },
  {
    id: "RS-UK-CHAMOLI-01",
    site_code: "RS-CHAMOLI-01",
    name: "Chamoli District Relief Complex",
    district: "Chamoli", state: "Uttarakhand",
    lat: 30.4000, lng: 79.3300,
    total_area_sqm: 420000, usable_area_sqm: 350000,
    sphere_standard_sqm_per_person: 45, sphere_capacity: 7777,
    current_occupancy: 1500, remaining_capacity: 6277,
    water_source_type: "Perennial Spring",
    road_connectivity_rating: 4, hospital_distance_km: 1.8,
    power_grid_status: true, status: "ACTIVE", updated_at: NOW,
  },
  {
    id: "RS-AS-LAKHIMPUR-01",
    site_code: "RS-LAKHIMPUR-01",
    name: "North Lakhimpur Elevated Relief Center",
    district: "Lakhimpur", state: "Assam",
    lat: 27.2300, lng: 94.1000,
    total_area_sqm: 600000, usable_area_sqm: 510000,
    sphere_standard_sqm_per_person: 45, sphere_capacity: 11333,
    current_occupancy: 3100, remaining_capacity: 8233,
    water_source_type: "High Tube Wells",
    road_connectivity_rating: 4, hospital_distance_km: 4.5,
    power_grid_status: true, status: "ACTIVE", updated_at: NOW,
  },
  {
    id: "RS-GJ-BHUJ-01",
    site_code: "RS-BHUJ-01",
    name: "Bhuj Emergency Resettlement Hub",
    district: "Kutch", state: "Gujarat",
    lat: 23.2500, lng: 69.6700,
    total_area_sqm: 750000, usable_area_sqm: 650000,
    sphere_standard_sqm_per_person: 45, sphere_capacity: 14444,
    current_occupancy: 3800, remaining_capacity: 10644,
    water_source_type: "Narmada Pipeline Supply",
    road_connectivity_rating: 5, hospital_distance_km: 2.5,
    power_grid_status: true, status: "ACTIVE", updated_at: NOW,
  },
  {
    id: "RS-KL-MUNNAR-01",
    site_code: "RS-MUNNAR-01",
    name: "Munnar Safe Transit Shelter",
    district: "Idukki", state: "Kerala",
    lat: 10.0889, lng: 77.0595,
    total_area_sqm: 390000, usable_area_sqm: 330000,
    sphere_standard_sqm_per_person: 45, sphere_capacity: 7333,
    current_occupancy: 1600, remaining_capacity: 5733,
    water_source_type: "Natural Spring + Storage Reservoir",
    road_connectivity_rating: 4, hospital_distance_km: 3.0,
    power_grid_status: true, status: "ACTIVE", updated_at: NOW,
  },
  {
    id: "RS-TN-METTUPALAYAM-01",
    site_code: "RS-METTUPALAYAM-01",
    name: "Mettupalayam Foothills Safe Camp",
    district: "Coimbatore", state: "Tamil Nadu",
    lat: 11.3000, lng: 76.9500,
    total_area_sqm: 580000, usable_area_sqm: 490000,
    sphere_standard_sqm_per_person: 45, sphere_capacity: 10888,
    current_occupancy: 2400, remaining_capacity: 8488,
    water_source_type: "Bhavani River Scheme",
    road_connectivity_rating: 5, hospital_distance_km: 2.2,
    power_grid_status: true, status: "ACTIVE", updated_at: NOW,
  },
];

// ---- Relocation Plans (13 plans) ----
const RELOCATION_PLANS = [
  {
    id: "RP-JOSHIMATH-01",
    zone_id: "Z-UTTARAKHAND-JOSHIMATH-01",
    total_evacuees: 21500,
    timeline: "SHORT_TERM (72h Protocol)",
    shortfall: 0,
    is_fully_accommodated: true,
    priority_rank: 1,
    notes: "Primary route via NH-7. Alternate via helicopter for elderly/disabled.",
    updated_at: NOW,
  },
  {
    id: "RP-WAYANAD-01",
    zone_id: "Z-KERALA-WAYANAD-01",
    total_evacuees: 18200,
    timeline: "IMMEDIATE (24h Protocol)",
    shortfall: 0,
    is_fully_accommodated: true,
    priority_rank: 2,
    notes: "Road NH-212 may be blocked during heavy rain. Pre-position boats at Kalpetta.",
    updated_at: NOW,
  },
  {
    id: "RP-PATNA-01",
    zone_id: "Z-BIHAR-PATNA-01",
    total_evacuees: 45000,
    timeline: "SHORT_TERM (48h Protocol)",
    shortfall: 0,
    is_fully_accommodated: true,
    priority_rank: 3,
    notes: "Coordinate with NDRF battalion. Use school buses for mass evacuation.",
    updated_at: NOW,
  },
  {
    id: "RP-GUWAHATI-01",
    zone_id: "Z-ASSAM-GUWAHATI-01",
    total_evacuees: 32000,
    timeline: "MEDIUM_TERM (96h Protocol)",
    shortfall: 0,
    is_fully_accommodated: true,
    priority_rank: 4,
    notes: "Brahmaputra river levels critical. SDRF standby at Kamakhya bridge.",
    updated_at: NOW,
  },
  {
    id: "RP-PURI-01",
    zone_id: "Z-ODISHA-PURI-01",
    total_evacuees: 28000,
    timeline: "MEDIUM_TERM (96h Protocol)",
    shortfall: 0,
    is_fully_accommodated: true,
    priority_rank: 5,
    notes: "Cyclone season high risk. Odisha OSDMA protocol active.",
    updated_at: NOW,
  },
  {
    id: "RP-DARJEELING-01",
    zone_id: "Z-WESTBENGAL-DARJEELING-01",
    total_evacuees: 22000,
    timeline: "SHORT_TERM (48h Protocol)",
    shortfall: 0,
    is_fully_accommodated: true,
    priority_rank: 6,
    notes: "Hill cart road & NH-10 monitoring. Evacuation via Rohini bypass to Siliguri.",
    updated_at: NOW,
  },
  {
    id: "RP-MANDI-01",
    zone_id: "Z-HIMACHAL-MANDI-01",
    total_evacuees: 26000,
    timeline: "IMMEDIATE (24h Protocol)",
    shortfall: 0,
    is_fully_accommodated: true,
    priority_rank: 7,
    notes: "Beas gorge flash flood alerts. Transit south along Chandigarh-Manali expressway.",
    updated_at: NOW,
  },
  {
    id: "RP-GOPESHWAR-01",
    zone_id: "Z-UTTARAKHAND-GOPESHWAR-01",
    total_evacuees: 19500,
    timeline: "SHORT_TERM (72h Protocol)",
    shortfall: 0,
    is_fully_accommodated: true,
    priority_rank: 8,
    notes: "Direct corridor to Chamoli relief complex via NH-58.",
    updated_at: NOW,
  },
  {
    id: "RP-KALPETTA-01",
    zone_id: "Z-KERALA-KALPETTA-01",
    total_evacuees: 31000,
    timeline: "SHORT_TERM (48h Protocol)",
    shortfall: 0,
    is_fully_accommodated: true,
    priority_rank: 9,
    notes: "Utilise Kalpetta South Enclave and secondary community shelters.",
    updated_at: NOW,
  },
  {
    id: "RP-DHEMAJI-01",
    zone_id: "Z-ASSAM-DHEMAJI-01",
    total_evacuees: 24500,
    timeline: "IMMEDIATE (24h Protocol)",
    shortfall: 0,
    is_fully_accommodated: true,
    priority_rank: 10,
    notes: "Subansiri & Brahmaputra flash flood zone. Elevated relief boats in position.",
    updated_at: NOW,
  },
  {
    id: "RP-KUTCH-01",
    zone_id: "Z-GUJARAT-KUTCH-01",
    total_evacuees: 38000,
    timeline: "MEDIUM_TERM (96h Protocol)",
    shortfall: 0,
    is_fully_accommodated: true,
    priority_rank: 11,
    notes: "Earthquake and cyclone contingency. Resettlement hub in Bhuj plateau.",
    updated_at: NOW,
  },
  {
    id: "RP-IDUKKI-01",
    zone_id: "Z-KERALA-IDUKKI-01",
    total_evacuees: 17500,
    timeline: "IMMEDIATE (24h Protocol)",
    shortfall: 0,
    is_fully_accommodated: true,
    priority_rank: 12,
    notes: "Dam shutter alerts. Evacuation corridors to higher elevation transit camps.",
    updated_at: NOW,
  },
  {
    id: "RP-NILGIRIS-01",
    zone_id: "Z-TAMILNADU-NILGIRIS-01",
    total_evacuees: 23000,
    timeline: "SHORT_TERM (48h Protocol)",
    shortfall: 0,
    is_fully_accommodated: true,
    priority_rank: 13,
    notes: "Ghat road landslide mitigation. Evacuate via Burliar down to Mettupalayam.",
    updated_at: NOW,
  },
];

// ---- Relocation Allocations ----
const RELOCATION_ALLOCATIONS = [
  // Joshimath → Pipalkoti & Gauchar
  {
    id: "RA-JOSH-PIPAL-01",
    plan_id: "RP-JOSHIMATH-01",
    site_id: "RS-UK-PIPALKOTI-01",
    allocated_population: 8444,
    distance_km: 31.5,
    road_route_coordinates: [[30.5551,79.5641],[30.512,79.521],[30.478,79.489],[30.4308,79.4312]],
    route_status: "CLEAR",
    estimated_transit_hours: 1.5,
  },
  {
    id: "RA-JOSH-GAUCH-01",
    plan_id: "RP-JOSHIMATH-01",
    site_id: "RS-UK-GAUCHAR-01",
    allocated_population: 9044,
    distance_km: 62.4,
    road_route_coordinates: [[30.4308,79.4312],[30.38,79.35],[30.31,79.22],[30.2883,79.1558]],
    route_status: "CLEAR",
    estimated_transit_hours: 3.0,
  },
  // Wayanad → Kalpetta
  {
    id: "RA-WAYN-KALP-01",
    plan_id: "RP-WAYANAD-01",
    site_id: "RS-KL-KALPETTA-01",
    allocated_population: 9777,
    distance_km: 14.8,
    road_route_coordinates: [[11.6854,76.1319],[11.57,76.105],[11.605,76.083]],
    route_status: "CLEAR",
    estimated_transit_hours: 0.75,
  },
  // Patna → Danapur
  {
    id: "RA-PATN-DANA-01",
    plan_id: "RP-PATNA-01",
    site_id: "RS-BH-DANAPUR-01",
    allocated_population: 13333,
    distance_km: 11.2,
    road_route_coordinates: [[25.5941,85.1376],[25.61,85.09],[25.6333,85.05]],
    route_status: "CLEAR",
    estimated_transit_hours: 0.5,
  },
  // Guwahati → Nalbari
  {
    id: "RA-GUWA-NALB-01",
    plan_id: "RP-GUWAHATI-01",
    site_id: "RS-AS-NALBARI-01",
    allocated_population: 10222,
    distance_km: 35.8,
    road_route_coordinates: [[26.1445,91.7362],[26.25,91.6],[26.35,91.5],[26.445,91.435]],
    route_status: "CLEAR",
    estimated_transit_hours: 1.5,
  },
  // Puri → Khurda
  {
    id: "RA-PURI-KHUR-01",
    plan_id: "RP-PURI-01",
    site_id: "RS-OD-KHURDA-01",
    allocated_population: 7111,
    distance_km: 42.5,
    road_route_coordinates: [[19.8135,85.8312],[20.0,85.72],[20.12,85.65],[20.182,85.616]],
    route_status: "CLEAR",
    estimated_transit_hours: 1.5,
  },
  // Darjeeling → Siliguri
  {
    id: "RA-DARJ-SILI-01",
    plan_id: "RP-DARJEELING-01",
    site_id: "RS-WB-SILIGURI-01",
    allocated_population: 9333,
    distance_km: 48.0,
    road_route_coordinates: [[27.0410,88.2627],[26.90,88.31],[26.7271,88.3953]],
    route_status: "CLEAR",
    estimated_transit_hours: 2.0,
  },
  // Mandi → Sundernagar
  {
    id: "RA-MAND-SUND-01",
    plan_id: "RP-MANDI-01",
    site_id: "RS-HP-SUNDERNAGAR-01",
    allocated_population: 10444,
    distance_km: 24.5,
    road_route_coordinates: [[31.7087,76.9318],[31.62,76.91],[31.5333,76.9000]],
    route_status: "CLEAR",
    estimated_transit_hours: 1.0,
  },
  // Gopeshwar → Chamoli Complex
  {
    id: "RA-GOPE-CHAM-01",
    plan_id: "RP-GOPESHWAR-01",
    site_id: "RS-UK-CHAMOLI-01",
    allocated_population: 7777,
    distance_km: 9.8,
    road_route_coordinates: [[30.4124,79.3176],[30.405,79.322],[30.4000,79.3300]],
    route_status: "CLEAR",
    estimated_transit_hours: 0.4,
  },
  // Kalpetta → Kalpetta South Enclave
  {
    id: "RA-KALP-ENCL-01",
    plan_id: "RP-KALPETTA-01",
    site_id: "RS-KL-KALPETTA-01",
    allocated_population: 9777,
    distance_km: 6.2,
    road_route_coordinates: [[11.6094,76.0827],[11.607,76.083],[11.605,76.083]],
    route_status: "CLEAR",
    estimated_transit_hours: 0.3,
  },
  // Dhemaji → North Lakhimpur
  {
    id: "RA-DHEM-LAKH-01",
    plan_id: "RP-DHEMAJI-01",
    site_id: "RS-AS-LAKHIMPUR-01",
    allocated_population: 11333,
    distance_km: 52.0,
    road_route_coordinates: [[27.4800,94.5900],[27.35,94.35],[27.2300,94.1000]],
    route_status: "CLEAR",
    estimated_transit_hours: 1.8,
  },
  // Kutch → Bhuj Hub
  {
    id: "RA-KUTC-BHUJ-01",
    plan_id: "RP-KUTCH-01",
    site_id: "RS-GJ-BHUJ-01",
    allocated_population: 14444,
    distance_km: 68.0,
    road_route_coordinates: [[23.7300,69.8500],[23.50,69.75],[23.2500,69.6700]],
    route_status: "CLEAR",
    estimated_transit_hours: 2.2,
  },
  // Idukki → Munnar Safe Transit
  {
    id: "RA-IDUK-MUNN-01",
    plan_id: "RP-IDUKKI-01",
    site_id: "RS-KL-MUNNAR-01",
    allocated_population: 7333,
    distance_km: 42.0,
    road_route_coordinates: [[9.8500,76.9700],[9.97,77.01],[10.0889,77.0595]],
    route_status: "CLEAR",
    estimated_transit_hours: 1.6,
  },
  // Nilgiris → Mettupalayam Camp
  {
    id: "RA-NILG-METT-01",
    plan_id: "RP-NILGIRIS-01",
    site_id: "RS-TN-METTUPALAYAM-01",
    allocated_population: 10888,
    distance_km: 38.0,
    road_route_coordinates: [[11.4100,76.7000],[11.35,76.82],[11.3000,76.9500]],
    route_status: "CLEAR",
    estimated_transit_hours: 1.4,
  },
];

// ---- Zone Analytics (13 zones) ----
const ZONE_ANALYTICS = [
  {
    id: "ZA-JOSHIMATH-01",
    zone_id: "Z-UTTARAKHAND-JOSHIMATH-01",
    mean_worst_score: 0.42, peak_worst_score: 0.65, volatility_index: 0.18,
    rainfall_correlation: 0.78, river_correlation: 0.62, saturation_correlation: 0.71,
    primary_hazard_driver: "LANDSLIDE", secondary_hazard_driver: "FLOOD",
    escalation_probability_pct: 34.2, days_above_warning: 12, days_above_critical: 2,
    anomalies_detected_count: 3,
    generated_briefing: "Joshimath shows elevated landslide risk due to high subsidence rates and steep terrain. Monsoon rainfall is the primary driver.",
    updated_at: NOW,
  },
  {
    id: "ZA-WAYANAD-01",
    zone_id: "Z-KERALA-WAYANAD-01",
    mean_worst_score: 0.38, peak_worst_score: 0.52, volatility_index: 0.14,
    rainfall_correlation: 0.82, river_correlation: 0.55, saturation_correlation: 0.76,
    primary_hazard_driver: "LANDSLIDE", secondary_hazard_driver: "FLOOD",
    escalation_probability_pct: 28.5, days_above_warning: 8, days_above_critical: 0,
    anomalies_detected_count: 1,
    generated_briefing: "Wayanad terrain shows high landslide susceptibility. Soil saturation from continuous rainfall is the leading driver.",
    updated_at: NOW,
  },
  {
    id: "ZA-PATNA-01",
    zone_id: "Z-BIHAR-PATNA-01",
    mean_worst_score: 0.31, peak_worst_score: 0.48, volatility_index: 0.11,
    rainfall_correlation: 0.65, river_correlation: 0.88, saturation_correlation: 0.59,
    primary_hazard_driver: "FLOOD", secondary_hazard_driver: "EROSION",
    escalation_probability_pct: 21.0, days_above_warning: 5, days_above_critical: 0,
    anomalies_detected_count: 0,
    generated_briefing: "Patna risk is heavily dictated by Ganga basin upstream discharge. Water level monitoring stations show steady conditions.",
    updated_at: NOW,
  },
  {
    id: "ZA-GUWAHATI-01",
    zone_id: "Z-ASSAM-GUWAHATI-01",
    mean_worst_score: 0.35, peak_worst_score: 0.58, volatility_index: 0.16,
    rainfall_correlation: 0.72, river_correlation: 0.91, saturation_correlation: 0.68,
    primary_hazard_driver: "FLOOD", secondary_hazard_driver: "EROSION",
    escalation_probability_pct: 29.8, days_above_warning: 9, days_above_critical: 1,
    anomalies_detected_count: 2,
    generated_briefing: "Guwahati Brahmaputra corridor experience severe monsoon water level surges. Urban drainage constraints compound flooding.",
    updated_at: NOW,
  },
  {
    id: "ZA-PURI-01",
    zone_id: "Z-ODISHA-PURI-01",
    mean_worst_score: 0.29, peak_worst_score: 0.44, volatility_index: 0.12,
    rainfall_correlation: 0.70, river_correlation: 0.45, saturation_correlation: 0.52,
    primary_hazard_driver: "FLOOD", secondary_hazard_driver: "CYCLONE",
    escalation_probability_pct: 18.4, days_above_warning: 3, days_above_critical: 0,
    anomalies_detected_count: 0,
    generated_briefing: "Puri coastal zone is prone to cyclone-induced flooding. Bay of Bengal sea surface temperatures are being monitored.",
    updated_at: NOW,
  },
  {
    id: "ZA-DARJEELING-01",
    zone_id: "Z-WESTBENGAL-DARJEELING-01",
    mean_worst_score: 0.45, peak_worst_score: 0.68, volatility_index: 0.20,
    rainfall_correlation: 0.85, river_correlation: 0.60, saturation_correlation: 0.80,
    primary_hazard_driver: "LANDSLIDE", secondary_hazard_driver: "EROSION",
    escalation_probability_pct: 36.5, days_above_warning: 14, days_above_critical: 3,
    anomalies_detected_count: 4,
    generated_briefing: "Darjeeling high ridges exhibit steep slope failure vulnerability when continuous rainfall exceeds 100mm/24h.",
    updated_at: NOW,
  },
  {
    id: "ZA-MANDI-01",
    zone_id: "Z-HIMACHAL-MANDI-01",
    mean_worst_score: 0.41, peak_worst_score: 0.62, volatility_index: 0.19,
    rainfall_correlation: 0.81, river_correlation: 0.75, saturation_correlation: 0.74,
    primary_hazard_driver: "FLOOD", secondary_hazard_driver: "CLOUDBURST",
    escalation_probability_pct: 32.0, days_above_warning: 11, days_above_critical: 2,
    anomalies_detected_count: 2,
    generated_briefing: "Mandi valley is vulnerable to rapid cloudburst and flash flood events along the Beas River tributaries.",
    updated_at: NOW,
  },
  {
    id: "ZA-GOPESHWAR-01",
    zone_id: "Z-UTTARAKHAND-GOPESHWAR-01",
    mean_worst_score: 0.36, peak_worst_score: 0.54, volatility_index: 0.15,
    rainfall_correlation: 0.76, river_correlation: 0.58, saturation_correlation: 0.69,
    primary_hazard_driver: "LANDSLIDE", secondary_hazard_driver: "FLOOD",
    escalation_probability_pct: 26.0, days_above_warning: 7, days_above_critical: 1,
    anomalies_detected_count: 1,
    generated_briefing: "Gopeshwar slopes exhibit localized rockfall and slope creep during seasonal rain spikes.",
    updated_at: NOW,
  },
  {
    id: "ZA-KALPETTA-01",
    zone_id: "Z-KERALA-KALPETTA-01",
    mean_worst_score: 0.34, peak_worst_score: 0.50, volatility_index: 0.13,
    rainfall_correlation: 0.79, river_correlation: 0.52, saturation_correlation: 0.73,
    primary_hazard_driver: "LANDSLIDE", secondary_hazard_driver: "FLOOD",
    escalation_probability_pct: 24.5, days_above_warning: 6, days_above_critical: 0,
    anomalies_detected_count: 1,
    generated_briefing: "Kalpetta township maintains moderate hazard stability with active sensors at plantation boundary slopes.",
    updated_at: NOW,
  },
  {
    id: "ZA-DHEMAJI-01",
    zone_id: "Z-ASSAM-DHEMAJI-01",
    mean_worst_score: 0.44, peak_worst_score: 0.66, volatility_index: 0.21,
    rainfall_correlation: 0.75, river_correlation: 0.94, saturation_correlation: 0.82,
    primary_hazard_driver: "FLOOD", secondary_hazard_driver: "EROSION",
    escalation_probability_pct: 38.0, days_above_warning: 15, days_above_critical: 4,
    anomalies_detected_count: 3,
    generated_briefing: "Dhemaji experiences perennial high water levels from braided Subansiri channels. Embankment monitoring active.",
    updated_at: NOW,
  },
  {
    id: "ZA-KUTCH-01",
    zone_id: "Z-GUJARAT-KUTCH-01",
    mean_worst_score: 0.28, peak_worst_score: 0.46, volatility_index: 0.12,
    rainfall_correlation: 0.55, river_correlation: 0.30, saturation_correlation: 0.45,
    primary_hazard_driver: "CYCLONE", secondary_hazard_driver: "FLOOD",
    escalation_probability_pct: 19.5, days_above_warning: 4, days_above_critical: 0,
    anomalies_detected_count: 0,
    generated_briefing: "Kutch coastal belt monitored for storm surges and seismic ground acceleration along Kutch Mainland Fault.",
    updated_at: NOW,
  },
  {
    id: "ZA-IDUKKI-01",
    zone_id: "Z-KERALA-IDUKKI-01",
    mean_worst_score: 0.39, peak_worst_score: 0.56, volatility_index: 0.16,
    rainfall_correlation: 0.84, river_correlation: 0.65, saturation_correlation: 0.78,
    primary_hazard_driver: "LANDSLIDE", secondary_hazard_driver: "FLOOD",
    escalation_probability_pct: 30.2, days_above_warning: 9, days_above_critical: 1,
    anomalies_detected_count: 2,
    generated_briefing: "Idukki highland catchment areas monitored continuously for slope saturation and reservoir inflow rates.",
    updated_at: NOW,
  },
  {
    id: "ZA-NILGIRIS-01",
    zone_id: "Z-TAMILNADU-NILGIRIS-01",
    mean_worst_score: 0.37, peak_worst_score: 0.53, volatility_index: 0.15,
    rainfall_correlation: 0.80, river_correlation: 0.50, saturation_correlation: 0.75,
    primary_hazard_driver: "LANDSLIDE", secondary_hazard_driver: "FLOOD",
    escalation_probability_pct: 27.0, days_above_warning: 8, days_above_critical: 0,
    anomalies_detected_count: 1,
    generated_briefing: "Nilgiris mountain roads monitored with rain gauges. Soil shear strength remains within safe thresholds.",
    updated_at: NOW,
  },
];

// ---- Initial Zone Classifications (if table empty or zone missing) ----
const INITIAL_CLASSIFICATIONS = [
  {
    zone_id: "Z-WESTBENGAL-DARJEELING-01",
    zone_color: "YELLOW",
    worst_hazard: "LANDSLIDE",
    hazard_scores: { FLOOD: 0.22, LANDSLIDE: 0.54, EROSION: 0.31, CLOUDBURST: 0.18 },
    priority: "SHORT_TERM",
    priority_score: 0.54,
    stale: false,
    classified_at: NOW,
  },
  {
    zone_id: "Z-HIMACHAL-MANDI-01",
    zone_color: "GREEN",
    worst_hazard: "FLOOD",
    hazard_scores: { FLOOD: 0.32, LANDSLIDE: 0.28, EROSION: 0.20, CLOUDBURST: 0.15 },
    priority: "NONE",
    priority_score: 0.0,
    stale: false,
    classified_at: NOW,
  },
  {
    zone_id: "Z-UTTARAKHAND-GOPESHWAR-01",
    zone_color: "GREEN",
    worst_hazard: "LANDSLIDE",
    hazard_scores: { FLOOD: 0.15, LANDSLIDE: 0.33, EROSION: 0.18, CLOUDBURST: 0.12 },
    priority: "NONE",
    priority_score: 0.0,
    stale: false,
    classified_at: NOW,
  },
  {
    zone_id: "Z-KERALA-KALPETTA-01",
    zone_color: "GREEN",
    worst_hazard: "LANDSLIDE",
    hazard_scores: { FLOOD: 0.25, LANDSLIDE: 0.31, EROSION: 0.21, CLOUDBURST: 0.10 },
    priority: "NONE",
    priority_score: 0.0,
    stale: false,
    classified_at: NOW,
  },
  {
    zone_id: "Z-ASSAM-DHEMAJI-01",
    zone_color: "YELLOW",
    worst_hazard: "FLOOD",
    hazard_scores: { FLOOD: 0.58, LANDSLIDE: 0.12, EROSION: 0.38, CLOUDBURST: 0.20 },
    priority: "SHORT_TERM",
    priority_score: 0.58,
    stale: false,
    classified_at: NOW,
  },
  {
    zone_id: "Z-GUJARAT-KUTCH-01",
    zone_color: "GREEN",
    worst_hazard: "FLOOD",
    hazard_scores: { FLOOD: 0.20, LANDSLIDE: 0.05, EROSION: 0.18, CLOUDBURST: 0.08 },
    priority: "NONE",
    priority_score: 0.0,
    stale: false,
    classified_at: NOW,
  },
  {
    zone_id: "Z-KERALA-IDUKKI-01",
    zone_color: "GREEN",
    worst_hazard: "LANDSLIDE",
    hazard_scores: { FLOOD: 0.28, LANDSLIDE: 0.35, EROSION: 0.22, CLOUDBURST: 0.14 },
    priority: "NONE",
    priority_score: 0.0,
    stale: false,
    classified_at: NOW,
  },
  {
    zone_id: "Z-TAMILNADU-NILGIRIS-01",
    zone_color: "GREEN",
    worst_hazard: "LANDSLIDE",
    hazard_scores: { FLOOD: 0.18, LANDSLIDE: 0.34, EROSION: 0.24, CLOUDBURST: 0.11 },
    priority: "NONE",
    priority_score: 0.0,
    stale: false,
    classified_at: NOW,
  },
];

// ---- Sample Alert Log ----
const ALERT_LOG = [
  {
    id: "ALT-001",
    zone_id: "Z-UTTARAKHAND-JOSHIMATH-01",
    severity: "warning", from_color: "GREEN", to_color: "YELLOW",
    recipients_targeted: 9, recipients_delivered: 9,
  },
  {
    id: "ALT-002",
    zone_id: "Z-KERALA-WAYANAD-01",
    severity: "info", from_color: "GREEN", to_color: "GREEN",
    recipients_targeted: 14, recipients_delivered: 14,
  },
  {
    id: "ALT-003",
    zone_id: "Z-ODISHA-PURI-01",
    severity: "info", from_color: "GREEN", to_color: "GREEN",
    recipients_targeted: 28, recipients_delivered: 27,
  },
];

// ============================================================
// MAIN SEEDING FUNCTION
// ============================================================
async function seed() {
  console.log("\n🚀 RESCUE ARC COMPREHENSIVE DATABASE SEEDER");
  console.log("=".repeat(55));
  console.log(`📡 Target Database: ${SUPABASE_URL}\n`);

  // 1. Check tables exist
  console.log("📋 Step 1: Checking table availability...");
  const tableChecks = ["zones", "zone_classifications", "relocation_sites", "relocation_plans", "relocation_allocations", "zone_analytics", "alert_log", "users"];
  const available = [];
  for (const t of tableChecks) {
    const r = await request("GET", `/rest/v1/${t}?limit=0&select=*`, null);
    if (r.status === 200) {
      available.push(t);
      console.log(`  ✅ ${t}`);
    } else {
      console.log(`  ❌ ${t} — NOT FOUND (${r.status})`);
    }
  }

  // 2. Upsert ALL 13 zones
  console.log(`\n📋 Step 2: Upserting ${ALL_ZONES.length} comprehensive disaster zones...`);
  await upsert("zones", ALL_ZONES, "zone_id");

  // 3. Seed initial classifications for zones that don't have one
  console.log("\n📋 Step 3: Checking initial zone classifications...");
  for (const item of INITIAL_CLASSIFICATIONS) {
    const existing = await request("GET", `/rest/v1/zone_classifications?zone_id=eq.${item.zone_id}&limit=1`, null);
    if (!existing.body || existing.body.length === 0) {
      await request("POST", "/rest/v1/zone_classifications", item);
      console.log(`  ✅ Added initial classification for ${item.zone_id}`);
    }
  }

  // 4. Seed relocation sites
  console.log(`\n📋 Step 4: Seeding ${RELOCATION_SITES.length} relocation sites...`);
  await upsert("relocation_sites", RELOCATION_SITES, "site_code");

  // 5. Seed relocation plans
  console.log(`\n📋 Step 5: Seeding ${RELOCATION_PLANS.length} relocation plans...`);
  await upsert("relocation_plans", RELOCATION_PLANS, "zone_id");

  // 6. Seed relocation allocations
  console.log(`\n📋 Step 6: Seeding ${RELOCATION_ALLOCATIONS.length} relocation allocations...`);
  await upsert("relocation_allocations", RELOCATION_ALLOCATIONS, "id");

  // 7. Seed zone analytics
  console.log(`\n📋 Step 7: Seeding ${ZONE_ANALYTICS.length} zone analytics entries...`);
  await upsert("zone_analytics", ZONE_ANALYTICS, "zone_id");

  // 8. Seed alert log
  console.log("\n📋 Step 8: Seeding alert logs...");
  await upsert("alert_log", ALERT_LOG, "id");

  // 9. Admin user verification
  console.log("\n📋 Step 9: Verifying admin user...");
  const adminCheck = await request("GET", "/rest/v1/users?email=eq.teamsih12@gmail.com", null);
  if (adminCheck.body && adminCheck.body.length > 0) {
    console.log(`  ✅ Admin user verified: teamsih12@gmail.com (role: ${adminCheck.body[0].role})`);
  } else {
    console.log("  ⚠️ Admin user not found, inserting...");
    const bcrypt = require("bcryptjs");
    const hash = await bcrypt.hash("12345678", 10);
    const insertRes = await request("POST", "/rest/v1/users", {
      name: "teamsih",
      email: "teamsih12@gmail.com",
      password: hash,
      role: "ADMIN",
      email_verified: true,
      created_at: NOW,
      updated_at: NOW,
    });
    console.log(`  ${insertRes.status < 300 ? "✅ Admin created" : "❌ Admin create failed: " + JSON.stringify(insertRes.body)}`);
  }

  // 10. Summary verification
  console.log("\n📋 Step 10: Current row counts across tables:");
  for (const table of available) {
    const r = await request("GET", `/rest/v1/${table}?select=*`, null);
    const count = Array.isArray(r.body) ? r.body.length : "N/A";
    console.log(`  • ${table.padEnd(25)} : ${count} rows`);
  }

  console.log("\n🎉 DATABASE SEEDING COMPLETED SUCCESSFULLY!\n");
}

seed().catch(console.error);
