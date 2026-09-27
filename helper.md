TEST DB POOLER 

// Quick connectivity test via pg (raw)
const { Client } = require('pg');

const client = new Client({
  connectionString: 'postgresql://postgres.lkxnxvkivmfmuvemrpxg:Teamsih%40200326@aws-0-ap-northeast-1.pooler.supabase.com:6543/postgres',
  ssl: { rejectUnauthorized: false },
  connectionTimeoutMillis: 10000,
});

async function main() {
  try {
    await client.connect();
    console.log('✅ Connected successfully!');
    
    // List all tables
    const res = await client.query(`
      SELECT table_name FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name;
    `);
    console.log('Tables in DB:', res.rows.map(r => r.table_name));
    
    // Check Zone columns
    const cols = await client.query(`
      SELECT column_name, data_type FROM information_schema.columns 
      WHERE table_schema = 'public' AND table_name = 'Zone'
      ORDER BY ordinal_position;
    `);
    console.log('\nZone columns:', cols.rows.map(r => r.column_name + ':' + r.data_type));
    
  } catch(e) {
    console.error('❌ Error:', e.message);
  } finally {
    await client.end();
  }
}

main();

TEST SUPABASE REST 

// Test Supabase REST API to see what tables and columns exist
const https = require('https');

const SUPABASE_URL = 'https://jxitjpimiompwifxguch.supabase.co';
const SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp4aXRqcGltaW9tcHdpZnhndWNoIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc5MDI1MTYzNCwiZXhwIjoyMTA1ODI3NjM0fQ.QT7Lrxy1VHySl8hLiU33ORGBwCfEuhJmDNh4Y_5I9Ao';

function fetch(url, headers) {
  return new Promise((resolve, reject) => {
    const req = https.get(url, { headers }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try { resolve({ status: res.statusCode, data: JSON.parse(data) }); }
        catch { resolve({ status: res.statusCode, data }); }
      });
    });
    req.on('error', reject);
    req.setTimeout(10000, () => { req.destroy(); reject(new Error('timeout')); });
  });
}

async function main() {
  const headers = {
    'apikey': SERVICE_KEY,
    'Authorization': `Bearer ${SERVICE_KEY}`,
    'Content-Type': 'application/json'
  };

  // Try to get Zone table columns via a limited query
  console.log('Testing REST API connectivity...');
  
  // Fetch Zone rows (limit 1) to see structure
  try {
    const r1 = await fetch(`${SUPABASE_URL}/rest/v1/Zone?limit=1&select=*`, headers);
    console.log('Zone table status:', r1.status);
    if (r1.status === 200) {
      console.log('Zone columns:', r1.data.length > 0 ? Object.keys(r1.data[0]) : 'empty table');
    } else {
      console.log('Zone response:', JSON.stringify(r1.data).substring(0, 300));
    }
  } catch(e) { console.error('Zone query error:', e.message); }

  // Try lowercase zone
  try {
    const r2 = await fetch(`${SUPABASE_URL}/rest/v1/zone?limit=1&select=*`, headers);
    console.log('\nzone (lowercase) status:', r2.status);
    if (r2.status === 200) {
      console.log('zone columns:', r2.data.length > 0 ? Object.keys(r2.data[0]) : 'empty table - but connected!');
    } else {
      console.log('zone response:', JSON.stringify(r2.data).substring(0, 300));
    }
  } catch(e) { console.error('zone query error:', e.message); }

  // Try RelocationSite
  try {
    const r3 = await fetch(`${SUPABASE_URL}/rest/v1/RelocationSite?limit=1&select=*`, headers);
    console.log('\nRelocationSite status:', r3.status);
    if (r3.status === 200) {
      console.log('RelocationSite columns:', r3.data.length > 0 ? Object.keys(r3.data[0]) : 'empty table');
    } else {
      console.log('RelocationSite response:', JSON.stringify(r3.data).substring(0, 300));
    }
  } catch(e) { console.error('RelocationSite error:', e.message); }

  // Check habitations table which we know exists
  try {
    const r4 = await fetch(`${SUPABASE_URL}/rest/v1/habitations?limit=1&select=*`, headers);
    console.log('\nhabitations status:', r4.status);
    if (r4.status === 200) {
      console.log('habitations columns:', r4.data.length > 0 ? Object.keys(r4.data[0]) : 'empty table');
    } else {
      console.log('habitations response:', JSON.stringify(r4.data).substring(0, 300));
    }
  } catch(e) { console.error('habitations error:', e.message); }
}

main();

