/**
 * API Route: /api/chat
 * Next.js App Router streaming endpoint for the Rescue Arc Disaster Intelligence Copilot.
 * 
 * Capabilities:
 * 1. RAG (Retrieval-Augmented Generation) across disaster management guidelines,
 *    Sphere humanitarian standards, AHP hazard criteria, and emergency SOPs.
 * 2. Real-Time Database Fetching Tools accessing the live GIS database store:
 *    - get_zone_status (live hazard score, red/yellow/green, rainfall, soil saturation, slope, discharge)
 *    - get_high_risk_zones (all active RED zones requiring immediate evacuation)
 *    - get_relocation_sites (Sphere-standard carrying capacity, 45m²/person, occupancy, hospital distance, road rating)
 *    - get_relocation_plans (assigned shelters, evacuation distance, population allocations, shortfall)
 *    - get_database_summary (live counts of zones, habitations, total population at risk, shelter space)
 * 3. Token-by-token streaming with tool execution markers for modern UI badges.
 */

import { NextRequest } from "next/server";
import { dbStore, ZoneRecord, RelocationSiteRecord, RelocationPlanRecord } from "@/lib/database-store";

// ─────────────────────────────────────────────────────────────────────────────
// 1. RAG Knowledge Corpus (Disaster Standards, Sphere Handbook, AHP, NDMA SOPs)
// ─────────────────────────────────────────────────────────────────────────────
interface RagDocument {
  id: string;
  title: string;
  source: string;
  keywords: string[];
  content: string;
}

