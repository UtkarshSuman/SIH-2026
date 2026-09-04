/**
 * FEATURE: Location options for registration - MUST match the `slug`
 * values seeded in backend/app/gis/seed_zones.py exactly, since alerting
 * matches users to zones by this value. If you add a new zone in
 * seed_zones.py, add the matching entry here too.
 * INSTALLATION: none.
 */
export interface LocationOption {
  value: string;
  label: string;
}

export const locations: LocationOption[] = [
  { value: "kalpetta", label: "Kalpetta" },
  { value: "mananthavady", label: "Mananthavady" },
  { value: "sulthan-bathery", label: "Sulthan Bathery" },
  { value: "vythiri", label: "Vythiri" },
  { value: "pulpally", label: "Pulpally" },
  { value: "meenangadi", label: "Meenangadi" },
];