import { SectorConfig } from "@/lib/sectors";
import { SectorStatus } from "@/types/strike";

interface SectorCardProps {
  sector: SectorConfig;
  status: SectorStatus | undefined;
}

function AffectedLinesBadges({ lines }: { lines: string[] }) {
  const visible = lines.slice(0, 6);
  const overflow = lines.length - visible.length;

  return (
    <div className="flex flex-wrap gap-1 mt-3">
      {visible.map((line) => (
        <span
          key={line}
          className="text-[10px] font-mono uppercase tracking-wider bg-red-950 text-red-300 border border-red-900 px-2 py-0.5"
        >
          {line}
        </span>
      ))}
      {overflow > 0 && (
        <span className="text-[10px] font-mono text-neutral-600">
          +{overflow}
        </span>
      )}
    </div>
  );
}

function ScopeBadge({ scope }: { scope: string }) {
  return (
    <span className="text-[10px] font-mono uppercase tracking-widest text-neutral-600 border border-neutral-800 px-1.5 py-0.5">
      {scope}
    </span>
  );
}

export function SectorCard({ sector, status }: SectorCardProps) {
  const isStrike = status?.isStrikeActive ?? false;
  const hasLines =
    isStrike && status?.affectedLines && status.affectedLines.length > 0;

  return (
    <article
      className={`border-l-4 p-4 flex flex-col gap-1 min-h-44 ${
        isStrike
          ? "border-red-600 bg-red-950/10"
          : "border-emerald-700 bg-emerald-950/10"
      }`}
    >
      <div className="flex items-start justify-between gap-2">
        <h2 className="text-xs font-mono uppercase tracking-widest text-neutral-400 leading-tight">
          {sector.name}
        </h2>
        <ScopeBadge scope={sector.scope} />
      </div>

      <p
        className={`text-5xl font-black leading-none mt-2 ${
          isStrike ? "text-red-500" : "text-emerald-500"
        }`}
      >
        {isStrike ? "SI" : "NO"}
      </p>

      {hasLines && (
        <AffectedLinesBadges lines={status!.affectedLines} />
      )}

      {!status && (
        <p className="text-xs font-mono text-neutral-700 mt-2">Sin datos</p>
      )}
    </article>
  );
}
