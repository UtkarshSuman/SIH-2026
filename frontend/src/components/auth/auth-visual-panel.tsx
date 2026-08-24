/**
 * FEATURE: Right-hand panel of the auth card - currently a placeholder
 * gradient with the app name, reserved for the image/animation you'll
 * design later. Swap the placeholder <div> content for an <Image> or a
 * Lottie/Framer Motion animation when that's ready - nothing else in the
 * auth flow needs to change since this is a fully isolated component.
 *
 * RESPONSIVE: hidden below the `md` breakpoint (tablets/phones) so the
 * form panel gets the full card width on small screens instead of being
 * squeezed - see AuthCard.tsx for the breakpoint logic.
 *
 * INSTALLATION: none currently. When you add a real animation:
 *   - static image: no install needed, use next/image
 *   - Lottie animation: npm install lottie-react
 *   - custom motion/interaction: npm install framer-motion
 */
export function AuthVisualPanel() {
  return (
    <div className="hidden md:flex md:w-1/2 items-center justify-center bg-gradient-to-br from-primary to-blue-700 p-8">
      <div className="text-center text-white">
        <p className="text-2xl font-semibold">SIH Project</p>
        <p className="mt-2 text-sm text-white/80">
          {/* PLACEHOLDER - replace with real image/animation */}
          Visual panel placeholder
        </p>
      </div>
    </div>
  );
}