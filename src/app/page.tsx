import { SectorService } from "@/services/sector.service";
import { SECTORS } from "@/lib/sectors";
import { SectorCard } from "./components/SectorCard";
import { DynamicFavicon } from "./components/DynamicFavicon";
import { LastSync } from "./components/LastSync";

function StrikeAlert({ count }: { count: number }) {
  return (
    <span className="text-xs font-semibold text-red-700 bg-red-50 px-3 py-1 rounded-full border border-red-200">
      {count} sector{count > 1 ? "es" : ""} afectado{count > 1 ? "s" : ""}
    </span>
  );
}

export default async function HomePage() {
  const statuses = await SectorService.getAllStatuses();

  const hasAnyStrike = statuses.some((s) => s.isStrikeActive);
  const activeCount = statuses.filter((s) => s.isStrikeActive).length;
  const lastUpdate = statuses[0]?.lastUpdate;

  return (
    <main className="min-h-screen text-zinc-900">
      <DynamicFavicon isStrike={hasAnyStrike} />

      <div className="max-w-5xl mx-auto px-6 py-12 md:py-20 relative z-10">
        <header className="mb-14">
          <div className="flex items-center justify-between flex-wrap gap-4 mb-2">
            <h1 className="text-4xl md:text-5xl font-serif font-bold tracking-tight text-zinc-900">
              ¿Hay paro hoy?
            </h1>
            {activeCount > 0 && <StrikeAlert count={activeCount} />}
          </div>
          <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:gap-3">
            <p className="text-sm font-medium text-zinc-500">
              Buenos Aires · Argentina
            </p>
            <span className="hidden sm:inline text-zinc-300">•</span>
            <LastSync timestamp={lastUpdate} />
          </div>
        </header>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 auto-rows-fr">
          {SECTORS.map((sector) => {
            const status = statuses.find((s) => s.id === sector.id);
            return (
              <SectorCard key={sector.id} sector={sector} status={status} />
            );
          })}
        </div>

        <footer className="mt-24 flex flex-col gap-3">
          <p className="text-sm text-zinc-500">
            Desarrollado por{" "}
            <a
              href="https://www.lucasvillanueva.tech/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-zinc-600 hover:text-zinc-900 font-medium transition-colors underline underline-offset-2 decoration-zinc-300"
            >
              Lucas Villanueva
            </a>
            {" · "}
            <a
              href="https://github.com/KenaiiDev/el-paro-de-hoy"
              target="_blank"
              rel="noopener noreferrer"
              className="text-zinc-600 hover:text-zinc-900 font-medium transition-colors underline underline-offset-2 decoration-zinc-300"
            >
              GitHub
            </a>
          </p>
        </footer>
      </div>
    </main>
  );
}
