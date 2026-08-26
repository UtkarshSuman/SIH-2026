/**
 * FEATURE: Scroll-triggered "card over card" stack.
 * Pure CSS `position: sticky` technique - no animation library needed:
 * each card sits in a tall wrapper div. As you scroll, the card sticks
 * near the top of the viewport; the NEXT card (later in the DOM, higher
 * z-index) then slides up and visually covers it. The small increasing
 * `top` offset per card leaves a sliver of each previous card peeking out
 * above the next one, giving the stacked-deck look.
 *
 * Per your requirement, these cards are NOT clickable - no navigation,
 * just problem/solution text.
 */
import { problemSolutions } from "@/data/site-content";

export function ProblemSolutionStack() {
  return (
    <section className="py-12">
      <h2 className="mb-6 px-4 text-2xl font-semibold sm:px-8">Problems we solve</h2>

      <div className="relative">
        {problemSolutions.map((item, index) => (
          <div key={item.id} className="relative h-[60vh]">
            <div
              className="sticky mx-auto w-[92%] max-w-2xl rounded-xl border border-border bg-background p-6 shadow-xl"
              style={{ top: `${80 + index * 16}px`, zIndex: index + 1 }}
            >
              <p className="text-xs font-medium uppercase tracking-wide text-primary">Problem</p>
              <p className="mt-1 text-sm">{item.problem}</p>
              <p className="mt-4 text-xs font-medium uppercase tracking-wide text-primary">Solution</p>
              <p className="mt-1 text-sm">{item.solution}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}