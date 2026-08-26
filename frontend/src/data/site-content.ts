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
    slug: "example-service-one",
    title: "Example Service One",
    shortText: "Placeholder short text - shown on the carousel box.",
    description:
      "Placeholder long description - shown on the /services/example-service-one page. Replace once the problem statement is finalized.",
    requiresAuth: false,
  },
  {
    slug: "example-service-two",
    title: "Example Service Two (login required)",
    shortText: "This one demonstrates the auth-gated flow.",
    description:
      "Placeholder long description for a service that requires login. Logged-out users clicking this are redirected to /login first.",
    requiresAuth: true,
  },
  {
    slug: "example-service-three",
    title: "Example Service Three",
    shortText: "Another placeholder box to show the carousel with 3+ items.",
    description: "Placeholder long description for service three.",
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
    problem: "Placeholder problem statement one - what pain point this addresses.",
    solution: "Placeholder solution text one - how the project solves it.",
  },
  {
    id: "2",
    problem: "Placeholder problem statement two.",
    solution: "Placeholder solution text two.",
  },
  {
    id: "3",
    problem: "Placeholder problem statement three.",
    solution: "Placeholder solution text three.",
  },
];