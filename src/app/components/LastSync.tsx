"use client";

import { useSyncExternalStore } from "react";

const TICK_MS = 30_000;

function subscribe(onChange: () => void) {
  const id = setInterval(onChange, TICK_MS);
  return () => clearInterval(id);
}

/** Redondeado al tick para que el snapshot sea estable entre renders. */
function getNow() {
  return Math.floor(Date.now() / TICK_MS) * TICK_MS;
}

function getServerNow() {
  return null;
}

function plural(n: number, word: string) {
  return `hace ${n} ${word}${n !== 1 ? "s" : ""}`;
}

export function formatRelative(iso: string, now: number): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "N/A";

  const diffMins = Math.floor(Math.max(0, now - date.getTime()) / 60_000);
  const diffHours = Math.floor(diffMins / 60);

  if (diffMins < 1) return "hace instantes";
  if (diffHours < 1) return plural(diffMins, "minuto");
  if (diffHours < 24) return plural(diffHours, "hora");

  return date.toLocaleString("es-AR", {
    timeZone: "America/Argentina/Buenos_Aires",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function LastSync({ timestamp }: { timestamp: string | undefined }) {
  // En el servidor (y durante la hidratación) `now` es null para evitar mismatches.
  const now = useSyncExternalStore(subscribe, getNow, getServerNow);

  let display = "Sin datos de hoy";
  if (timestamp) display = now === null ? "…" : formatRelative(timestamp, now);

  return (
    <p className="text-sm font-medium text-zinc-500">
      Última actualización: {display}
    </p>
  );
}
