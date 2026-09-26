/**
 * FEATURE: Starter prompts and quick-ask chips for the Rescue Arc Disaster Intelligence Copilot.
 * Spans live PostGIS database queries, zone classifications, relocation planning, and RAG standards.
 */
export interface ChatPromptCategory {
  category: string;
  prompts: {
    label: string;
    query: string;
    icon?: string;
    badge?: string;
  }[];
}

export const chatSuggestionCategories: ChatPromptCategory[] = [
  {
    category: "🔴 Live Zone Hazards",
    prompts: [
      {
        label: "Joshimath Live Status",
        query: "What is the current hazard risk status and physical telemetry in Joshimath?",
        icon: "🏔️",
        badge: "Live DB",
      },
      {
        label: "List All Red Zones",
        query: "Which habitations are currently classified as RED ZONES requiring immediate evacuation?",
        icon: "🚨",
        badge: "Live DB",
      },
      {
        label: "Wayanad Chooralmala Telemetry",
        query: "What is the landslide hazard score and rainfall metrics in Wayanad Chooralmala?",
        icon: "🌧️",
        badge: "Live DB",
      },
    ],
  },
  {
    category: "🏕️ Relocation & Shelters",
    prompts: [
      {
        label: "Sphere Carrying Capacities",
        query: "List all verified relocation sites with Sphere-standard carrying capacity and current occupancy.",
        icon: "⛺",
        badge: "Live DB",
      },
      {
        label: "Relocation Plans & Shortfall",
        query: "What is the relocation allocation plan and destination shelter for Joshimath?",
        icon: "📋",
        badge: "Live DB",
      },
    ],
  },
  {
    category: "📚 RAG Disaster Standards",
    prompts: [
      {
        label: "Sphere 45 m² Standard",
        query: "Explain the Sphere minimum standard of 45 square meters per person for relocation settlements.",
        icon: "📐",
        badge: "RAG Doc",
      },
      {
        label: "Red Zone Evacuation SOP",
        query: "What is the official NDMA SOP and grab-bag protocol when a village is marked RED ZONE?",
        icon: "🛡️",
        badge: "RAG SOP",
      },
      {
        label: "AHP Hazard Weights",
        query: "How does the AHP model calculate multi-hazard scores using slope, rainfall, and soil saturation?",
        icon: "⚖️",
        badge: "RAG Spec",
      },
    ],
  },
];

export const chatSuggestions: string[] = [
  "What is the current hazard status in Joshimath?",
  "Which areas are classified as RED ZONE requiring immediate evacuation?",
  "Show verified relocation sites with Sphere carrying capacities",
  "What are the Sphere minimum standards for temporary shelters?",
  "Show live GIS database summary across all monitored zones",
];