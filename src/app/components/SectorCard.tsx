import { SectorConfig } from "@/lib/sectors";
import { SectorStatus } from "@/types/strike";

interface SectorCardProps {
  sector: SectorConfig;
  status: SectorStatus | undefined;
}

function AffectedLinesBadges({ lines }: { lines: string[] }) {
  const visible = lines.slice(0, 5);
  const overflow = lines.length - visible.length;

  return (
    <div className="flex flex-wrap gap-1.5 mt-4 relative z-10">
      {visible.map((line) => (
        <span
          key={line}
          className="text-[10px] font-semibold uppercase tracking-wider bg-red-50 text-red-700 border border-red-200 px-2 py-1 rounded-md"
        >
          {line}
        </span>
      ))}
      {overflow > 0 && (
        <span className="text-[10px] font-semibold text-red-700 bg-red-100 border border-red-200 px-2 py-1 rounded-md">
          +{overflow}
        </span>
      )}
    </div>
  );
}

function ScopeBadge({ scope }: { scope: string }) {
  return (
    <span className="text-[10px] font-semibold uppercase tracking-widest text-zinc-600 bg-zinc-100 border border-zinc-200 px-2 py-1 rounded-full relative z-10">
      {scope}
    </span>
  );
}

export function SectorCard({ sector, status }: SectorCardProps) {
  const isStrike = status?.isStrikeActive ?? false;
  const hasLines =
    isStrike && status?.affectedLines && status.affectedLines.length > 0;

  return (
    <article className="relative overflow-hidden p-5 flex flex-col gap-1 min-h-[12rem] rounded-xl bg-white border border-zinc-200 shadow-sm transition-all hover:shadow-md">
      <div className="flex items-center justify-between gap-2 relative z-10 mb-3">
        <h2 className="text-sm font-semibold uppercase tracking-widest text-zinc-900 leading-tight">
          {sector.name}
        </h2>
        <ScopeBadge scope={sector.scope} />
      </div>

      <div className="mt-2 flex items-center gap-2 relative z-10">
        <div
          className={`w-3 h-3 rounded-full ${
            isStrike ? "bg-red-500" : "bg-emerald-500"
          }`}
        ></div>
        <p
          className={`text-2xl md:text-3xl font-serif font-bold tracking-tight ${
            isStrike ? "text-red-700" : "text-emerald-700"
          }`}
        >
          {isStrike ? "Paro" : "Normal"}
        </p>
      </div>

      <div className="mt-auto relative z-10 flex flex-col justify-end">
        {hasLines && <AffectedLinesBadges lines={status!.affectedLines} />}
        {!status && (
          <p className="text-xs font-medium text-zinc-500 mt-3">
            Sin datos
          </p>
        )}
      </div>
    </article>
  );
}
