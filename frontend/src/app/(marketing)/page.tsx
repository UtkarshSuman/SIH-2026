/**
 * FEATURE: Marketing page - the site's actual home page (Requirement 1),
 * now assembled from: Navbar, hero, the logged-in-only WelcomeSection
 * (Requirement 2), the services carousel, the problem/solution stack,
 * and the footer (Requirement 4). The old inline Log in/Sign up buttons
 * are gone - Navbar is the entry point into the auth-card now.
 * INSTALLATION: none beyond what each imported component needs.
 */
import { Navbar } from "@/components/marketing/navbar";
import { WelcomeSection } from "@/components/marketing/welcome-section";
import { ServicesCarousel } from "@/components/marketing/services-carousel";
import { ProblemSolutionStack } from "@/components/marketing/problem-solution-stack";
import { Footer } from "@/components/marketing/footer";

export default function HomePage() {
  return (
    <>
      <Navbar />

      <main>
        <section className="flex flex-col items-center justify-center gap-4 px-4 py-20 text-center sm:px-8">
          <h1 className="text-3xl font-bold sm:text-4xl">SIH Project</h1>
          <p className="max-w-md text-sm text-foreground/70">
            Placeholder hero text - replace once the problem statement is finalized.
          </p>
        </section>

        <WelcomeSection />
        <ServicesCarousel />
        <ProblemSolutionStack />
      </main>

      <Footer />
    </>
  );
}