CHECK SUPABASE TABLES 

// Check what tables exist in BOTH Supabase projects
const https = require('https');

// Project 1: lkxnxvkivmfmuvemrpxg (used in .env for Prisma)
// Project 2: jxitjpimiompwifxguch (used in Python backend)

const PROJECTS = [
  {
    name: 'lkxnxvkivmfmuvemrpxg (Prisma DB)',
    url: 'https://lkxnxvkivmfmuvemrpxg.supabase.co',
    // We don't have the anon key for this one, try anon queries
    key: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJyb2xlIjoiYW5vbiIsImlzcyI6InN1cGFiYXNlIiwiaWF0IjoxNzUzMTI2ODAwLCJleHAiOjE5MTA4OTMyMDB9.QYeFMOeF2K2LxnHoH3_O6GnUyWFUJtJ0YCTfZM5aMts'
  },
  {
    name: 'jxitjpimiompwifxguch (Python Backend DB)',
    url: 'https://jxitjpimiompwifxguch.supabase.co',
    key: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp4aXRqcGltaW9tcHdpZnhndWNoIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc5MDI1MTYzNCwiZXhwIjoyMTA1ODI3NjM0fQ.QT7Lrxy1VHySl8hLiU33ORGBwCfEuhJmDNh4Y_5I9Ao'
  }
];

const TABLES_TO_CHECK = [
  'Zone', 'zone', 'zones', 'zone_classifications',
  'RelocationSite', 'relocation_site', 'relocation_sites',
  'RelocationPlan', 'relocation_plan', 'relocation_plans',
  'HazardHistory', 'hazard_history', 'hazard_histories',
  'HazardReading', 'hazard_reading',
  'ZoneAnalytics', 'zone_analytics',
  'habitations', 'regions',
  'User', 'users'
];

function fetch(url, headers) {
  return new Promise((resolve, reject) => {
    const req = https.get(url, { headers }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try { resolve({ status: res.statusCode, data: JSON.parse(data) }); }
        catch { resolve({ status: res.statusCode, data }); }
      });
    });
    req.on('error', reject);
    req.setTimeout(10000, () => { req.destroy(); reject(new Error('timeout')); });
  });
}

async function checkProject(project) {
  console.log(`\n=== ${project.name} ===`);
  const headers = {
    'apikey': project.key,
    'Authorization': `Bearer ${project.key}`,
  };

  const found = [];
  for (const table of TABLES_TO_CHECK) {
    try {
      const r = await fetch(`${project.url}/rest/v1/${table}?limit=1&select=*`, headers);
      if (r.status === 200) {
        const cols = Array.isArray(r.data) && r.data.length > 0 ? Object.keys(r.data[0]) : ['(empty table)'];
        found.push(`✅ ${table}: [${cols.join(', ')}]`);
      }
    } catch(e) {}
  }
  
  if (found.length === 0) {
    console.log('  No accessible tables found (check key or RLS)');
  } else {
    found.forEach(f => console.log(' ', f));
  }
}

async function main() {
  for (const p of PROJECTS) {
    await checkProject(p);
  }
}

main().catch(console.error);

DEPP INSPECT DB 

// Deep inspection of jxitjpimiompwifxguch Supabase project
const https = require('https');

const SUPABASE_URL = 'https://jxitjpimiompwifxguch.supabase.co';
const SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp4aXRqcGltaW9tcHdpZnhndWNoIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc5MDI1MTYzNCwiZXhwIjoyMTA1ODI3NjM0fQ.QT7Lrxy1VHySl8hLiU33ORGBwCfEuhJmDNh4Y_5I9Ao';

function fetch(url, headers) {
  return new Promise((resolve, reject) => {
    const req = https.get(url, { headers }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try { resolve({ status: res.statusCode, data: JSON.parse(data) }); }
        catch { resolve({ status: res.statusCode, data }); }
      });
    });
    req.on('error', reject);
    req.setTimeout(10000, () => { req.destroy(); reject(new Error('timeout')); });
  });
}

