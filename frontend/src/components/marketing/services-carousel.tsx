/**
 * FEATURE: Horizontally auto-scrolling strip of clickable service boxes
 * Auto-scrolls right-to-left continuously via
 * requestAnimationFrame. Arrow buttons manually scroll one "box width"
 * and pause the auto-scroll for PAUSE_DURATION_MS before it resumes.
 * Clicking a box (or its "Read more" button) navigates to its dynamic
 * description page at /services/[slug] - UNLESS the item has
 * requiresAuth: true and the visitor isn't logged in, in which case they
 * go to /login first (Requirement 3), with a callbackUrl that sends them
 * back to the description page after logging in.
 *
 * RESPONSIVE: box width is `70vw` (capped at 16rem) so it scales with
 * screen size instead of a fixed pixel width - narrower on phones, fixed
 * comfortable width on tablets/laptops.
 *
 */
"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { services } from "@/data/site-content";

const SCROLL_SPEED_PX_PER_FRAME = 0.6;
const PAUSE_DURATION_MS = 3000;
const ARROW_SCROLL_AMOUNT_PX = 300;

export function ServicesCarousel() {
  const containerRef = useRef<HTMLDivElement>(null);
  const pauseTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [paused, setPaused] = useState(false);
  const router = useRouter();
  const { data: session } = useSession();

  // Continuous auto-scroll loop - runs every frame, does nothing while paused.
  useEffect(() => {
    let frameId: number;
    function tick() {
      const el = containerRef.current;
      if (el && !paused) {
        el.scrollLeft += SCROLL_SPEED_PX_PER_FRAME;
        if (el.scrollLeft >= el.scrollWidth - el.clientWidth - 1) {
          el.scrollLeft = 0; // loop back to the start
        }
      }
      frameId = requestAnimationFrame(tick);
    }
    frameId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frameId);
  }, [paused]);

  function pauseTemporarily() {
    setPaused(true);
    if (pauseTimeoutRef.current) clearTimeout(pauseTimeoutRef.current);
    pauseTimeoutRef.current = setTimeout(() => setPaused(false), PAUSE_DURATION_MS);
  }

  function handleArrowClick(direction: -1 | 1) {
    containerRef.current?.scrollBy({ left: direction * ARROW_SCROLL_AMOUNT_PX, behavior: "smooth" });
    pauseTemporarily();
  }

  function handleServiceClick(slug: string, requiresAuth: boolean) {
    if (requiresAuth && !session?.user) {
      router.push(`/login?callbackUrl=/services/${slug}`);
      return;
    }
    router.push(`/services/${slug}`);
  }

  return (
    <section className="relative py-12">
      <h2 className="mb-6 px-4 text-2xl font-semibold sm:px-8">Our services</h2>

      <button
        aria-label="Previous"
        onClick={() => handleArrowClick(-1)}
        className="absolute left-2 top-1/2 z-10 -translate-y-1/2 rounded-full border border-border bg-background p-2 shadow"
      >
        ‹
      </button>
      <button
        aria-label="Next"
        onClick={() => handleArrowClick(1)}
        className="absolute right-2 top-1/2 z-10 -translate-y-1/2 rounded-full border border-border bg-background p-2 shadow"
      >
        ›
      </button>

      <div
        ref={containerRef}
        className="flex gap-4 overflow-x-hidden px-4 sm:px-8"
      >
        {services.map((service) => (
          <div
            key={service.slug}
            onClick={() => handleServiceClick(service.slug, service.requiresAuth)}
            className="w-[70vw] max-w-[16rem] shrink-0 cursor-pointer rounded-lg border border-border p-5 transition-shadow hover:shadow-md"
          >
            <h3 className="font-semibold">{service.title}</h3>
            <p className="mt-2 line-clamp-3 text-sm text-foreground/60">{service.shortText}</p>
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleServiceClick(service.slug, service.requiresAuth);
              }}
              className="mt-4 text-sm font-medium text-primary hover:underline"
            >
              Read more →
            </button>
          </div>
        ))}
      </div>
    </section>
  );
}