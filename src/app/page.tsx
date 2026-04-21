import { SectorService } from "@/services/sector.service";
import { SECTORS } from "@/lib/sectors";
import { SectorCard } from "./components/SectorCard";
import { DynamicFavicon } from "./components/DynamicFavicon";

function StrikeAlert({ count }: { count: number }) {
  return (
    <span className="font-mono text-xs uppercase tracking-widest text-red-500">
      {count} sector{count > 1 ? "es" : ""} afectado{count > 1 ? "s" : ""}
    </span>
  );
}

function LastSync({ timestamp }: { timestamp: string | undefined }) {
  return (
    <p className="font-mono text-xs uppercase text-neutral-700">
      Última sincronización: {timestamp ?? "N/A"}
    </p>
  );
}

export default async function HomePage() {
  const statuses = await SectorService.getAllStatuses();

  const hasAnyStrike = statuses.some((s) => s.isStrikeActive);
  const activeCount = statuses.filter((s) => s.isStrikeActive).length;
  const lastUpdate = statuses[0]?.lastUpdate;

  return (
    <main className="min-h-screen bg-[#0d0d0d] text-white">
      <DynamicFavicon isStrike={hasAnyStrike} />

      <div className="max-w-5xl mx-auto px-6 py-12 md:py-16">
        <header className="mb-10">
          <div className="flex items-baseline justify-between flex-wrap gap-3 mb-1">
            <h1 className="text-2xl font-black uppercase tracking-widest">
              ¿Hay paro hoy?
            </h1>
            {activeCount > 0 && <StrikeAlert count={activeCount} />}
          </div>
          <p className="font-mono text-xs uppercase text-neutral-600 tracking-widest">
            Buenos Aires · Argentina
          </p>
        </header>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 auto-rows-fr">
          {SECTORS.map((sector) => {
            const status = statuses.find((s) => s.id === sector.id);
            return (
              <SectorCard key={sector.id} sector={sector} status={status} />
            );
          })}
        </div>

        <footer className="mt-16 flex flex-col gap-2">
          <LastSync timestamp={lastUpdate} />
          <p className="font-mono text-xs uppercase text-neutral-700">
            Hecho por{" "}
            <a
              href="https://www.lucasvillanueva.tech/"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-neutral-400 transition-colors"
            >
              Lucas Villanueva
            </a>
            {" · "}
            <a
              href="https://github.com/KenaiiDev/el-paro-de-hoy"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-neutral-400 transition-colors"
            >
              GitHub
            </a>
          </p>
        </footer>
      </div>
    </main>
  );
}
