/**
 * FEATURE: Single dynamic description page for every service, driven
 * entirely by data.ts - no per-service page files needed. Re-checks
 * requiresAuth server-side, so this can't be bypassed by
 * visiting the URL directly even if the carousel's client-side check
 * were skipped.
 */
import { notFound, redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/server/auth/config";
import { services } from "@/data/site-content";

export default async function ServiceDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const service = services.find((s) => s.slug === slug);
  if (!service) notFound();

  if (service.requiresAuth) {
    const session = await getServerSession(authOptions);
    if (!session?.user) redirect(`/login?callbackUrl=/services/${slug}`);
  }

  return (
    <main className="mx-auto max-w-2xl p-8">
      <h1 className="text-2xl font-semibold">{service.title}</h1>
      <p className="mt-4 text-foreground/80">{service.description}</p>
    </main>
  );
}