async function main() {
  const headers = {
    'apikey': SERVICE_KEY,
    'Authorization': `Bearer ${SERVICE_KEY}`,
    'Content-Type': 'application/json',
    'Prefer': 'count=exact'
  };

  // Get zones with full data
  const zonesRes = await fetch(`${SUPABASE_URL}/rest/v1/zones?select=*`, headers);
  console.log(`\nzones table (${zonesRes.status}):`, JSON.stringify(zonesRes.data, null, 2).substring(0, 2000));
  
  // Get zone_classifications with full data  
  const classRes = await fetch(`${SUPABASE_URL}/rest/v1/zone_classifications?select=*`, headers);
  console.log(`\nzone_classifications table (${classRes.status}):`, JSON.stringify(classRes.data, null, 2).substring(0, 3000));

  // Check for relocation tables with various naming
  const tables = ['relocation_sites', 'relocation_plans', 'hazard_history', 'hazard_histories', 
                  'hazard_readings', 'habitations', 'User', 'users', '_User', 'profiles',
                  'alerts', 'alert_log', 'subscribers', 'rag_documents', 'rag_document_log',
                  'regions', 'spatial_ref_sys'];
  
  console.log('\n=== Checking other tables ===');
  for (const t of tables) {
    const r = await fetch(`${SUPABASE_URL}/rest/v1/${t}?limit=1`, headers);
    if (r.status === 200) {
      const cols = Array.isArray(r.data) && r.data.length > 0 ? Object.keys(r.data[0]) : ['empty'];
      console.log(`✅ ${t}: [${cols.join(', ')}]`);
    }
  }
}

main().catch(console.error);

TEST PIPELINE 

// Simulate what data-service.ts now does — test full zone pipeline via REST
const https = require('https');

const SUPABASE_URL = 'https://jxitjpimiompwifxguch.supabase.co';
const SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp4aXRqcGltaW9tcHdpZnhndWNoIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc5MDI1MTYzNCwiZXhwIjoyMTA1ODI3NjM0fQ.QT7Lrxy1VHySl8hLiU33ORGBwCfEuhJmDNh4Y_5I9Ao';
const HEADERS = { apikey: SERVICE_KEY, Authorization: `Bearer ${SERVICE_KEY}` };

function get(url) {
  return new Promise((resolve, reject) => {
    const req = https.get(url, { headers: HEADERS }, res => {
      let d = '';
      res.on('data', c => d += c);
      res.on('end', () => resolve(JSON.parse(d)));
    });
    req.on('error', reject);
    req.setTimeout(10000, () => { req.destroy(); reject(new Error('timeout')); });
  });
}

async function main() {
  console.log('=== Testing Live Database Pipeline ===\n');
  
  const [zones, classifications] = await Promise.all([
    get(`${SUPABASE_URL}/rest/v1/zones?select=*`),
    get(`${SUPABASE_URL}/rest/v1/zone_classifications?select=*&order=classified_at.desc`),
  ]);
  
  console.log(`✅ Fetched ${zones.length} zones and ${classifications.length} classifications`);
  
  // Group latest classification per zone
  const latestByZone = {};
  for (const cls of classifications) {
    if (!latestByZone[cls.zone_id]) latestByZone[cls.zone_id] = cls;
  }
  
  console.log('\n=== Enriched Zones (as frontend would see them) ===');
  for (const zone of zones) {
    const cls = latestByZone[zone.zone_id];
    const scores = cls ? JSON.parse(cls.hazard_scores || '{}') : {};
    const worstScore = Math.max(...Object.values(scores).map(Number), 0);
    const lat = ((zone.min_lat || 0) + (zone.max_lat || 0)) / 2;
    const lng = ((zone.min_lon || 0) + (zone.max_lon || 0)) / 2;
    
    console.log(`\n📍 ${zone.name} (${zone.zone_id})`);
    console.log(`   Color: ${cls?.zone_color ?? 'N/A'} | Hazard: ${cls?.worst_hazard ?? 'N/A'} | Score: ${worstScore.toFixed(3)}`);
    console.log(`   Priority: ${cls?.priority ?? 'N/A'} (${cls?.priority_score ?? 0})`);
    console.log(`   Lat/Lng: ${lat.toFixed(4)}, ${lng.toFixed(4)}`);
    console.log(`   Scores: FLOOD=${scores.FLOOD?.toFixed(3) ?? '-'} LAND=${scores.LANDSLIDE?.toFixed(3) ?? '-'} EROSION=${scores.EROSION?.toFixed(3) ?? '-'} CB=${scores.CLOUDBURST?.toFixed(3) ?? '-'}`);
    console.log(`   Classified: ${cls?.classified_at ?? 'never'}`);
  }
  
  console.log('\n\n=== Version Check ===');
  const latestCls = get(`${SUPABASE_URL}/rest/v1/zone_classifications?order=classified_at.desc&limit=1`);
  const ver = await latestCls;
  console.log(`Latest update: ${ver[0]?.classified_at}`);
  console.log('\n✅ All data loads successfully from live database!');
}

main().catch(console.error);

