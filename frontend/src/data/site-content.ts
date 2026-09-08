/**
 * FEATURE: Single source of content for the marketing page's two dynamic
 * sections - the services carousel and the problem/solution card stack.
 * Edit the arrays below to change what's shown; no component code needs
 * to change when you add/remove/edit an item.
 *
 * `requiresAuth` on a service controls Requirement 3: if true, clicking
 * that service while logged out sends the user to /login instead of the
 * description page (and the description page itself re-checks this
 * server-side, so the check can't be bypassed by visiting the URL directly).
 *
 */

export interface ServiceItem {
  slug: string;
  title: string;
  shortText: string;
  description: string;
  requiresAuth: boolean;
}

export const services: ServiceItem[] = [
  {
    slug: "red-zone-mapping",
    title: "Red Zone Mapping",
    shortText: "AI-powered identification of hazard-based red zones using multi-hazard geospatial overlays.",
    description:
      "Rescue Arc uses satellite imagery, seismic zonation data, flood inundation models, and landslide susceptibility indices to intelligently classify hazard-based red zones. Each habitation is scored against multiple natural hazard parameters to determine its red zone category.",
    requiresAuth: false,
  },
  {
    slug: "carrying-capacity-assessment",
    title: "Carrying Capacity Assessment (Login Required)",
    shortText: "Evaluate terrain load-bearing capacity and population density limits for settlements.",
    description:
      "Our AI models assess terrain load-bearing capacity, population density thresholds, and infrastructure stress indices to determine whether habitations exceed safe limits. Settlements exceeding their carrying capacity are flagged for priority review by DDMA authorities.",
    requiresAuth: true,
  },
  {
    slug: "relocation-priority-engine",
    title: "Relocation Priority Engine",
    shortText: "Multi-factor urgency scoring to prioritize vulnerable habitations for immediate relocation.",
    description:
      "Combining red zone severity, carrying capacity exceedance, and settlement vulnerability factors, the Relocation Priority Engine generates actionable urgency rankings. NDMA and DDMA authorities receive prioritized dashboards with safe resettlement site recommendations.",
    requiresAuth: false,
  },
];

export interface ProblemSolutionItem {
  id: string;
  problem: string;
  solution: string;
}

export const problemSolutions: ProblemSolutionItem[] = [
  {
    id: "1",
    problem: "Thousands of vulnerable habitations exist in hazard-prone areas, but there is no unified system to intelligently identify and classify these red zones using multi-hazard data.",
    solution: "Rescue Arc overlays seismic, flood, landslide, and cyclone hazard data to automatically classify red zones and flag at-risk settlements for authorities.",
  },
  {
    id: "2",
    problem: "Settlements often exceed their terrain's carrying capacity — population density, infrastructure load, and ecological stress are rarely assessed together before disaster strikes.",
    solution: "Our AI-driven carrying capacity models evaluate terrain load-bearing limits, population thresholds, and infrastructure stress to identify over-capacity habitations before they fail.",
  },
  {
    id: "3",
    problem: "When relocation is necessary, there is no data-driven system to prioritize which settlements need immediate action versus longer-term planning.",
    solution: "The Relocation Priority Engine computes multi-factor urgency scores and delivers ranked relocation dashboards to NDMA and DDMA authorities for evidence-based decision-making.",
  },
];