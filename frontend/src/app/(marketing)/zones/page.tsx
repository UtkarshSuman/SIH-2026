"use client";

import dynamic from "next/dynamic";

const MapSection = dynamic(() => import("@/components/map/map-section"), {
  ssr: false,
  loading: () => <div className="flex h-96 items-center justify-center">Loading Map...</div>,
});

export default function ZonesPage() {
  return (
    <main className="min-h-screen bg-[#f2fbf7]">
      <MapSection />
    </main>
  );
}