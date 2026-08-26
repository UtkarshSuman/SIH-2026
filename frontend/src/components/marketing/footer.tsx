/**
 * FEATURE: Multi-column footer with policy/documentation links
 *Links are placeholders (`href="#"`) where the
 * target page doesn't exist yet - update once you build a
 * privacy-policy/terms/docs page, or wire these to real external URLs.
 */
import Link from "next/link";

const footerLinks: Record<string, { label: string; href: string }[]> = {
  Product: [
    { label: "Dashboard", href: "/dashboard" },
    { label: "Services", href: "/#services" },
  ],
  Company: [
    { label: "About", href: "#" },
    { label: "Contact", href: "#" },
  ],
  Legal: [
    { label: "Privacy Policy", href: "#" },
    { label: "Terms of Service", href: "#" },
  ],
  Resources: [
    { label: "Documentation", href: "#" },
    { label: "FAQ", href: "#" },
  ],
};

export function Footer() {
  return (
    <footer className="border-t border-border px-4 py-10 sm:px-8">
      <div className="mx-auto grid max-w-5xl grid-cols-2 gap-8 sm:grid-cols-4">
        {Object.entries(footerLinks).map(([heading, links]) => (
          <div key={heading}>
            <p className="text-sm font-semibold">{heading}</p>
            <ul className="mt-3 space-y-2">
              {links.map((link) => (
                <li key={link.label}>
                  <Link href={link.href} className="text-sm text-foreground/60 hover:text-foreground">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      <p className="mx-auto mt-10 max-w-5xl border-t border-border pt-6 text-xs text-foreground/50">
        © {new Date().getFullYear()} SIH Project. All rights reserved.
      </p>
    </footer>
  );
}