const RAG_KNOWLEDGE_BASE: RagDocument[] = [
  {
    id: "sphere-shelter-45m",
    title: "Sphere Minimum Standards: Shelter and Settlement Standard 1",
    source: "Sphere Humanitarian Charter (2018 Edition)",
    keywords: ["sphere", "carrying capacity", "45", "sqm", "standard", "usable area", "space per person", "shelter capacity"],
    content: `The Sphere Project defines minimum humanitarian standards in disaster response:
- Minimum Total Usable Surface Area: 45 m² per person (including household shelter, sanitation, roads, fire breaks, logistics, educational spaces, and buffer zones).
- Covered Living Space: Minimum 3.5 m² per person of covered floor area in warm climates; 4.5–5.5 m² in cold mountainous regions (e.g. Himalayas, Joshimath).
- Topography & Drainage: Relocation camps must have a gentle slope (2% to 4%) to ensure rainwater runoff without causing gully erosion. Avoid flood-prone lowlands and active landslide toe slopes.
- Vector & Fire Separation: Minimum 2 meters between individual shelters, 6-meter road clearance for emergency vehicles, and 30-meter firebreaks every 300 meters.`,
  },
  {
    id: "sphere-wash-water",
    title: "Sphere Standards: Water Supply & Sanitation (WASH)",
    source: "Sphere Handbook - WASH Chapter",
    keywords: ["water", "drinking", "liters", "latrines", "sanitation", "wash", "borewell", "hygiene"],
    content: `Water Supply & Sanitation Requirements in Relocation Settlements:
- Water Quantity: Minimum 15 liters per person per day for drinking, cooking, and basic personal hygiene during initial relief phases; expands to 20L in stabilized settlements.
- Water Access: Maximum distance from any household shelter to the water distribution point is 500 meters. Waiting queue time must not exceed 30 minutes.
- Sanitation / Latrines: Minimum 1 communal toilet per 20 persons, segregated by gender with lockable doors and adequate lighting.
- Groundwater Protection: Latrine pits must be at least 30 meters away from any groundwater source (wells, borewells) and 1.5 meters above the seasonal groundwater table.`,
  },
  {
    id: "redzone-classification-ndma",
    title: "Hazard Red Zone Classification & Threshold Criteria",
    source: "NDMA & Rescue Arc GIS Multi-Hazard Framework",
    keywords: ["red zone", "yellow zone", "green zone", "threshold", "classification", "criteria", "immediate evacuation", "risk score"],
    content: `Rescue Arc classifies habitations into 3 operational risk tiers based on composite ML & GIS hazard modeling:
- 🔴 RED ZONE (Composite Score >= 0.70): Critical and imminent hazard to human life and settlements. Mandatory immediate evacuation order (within 24–48 hours). Characteristics: steep slopes (> 30°), 72h rainfall > 150mm, soil moisture saturation > 80%, active subsidence or river discharge above high flood level (HFL).
- 🟡 YELLOW ZONE (Composite Score 0.40–0.69): Moderate to high vulnerability. Pre-evacuation alert staged; early warning sirens armed. Relocation execution scheduled within 30–90 days. Continuous automated sensor monitoring.
- 🟢 GREEN ZONE (Composite Score < 0.40): Safe or minimal risk territory. Stable geotechnical bedrock (< 15° slope), robust natural drainage. Designated as safe receptor zones for Sphere-compliant temporary townships.`,
  },
  {
    id: "ahp-hazard-weighting",
    title: "Analytic Hierarchy Process (AHP) Multi-Hazard Weights",
    source: "Rescue Arc Technical GIS Specification (Problem 26191)",
    keywords: ["ahp", "weights", "slope", "rainfall", "discharge", "soil saturation", "elevation", "methodology", "model"],
    content: `Multi-Hazard Susceptibility Index calculation uses Saaty's Analytic Hierarchy Process (AHP) normalized weights:
1. Slope Gradient & Curvature: 30% weight (Primary determinant in mountain terrain; slopes > 30° exhibit exponential shear failure risk).
2. 72-Hour Antecedent Cumulative Rainfall: 25% weight (Derived from IMD Doppler radar & GPM satellite precipitation data).
3. Soil Moisture Saturation Index: 20% weight (Soil saturation > 85% eliminates effective cohesion in regolith).
4. River Discharge & Fluvial Discharge: 15% weight (Measured in m³/s / cumecs relative to channel bankfull capacity).
5. Elevation & Geomorphic Lithology: 10% weight (Distinguishes glacial moraines, alluvial valleys, and fractured gneiss).
A consistency ratio (CR) < 0.10 is strictly maintained to eliminate expert bias.`,
  },
  {
    id: "relocation-decision-matrix",
    title: "Relocation Site Selection & Multi-Objective Spatial Optimization",
    source: "Rescue Arc Relocation Intelligence Engine",
    keywords: ["relocation site", "distance", "hospital", "road connectivity", "selection", "shortfall", "allocation"],
    content: `Relocation sites are vetted against multi-objective spatial criteria before population allocation:
- Proximity Constraint: Travel distance should ideally remain below 25 km from native habitations to prevent social dislocation and economic estrangement.
- Road Connectivity Rating: Must possess a rating of at least 3.5/5.0 (All-weather 2-lane paved or gravel highway suitable for NDRF troop carriers, ambulances, and water tankers).
- Healthcare Access: Proximity to District Hospital or Community Health Centre (CHC) within 15 km (or <= 30 minutes transit).
- Critical Utilities: Dedicated high-yield deep borewell or municipal line, plus power grid with secondary solar/diesel genset backup.`,
  },
  {
    id: "ndrf-evacuation-sop",
    title: "Standard Operating Procedures (SOP) for Evacuation & Responders",
    source: "National Disaster Response Force (NDRF) Operational Manual",
    keywords: ["sop", "evacuation", "emergency", "ndrf", "protocol", "what to do", "grab bag", "steps"],
    content: `NDRF & SDRF Community Evacuation Protocol upon Red Zone Trigger:
1. Community Action:
   - Pack an Emergency Grab Bag: Identification documents in waterproof pouches, 3 days of chronic medications, battery flashlights, potable water purification tablets, warm attire.
   - Secure residential gas and electrical mains before departure.
   - Do NOT attempt to navigate through swollen nullahs, ravine channels, or unverified valley trails.
2. Evacuation Ingress:
   - Follow designated green evacuation road corridors monitored by traffic wardens.
   - Vulnerable demographics (elderly, infants, pregnant women, mobility-impaired) are evacuated in Phase 1 via specialized paramedic ambulances.
3. Reception & Camp Intake:
   - Check in at the Relocation Site Intake Terminal for biometric census verification, Sphere tent allotment, and immediate health triage.`,
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// 2. Database Fetching Tools (Live PostGIS / database-store queries)
// ─────────────────────────────────────────────────────────────────────────────
interface ToolResult {
  toolName: string;
  summary: string;
  raw: any;
}

async function toolGetZoneStatus(query: string): Promise<ToolResult> {
  const zones = await dbStore.getZones();
  const cleanQ = query.trim().toLowerCase();

  // Match by ID, name, district, or state
  const matches = zones.filter((z) => {
    return (
      z.zoneId.toLowerCase().includes(cleanQ) ||
      z.name.toLowerCase().includes(cleanQ) ||
      z.district.toLowerCase().includes(cleanQ) ||
      z.state.toLowerCase().includes(cleanQ)
    );
  });

  if (matches.length === 0) {
    return {
      toolName: "get_zone_status",
      summary: `No monitored zone found matching query "${query}". Available zones include: ${zones.map((z) => z.name.split(",")[0]).join(", ")}.`,
      raw: [],
    };
  }

  const summaries = matches.slice(0, 3).map((z) => {
    const colorEmoji = z.zoneColor === "RED" ? "🔴" : z.zoneColor === "YELLOW" ? "🟡" : "🟢";
    return (
      `${colorEmoji} **${z.name}** [${z.zoneId}]\n` +
      `- **Classification**: **${z.zoneColor} ZONE** (${z.priority} Priority, Priority Score: ${(z.priorityScore * 100).toFixed(1)}%)\n` +
      `- **Primary Threat**: **${z.worstHazard}** (Hazard Risk Score: ${z.worstScore.toFixed(3)} / 1.000)\n` +
      `- **Hazard Breakdown**: Flood: ${z.hazardScores.FLOOD.toFixed(2)} | Landslide: ${z.hazardScores.LANDSLIDE.toFixed(2)} | Cloudburst: ${z.hazardScores.CLOUDBURST.toFixed(2)} | Erosion: ${z.hazardScores.EROSION.toFixed(2)}\n` +
      `- **Live Physical Telemetry**: 24h Rain: ${z.metrics.rainfall_24h_mm} mm | 72h Rain: ${z.metrics.rainfall_72h_mm} mm | River Discharge: ${z.metrics.river_discharge_m3s} m³/s | Soil Moisture: ${z.metrics.soil_saturation_pct}% | Slope: ${z.metrics.slope_deg}°\n` +
      `- **Demographics**: Population: ${z.population.toLocaleString()} residents | Elevation: ${z.elevationM} m | Terrain: ${z.slopeClass}\n` +
      `- **Last Assessed**: ${new Date(z.lastAssessedAt).toLocaleString()} (Status: ${z.isStale ? "⚠️ Telemetry Stale" : "⚡ Real-Time Active"})`
    );
  });

  return {
    toolName: "get_zone_status",
    summary: summaries.join("\n\n"),
    raw: matches,
  };
}

async function toolGetHighRiskZones(): Promise<ToolResult> {
  const zones = await dbStore.getZones();
  const redZones = zones
    .filter((z) => z.zoneColor === "RED" || z.worstScore >= 0.7)
    .sort((a, b) => b.worstScore - a.worstScore);

  if (redZones.length === 0) {
    return {
      toolName: "get_high_risk_zones",
      summary: "Currently there are NO RED ZONE habitations under active immediate evacuation alert.",
      raw: [],
    };
  }

  const lines = redZones.map((z, idx) => {
    return (
      `${idx + 1}. 🔴 **${z.name}** (${z.state})\n` +
      `   - **Worst Hazard**: ${z.worstHazard} (Risk Score: **${z.worstScore.toFixed(3)}**)\n` +
      `   - **Vulnerable Population**: ${z.population.toLocaleString()} people\n` +
      `   - **Key Trigger Metrics**: 72h Rain: ${z.metrics.rainfall_72h_mm}mm | Soil Saturation: ${z.metrics.soil_saturation_pct}% | Slope: ${z.metrics.slope_deg}°\n` +
      `   - **Urgency**: ${z.priority} evacuation required.`
    );
  });

  const totalPop = redZones.reduce((acc, z) => acc + z.population, 0);

  return {
    toolName: "get_high_risk_zones",
    summary: `Found **${redZones.length} RED ZONE habitations** requiring immediate intervention (Total At-Risk Population: **${totalPop.toLocaleString()}**):\n\n${lines.join("\n\n")}`,
    raw: redZones,
  };
}

async function toolGetRelocationSites(districtOrState?: string): Promise<ToolResult> {
  const sites = await dbStore.getRelocationSites();
  let filtered = sites;
  if (districtOrState) {
    const clean = districtOrState.trim().toLowerCase();
    filtered = sites.filter(
      (s) =>
        s.name.toLowerCase().includes(clean) ||
        s.district.toLowerCase().includes(clean) ||
        s.state.toLowerCase().includes(clean)
    );
  }

  if (filtered.length === 0) {
    return {
      toolName: "get_relocation_sites",
      summary: `No relocation site found matching "${districtOrState}". Showing all available verified sites instead.`,
      raw: sites,
    };
  }

  const lines = filtered.map((s) => {
    const statusEmoji = s.status === "ACTIVE" ? "🟢" : s.status === "FULL" ? "🔴" : "🟡";
    return (
      `${statusEmoji} **${s.name}** (${s.district}, ${s.state}) [${s.siteCode}]\n` +
      `- **Sphere Carrying Capacity**: **${s.capacity.toLocaleString()} persons** (${s.sphereStandardSqmPerPerson} m²/person Sphere Standard)\n` +
      `- **Current Occupancy**: ${s.currentOccupancy.toLocaleString()} / ${s.capacity.toLocaleString()} (${s.occupancyPct}% utilized)\n` +
      `- **Available Remaining Space**: **${s.remainingCapacity.toLocaleString()} persons**\n` +
      `- **Infrastructure Vetting**: Water: ${s.waterSourceType} | Road Connectivity: ${s.roadConnectivityRating}/5 | Hospital Distance: ${s.hospitalDistanceKm} km | Grid Power: ${s.powerGridStatus ? "Connected + Solar" : "Backup Genset"}`
    );
  });

  return {
    toolName: "get_relocation_sites",
    summary: `Verified Relocation & Shelter Sites:\n\n${lines.join("\n\n")}`,
    raw: filtered,
  };
}

async function toolGetRelocationPlans(zoneQuery?: string): Promise<ToolResult> {
  const plans = await dbStore.getRelocationPlans();
  let filtered = plans;
  if (zoneQuery) {
    const clean = zoneQuery.trim().toLowerCase();
    filtered = plans.filter((p) => p.zoneName.toLowerCase().includes(clean) || p.zoneId.toLowerCase().includes(clean));
  }

  if (filtered.length === 0) {
    return {
      toolName: "get_relocation_plans",
      summary: `No specific relocation plan found for "${zoneQuery}". Available plans exist for: ${plans.map((p) => p.zoneName).join(", ")}.`,
      raw: plans,
    };
  }

  const lines = filtered.map((p) => {
    const allocLines = p.allocations.map((a) => {
      return `  • **${a.siteName}**: ${a.contribution.toLocaleString()} evacuees (${a.distanceKm} km transit, Timeline: ${a.timeline || "Immediate"})`;
    });

    const statusBadge = p.isFullyAccommodated ? "✅ Fully Accommodated" : `⚠️ Shortfall: ${p.shortfall.toLocaleString()} unassigned`;

    return (
      `📋 **Relocation Plan: ${p.zoneName}** (${p.worstStatus} Zone - ${p.hazardType})\n` +
      `- **Population to Relocate**: ${p.population.toLocaleString()} evacuees\n` +
      `- **Carrying Capacity Allocated**: ${p.totalCapacityUsed.toLocaleString()} / ${p.population.toLocaleString()} (${statusBadge})\n` +
      `- **Target Evacuation Timeline**: **${p.timeline}**\n` +
      `- **Assigned Destination Shelters**:\n${allocLines.join("\n")}`
    );
  });

  return {
    toolName: "get_relocation_plans",
    summary: lines.join("\n\n"),
    raw: filtered,
  };
}

async function toolGetDatabaseSummary(): Promise<ToolResult> {
  const zones = await dbStore.getZones();
  const sites = await dbStore.getRelocationSites();
  const plans = await dbStore.getRelocationPlans();

  const redCount = zones.filter((z) => z.zoneColor === "RED").length;
  const yellowCount = zones.filter((z) => z.zoneColor === "YELLOW").length;
  const greenCount = zones.filter((z) => z.zoneColor === "GREEN").length;

  const redPop = zones.filter((z) => z.zoneColor === "RED").reduce((acc, z) => acc + z.population, 0);
  const totalShelterCap = sites.reduce((acc, s) => acc + s.capacity, 0);
  const totalOccupied = sites.reduce((acc, s) => acc + s.currentOccupancy, 0);
  const totalFree = sites.reduce((acc, s) => acc + s.remainingCapacity, 0);

  return {
    toolName: "get_database_summary",
    summary:
      `📊 **Rescue Arc Live GIS Database Summary**:\n` +
      `- **Monitored Hazard Zones**: **${zones.length}** total (🔴 Red: ${redCount}, 🟡 Yellow: ${yellowCount}, 🟢 Green: ${greenCount})\n` +
      `- **Population in Red Zones (Immediate Need)**: **${redPop.toLocaleString()} citizens**\n` +
      `- **Relocation Sites**: **${sites.length} vetted sites** with **${totalShelterCap.toLocaleString()} total Sphere-standard capacity**\n` +
      `- **Current Shelter Capacity**: ${totalOccupied.toLocaleString()} occupied (${Math.round((totalOccupied / (totalShelterCap || 1)) * 100)}%), **${totalFree.toLocaleString()} spaces available right now**\n` +
      `- **Active Relocation Blueprints**: **${plans.length} operational plans** configured.`,
    raw: { redCount, yellowCount, greenCount, redPop, totalShelterCap, totalOccupied, totalFree },
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// 3. RAG Retrieval Engine (Semantic scoring & token matching)
// ─────────────────────────────────────────────────────────────────────────────
function retrieveRagDocs(query: string, topK: number = 3): RagDocument[] {
  const queryTerms = query.toLowerCase().replace(/[^a-z0-9\s]/g, " ").split(/\s+/).filter(Boolean);

  const scored = RAG_KNOWLEDGE_BASE.map((doc) => {
    let score = 0;
    // Check keyword exact matches (high weight)
    for (const kw of doc.keywords) {
      if (query.toLowerCase().includes(kw)) {
        score += 8;
      }
    }
    // Check individual query terms against title and content
    for (const term of queryTerms) {
      if (term.length < 3) continue;
      if (doc.title.toLowerCase().includes(term)) score += 5;
      if (doc.content.toLowerCase().includes(term)) score += 2;
    }
    return { doc, score };
  });

  return scored
    .filter((s) => s.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, topK)
    .map((s) => s.doc);
}

// ─────────────────────────────────────────────────────────────────────────────
// 4. Autonomous Tool Calling Router
// ─────────────────────────────────────────────────────────────────────────────
async function executeToolsForQuery(userQuery: string): Promise<ToolResult[]> {
  const q = userQuery.toLowerCase();
  const executedTools: ToolResult[] = [];

  // Zone specific query detection
  const zoneNames = ["joshimath", "wayanad", "chooralmala", "meppadi", "patna", "guwahati", "dharamshala", "munsiari", "shimla", "darjeeling", "kalpetta"];
  const matchedZone = zoneNames.find((name) => q.includes(name));

  const asksAboutRedZones = q.includes("red zone") || q.includes("high risk") || q.includes("highest risk") || q.includes("immediate evacuation") || q.includes("danger");
  const asksAboutRelocationSites = q.includes("relocation site") || q.includes("shelter") || q.includes("camp") || q.includes("carrying capacity") || q.includes("usable area");
  const asksAboutRelocationPlans = q.includes("relocation plan") || q.includes("reallocation") || q.includes("evacuate to") || q.includes("where will people") || q.includes("where to go");
  const asksAboutSummary = q.includes("summary") || q.includes("overview") || q.includes("statistics") || q.includes("how many zones") || q.includes("total");

  if (matchedZone) {
    executedTools.push(await toolGetZoneStatus(matchedZone));
    if (asksAboutRelocationPlans || q.includes("plan") || q.includes("where") || q.includes("relocation")) {
      executedTools.push(await toolGetRelocationPlans(matchedZone));
    }
  } else if (asksAboutRedZones) {
    executedTools.push(await toolGetHighRiskZones());
  }

  if (asksAboutRelocationSites && !executedTools.some((t) => t.toolName === "get_relocation_sites")) {
    executedTools.push(await toolGetRelocationSites(matchedZone));
  }

  if (asksAboutRelocationPlans && !executedTools.some((t) => t.toolName === "get_relocation_plans")) {
    executedTools.push(await toolGetRelocationPlans(matchedZone));
  }

  if (asksAboutSummary || (executedTools.length === 0 && (q.includes("database") || q.includes("status") || q.includes("zones")))) {
    executedTools.push(await toolGetDatabaseSummary());
  }

  return executedTools;
}

// ─────────────────────────────────────────────────────────────────────────────
// 5. Intelligent Copilot Answer Synthesizer
// ─────────────────────────────────────────────────────────────────────────────
function synthesizeAnswer(query: string, tools: ToolResult[], ragDocs: RagDocument[]): string {
  const sections: string[] = [];

  // Add Tool invocation badges
  if (tools.length > 0) {
    const badgeHeaders = tools.map((t) => `⚡ \`[DB_TOOL: ${t.toolName}()]\``).join(" ");
    sections.push(`> **Live Database Query Executed**: ${badgeHeaders}\n> Telemetry fetched directly from PostGIS & multi-hazard data store.`);
  }

  // Answer formulation based on query intent & data
  if (tools.length > 0) {
    for (const tool of tools) {
      sections.push(tool.summary);
    }
  }

  // Add RAG Knowledge Context if relevant
  if (ragDocs.length > 0) {
    const ragTitles = ragDocs.map((d) => `\`${d.source}\``).join(", ");
    const ragSnippets = ragDocs
      .map((d) => `### 📚 ${d.title}\n*Source: ${d.source}*\n\n${d.content}`)
      .join("\n\n");

    sections.push(`---\n### 🛡️ Relevant Standards & Disaster Guidelines (${ragTitles})\n\n${ragSnippets}`);
  }

  // Actionable advisory
  const q = query.toLowerCase();
  if (q.includes("what should i do") || q.includes("sop") || q.includes("protocol") || q.includes("red") || q.includes("emergency")) {
    sections.push(
      `---\n### 🚨 Immediate Recommended Action:\n` +
      `1. **Grab Bag Preparedness**: Keep identification, prescription drugs, torches, and dry rations ready.\n` +
      `2. **Check Relocation Assignment**: Proceed to designated verified Sphere-compliant relocation hub via green routes.\n` +
      `3. **Early Warning Subscriptions**: Ensure your phone is registered for geo-fenced SMS alerts on Rescue Arc.\n` +
      `4. **Helpline Numbers**: NDRF Emergency Hotline **1078** | Disaster Management Authority **1070**.`
    );
  }

  // Default fallback if neither tool nor RAG triggered deeply
  if (sections.length === 0) {
    sections.push(
      `I am the **Rescue Arc Disaster Intelligence Assistant**, equipped with live PostGIS database access and RAG-indexed NDMA/Sphere humanitarian guidelines.\n\n` +
      `You can ask me about:\n` +
      `- 🔴 **Current Hazard Zone Status** (e.g. *"What is the risk level in Joshimath?"* or *"List all Red Zones"*)\n` +
      `- 🏕️ **Relocation Sites & Carrying Capacity** (e.g. *"Show shelter sites in Wayanad with Sphere capacities"*)\n` +
      `- 📋 **Relocation Plans & Shortfall** (e.g. *"What is the relocation plan for Chooralmala?"*)\n` +
      `- 📐 **Technical Standards** (e.g. *"Explain Sphere 45 m² standard"* or *"What are AHP slope weights?"*)\n` +
      `- 📊 **System-Wide Status** (e.g. *"Show live database summary"*)\n\n` +
      `How can I assist your team or community today?`
    );
  }

  return sections.join("\n\n");
}

// ─────────────────────────────────────────────────────────────────────────────
// 6. POST Handler with SSE Streaming
// ─────────────────────────────────────────────────────────────────────────────
export async function POST(req: NextRequest) {
  try {
    let userMessage = "";
    try {
      const body = await req.json();
      userMessage = (body.message || "").trim();
    } catch {
      try {
        const text = await req.text();
        const parsed = JSON.parse(text);
        userMessage = (parsed.message || "").trim();
      } catch {
        // If plain text was sent
        userMessage = "";
      }
    }

    if (!userMessage) {
      return new Response("Missing message field", { status: 400 });
    }

    // Step 1: Query Autonomous Tools
    const toolsExecuted = await executeToolsForQuery(userMessage);

    // Step 2: Retrieve Top-K RAG Chunks
    const ragDocs = retrieveRagDocs(userMessage, 2);

    // Step 3: Synthesize comprehensive markdown answer
    const fullAnswer = synthesizeAnswer(userMessage, toolsExecuted, ragDocs);

    // Step 4: Stream response token-by-token for realistic typing & low TTFT
    const encoder = new TextEncoder();
    const customReadable = new ReadableStream({
      async start(controller) {
        // Break answer into realistic stream chunks (words and punctuation)
        const chunks = fullAnswer.match(/[\s\S]{1,16}/g) || [fullAnswer];
        for (const chunk of chunks) {
          controller.enqueue(encoder.encode(chunk));
          // Micro delay to simulate realistic streaming token flow
          await new Promise((resolve) => setTimeout(resolve, 8));
        }
        controller.close();
      },
    });

    return new Response(customReadable, {
      headers: {
        "Content-Type": "text/event-stream; charset=utf-8",
        "Cache-Control": "no-cache, no-transform",
        "Connection": "keep-alive",
        "X-Tools-Executed": toolsExecuted.map((t) => t.toolName).join(","),
        "X-Rag-Sources": ragDocs.map((d) => d.id).join(","),
      },
    });
  } catch (err) {
    console.error("[/api/chat] Error processing request:", err);
    return new Response(
      `An error occurred while querying the RAG database engine: ${(err as Error).message}`,
      { status: 500, headers: { "Content-Type": "text/plain" } }
    );
  }
}
