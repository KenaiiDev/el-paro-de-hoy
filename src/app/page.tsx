import { SectorService } from "@/services/sector.service";
import { SECTORS } from "@/lib/sectors";
import { DynamicFavicon } from "./components/DynamicFavicon";
import { StrikeDashboard } from "./components/StrikeDashboard";

export default async function HomePage() {
  const statuses = await SectorService.getAllStatuses();

  const hasAnyStrike = statuses.some((s) => s.isStrikeActive);
  const lastUpdate = statuses[0]?.lastUpdate;

  return (
    <main className="min-h-screen text-zinc-900">
      <DynamicFavicon isStrike={hasAnyStrike} />

      <StrikeDashboard sectors={SECTORS} statuses={statuses} lastUpdate={lastUpdate} />

      <footer className="max-w-4xl mx-auto px-5 pb-8 flex flex-col gap-3">
        <p className="text-sm text-zinc-500">
          Desarrollado por{" "}
          <a
            href="https://www.lucasvillanueva.com.ar/"
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
    </main>
  );
}
