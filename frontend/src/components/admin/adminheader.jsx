"use client";

import { useEffect, useState } from "react";
import { CalendarDays, CircleCheck } from "lucide-react";

export default function Adminheader() {
  const [currentDate, setCurrentDate] = useState(null);

  useEffect(() => {
    function updateDate() {
      setCurrentDate(new Date());
    }

    updateDate();

    // Update once a day is enough for date display
    const interval = setInterval(updateDate, 60 * 60 * 1000);

    return () => clearInterval(interval);
  }, []);

  const formattedDate = currentDate
    ? new Intl.DateTimeFormat("en-IN", {
        weekday: "long",
        day: "numeric",
        month: "long",
        year: "numeric",
      }).format(currentDate)
    : "Loading...";

  return (
    <div className="flex flex-col justify-between gap-5 lg:flex-row lg:items-center">
      {/* Welcome */}

      <div>
        <h2 className="text-3xl font-bold text-[#0b1838]">
          Welcome back, Admin
        </h2>

        <p className="mt-1 text-sm text-slate-500">
          Monitor real-time hazard zones and manage red zone analysis across
          India.
        </p>
      </div>

      {/* Date + System Status */}

      <div className="flex items-center gap-8">
        {/* Date */}

        <div className="flex items-center gap-3 text-sm text-slate-600">
          <CalendarDays size={24} className="text-slate-700" />

          <p className="font-medium">{formattedDate}</p>
        </div>

        {/* System Status */}

        <div className="flex items-center gap-2 text-sm font-medium text-emerald-700">
          <CircleCheck size={17} fill="currentColor" />
          All Systems Operational
        </div>

        {/* Quick Alert Hub Link */}
        <a
          href="/alerts"
          className="flex items-center gap-1.5 rounded-xl bg-red-600 px-3.5 py-2 text-xs font-bold text-white shadow-sm transition hover:bg-red-700"
        >
          🚨 Alert Testing &amp; Broadcast
        </a>
      </div>
    </div>
  );
}
