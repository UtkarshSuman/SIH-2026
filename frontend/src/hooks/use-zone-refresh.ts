/**
 * FEATURE: Fetches the current zones on mount, and handles the manual
 * refresh button - calls the backend's rate-limited refresh endpoint,
 * shows a client-side cooldown too (matches the backend's, so the button
 * visibly disables instead of just silently failing on click), and never
 * clears existing zone data on a failed/slow refresh - old data stays
 * shown until new data successfully arrives.
 * INSTALLATION: none - uses the built-in fetch.
 */
import { useCallback, useEffect, useRef, useState } from "react";
import { env } from "@/lib/env";

const COOLDOWN_SECONDS = 300; // must match backend REFRESH_COOLDOWN_SECONDS

export function useZoneRefresh() {
  const [geojson, setGeojson] = useState<GeoJSON.FeatureCollection | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [cooldownRemaining, setCooldownRemaining] = useState(0);
  const cooldownIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const loadInitial = useCallback(async () => {
    const res = await fetch(`${env.NEXT_PUBLIC_ML_SERVICE_URL}/api/v1/zones/latest`);
    if (res.ok) setGeojson(await res.json());
  }, []);

  useEffect(() => {
    loadInitial();
  }, [loadInitial]);

  function startCooldownTimer() {
    setCooldownRemaining(COOLDOWN_SECONDS);
    if (cooldownIntervalRef.current) clearInterval(cooldownIntervalRef.current);
    cooldownIntervalRef.current = setInterval(() => {
      setCooldownRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(cooldownIntervalRef.current!);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  }

  const refresh = useCallback(async () => {
    if (isRefreshing || cooldownRemaining > 0) return;
    setIsRefreshing(true);
    try {
      const res = await fetch(`${env.NEXT_PUBLIC_ML_SERVICE_URL}/api/v1/zones/refresh`, { method: "POST" });
      if (res.status === 429) {
        startCooldownTimer();
        return;
      }
      if (res.ok) {
        const data = await res.json();
        setGeojson(data.zones); // only replaces on success - old data stays otherwise
        startCooldownTimer();
      }
    } finally {
      setIsRefreshing(false);
    }
  }, [isRefreshing, cooldownRemaining]);

  return { geojson, refresh, isRefreshing, cooldownRemaining };
}