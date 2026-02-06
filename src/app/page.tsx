import { StrikeService } from "@/services/strike.service";
import { DynamicFavicon } from "./components/DynamicFavicon";

export default async function HomePage() {
  const status = await StrikeService.getStatus();
  const isStrike = status?.isStrikeActive ?? false;

  return (
    <main
      className={`flex min-h-screen flex-col items-center justify-center p-6 text-white transition-colors duration-1000 ${isStrike ? "bg-red-600" : "bg-emerald-600"}`}
    >
      <DynamicFavicon isStrike={isStrike} />
      <div className="max-w-4xl text-center">
        <h1 className="text-2xl font-bold uppercase tracking-widest opacity-90">
          ¿Hoy hay paro de transporte?
        </h1>

        <p className="text-[12rem] font-black leading-none tracking-tighter md:text-[20rem]">
          {isStrike ? "SI" : "NO"}
        </p>
        {isStrike &&
          status?.affectedLines &&
          status.affectedLines.length > 0 && (
            <div className="mt-10">
              <h2 className="mb-6 text-xl font-black uppercase underline decoration-white decoration-4 underline-offset-8">
                Lineas afectadas
              </h2>
              <div className="flex flex-wrap justify-center gap-2">
                {status.affectedLines.map((line) => (
                  <span
                    key={line}
                    className="bg-white px-3 py-1 text-xl font-black text-black"
                  >
                    {line}
                  </span>
                ))}
              </div>
            </div>
          )}

        <footer className="mt-20 space-y-2 font-mono text-sm uppercase opacity-40">
          <p>Última sincronización: {status?.lastUpdate || "N/A"}</p>
          <p>
            Hecho por{" "}
            <a
              href="https://www.lucasvillanueva.tech/"
              target="_blank"
              rel="noopener noreferrer"
              className="underline hover:opacity-100"
            >
              Lucas Villanueva
            </a>
            {" | "}
            <a
              href="https://github.com/KenaiiDev"
              target="_blank"
              rel="noopener noreferrer"
              className="underline hover:opacity-100"
            >
              GitHub
            </a>
            {" | "}
            <a
              href="https://github.com/KenaiiDev/el-paro-de-hoy"
              target="_blank"
              rel="noopener noreferrer"
              className="underline hover:opacity-100"
            >
              Source code
            </a>
          </p>
        </footer>
      </div>
    </main>
  );
}
