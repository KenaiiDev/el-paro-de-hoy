"use client";

import { useState } from "react";
import type { SectorConfig } from "@/lib/sectors";
import type { SectorStatus } from "@/types/strike";
import { SectorCard } from "./SectorCard";
import { LastSync } from "./LastSync";

interface StrikeDashboardProps {
  sectors: readonly SectorConfig[];
  statuses: SectorStatus[];
  lastUpdate: string | undefined;
}

function TabButton({
  active,
  label,
  count,
  onClick,
}: {
  active: boolean;
  label: string;
  count: number;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`px-4 py-2 text-sm font-semibold rounded-lg transition-colors ${
        active
          ? "bg-zinc-900 text-white shadow-sm"
          : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200"
      }`}
    >
      {label} ({count})
    </button>
  );
}

export function StrikeDashboard({ sectors, statuses, lastUpdate }: StrikeDashboardProps) {
  const activeSectors = sectors.filter((s) => {
    const status = statuses.find((st) => st.id === s.id);
    return status?.isStrikeActive;
  });
  const activeCount = activeSectors.length;

  const [filter, setFilter] = useState<"all" | "strike">("all");
  const [expanded, setExpanded] = useState<Set<string>>(new Set());

  const displayed = filter === "strike" ? activeSectors : sectors;

  const toggleExpanded = (id: string) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  return (
    <div className="max-w-4xl mx-auto px-5">
      <header className="pt-8 pb-4">
        <div className="flex items-center justify-between gap-3 flex-wrap mb-2">
          <h1 className="text-2xl md:text-3xl font-serif font-bold tracking-tight text-zinc-900">
            ¿Hay paro hoy?
          </h1>
          {activeCount > 0 && (
            <span className="text-xs font-semibold text-red-700 bg-red-50 border border-red-200 px-3 py-1.5 rounded-full">
              {activeCount} sector{activeCount > 1 ? "es" : ""} afectado{activeCount > 1 ? "s" : ""}
            </span>
          )}
        </div>
        <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:gap-3">
          <p className="text-sm font-medium text-zinc-500">
            Buenos Aires · Argentina
          </p>
          <span className="hidden sm:inline text-zinc-300">·</span>
          <LastSync timestamp={lastUpdate} />
        </div>
      </header>

      <div className="pb-4">
        <div className="flex items-center gap-2 overflow-x-auto pb-1">
          <TabButton
            active={filter === "all"}
            label="Todos"
            count={sectors.length}
            onClick={() => setFilter("all")}
          />
          <TabButton
            active={filter === "strike"}
            label="Con paro"
            count={activeCount}
            onClick={() => setFilter("strike")}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pb-10">
        {displayed.map((sector) => {
          const status = statuses.find((s) => s.id === sector.id);
          return (
            <SectorCard
              key={sector.id}
              sector={sector}
              status={status}
              expanded={expanded.has(sector.id)}
              onToggle={() => toggleExpanded(sector.id)}
            />
          );
        })}
      </div>
    </div>
  );
}
