"use client";

import type { SectorConfig } from "@/lib/sectors";
import type { SectorStatus } from "@/types/strike";

interface SectorCardProps {
  sector: SectorConfig;
  status: SectorStatus | undefined;
  expanded: boolean;
  onToggle: () => void;
}

function StatusBadge({ active }: { active: boolean }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full ${
        active
          ? "text-red-700 bg-red-50 border border-red-200"
          : "text-emerald-700 bg-emerald-50 border border-emerald-200"
      }`}
    >
      <span
        className={`w-1.5 h-1.5 rounded-full ${
          active ? "bg-red-500" : "bg-emerald-500"
        }`}
      />
      {active ? "Paro activo" : "Normal"}
    </span>
  );
}

export function SectorCard({ sector, status, expanded, onToggle }: SectorCardProps) {
  const isStrike = status?.isStrikeActive ?? false;
  const affectedLines = status?.affectedLines ?? [];
  const hasDetails = isStrike && affectedLines.length > 0;

  return (
    <article
      className={`p-4 rounded-xl border transition-all duration-200 ${
        isStrike
          ? "bg-red-50/60 border-red-200"
          : "bg-white border-zinc-200 hover:border-zinc-300"
      } ${expanded ? "shadow-md" : "shadow-sm"}`}
    >
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <h2 className="text-sm font-semibold text-zinc-900 truncate">{sector.name}</h2>
        </div>
        <StatusBadge active={isStrike} />
      </div>

      <div className="mt-2 flex items-center gap-2">
        <span className="text-[10px] font-semibold uppercase tracking-widest text-zinc-400 bg-zinc-100 px-2 py-0.5 rounded-full">
          {sector.scope}
        </span>
        {hasDetails && (
          <button
            type="button"
            onClick={onToggle}
            className="text-[10px] font-semibold text-zinc-500 hover:text-zinc-700 underline underline-offset-2 transition-colors"
            aria-label={
              expanded
                ? "Ocultar detalle"
                : `Ver detalle (${affectedLines.length} ${sector.affectedLabel})`
            }
          >
            {expanded ? "Ocultar" : `${affectedLines.length} ${sector.affectedLabel}`}
          </button>
        )}
        {!status && (
          <span className="text-[10px] font-medium text-zinc-400">Sin datos</span>
        )}
      </div>

      {expanded && hasDetails && (
        <div className="mt-3 pt-3 border-t border-red-200">
          <p className="text-xs font-medium text-red-800 mb-2">Detalle:</p>
          <div className="flex flex-wrap gap-1.5">
            {affectedLines.map((line) => (
              <span
                key={line}
                className="text-[10px] font-semibold uppercase tracking-wider bg-red-50 text-red-700 border border-red-200 px-2 py-0.5 rounded"
              >
                {line}
              </span>
            ))}
          </div>
        </div>
      )}
    </article>
  );
}
