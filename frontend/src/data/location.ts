/**
 * FEATURE: Location options shown in the registration form's dropdown.
 */
export interface LocationOption {
  value: string;
  label: string;
}

export const locations: LocationOption[] = [
  { value: "delhi", label: "Delhi" },
  { value: "mumbai", label: "Mumbai" },
  { value: "bengaluru", label: "Bengaluru" },
  { value: "kolkata", label: "Kolkata" },
  { value: "chennai", label: "Chennai" },
  { value: "hyderabad", label: "Hyderabad" },
  { value: "pune", label: "Pune" },
  { value: "other", label: "Other" },
];