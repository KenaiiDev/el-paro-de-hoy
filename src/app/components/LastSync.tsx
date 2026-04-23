"use client";

import { useEffect, useState } from "react";

export function LastSync({ timestamp }: { timestamp: string | undefined }) {
  const [displayTime, setDisplayTime] = useState<string>("Cargando...");

  useEffect(() => {
    if (!timestamp) {
      setDisplayTime("N/A");
      return;
    }

    const calculateTime = () => {
      let date = new Date(timestamp);
      
      // Try to parse DD/MM/YYYY, HH:MM:SS (with optional AM/PM)
      const match = timestamp.match(/(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})[,\s]+(\d{1,2}):(\d{1,2}):(\d{1,2})(?:\s*(a\.?\s*m\.?|p\.?\s*m\.?|am|pm))?/i);
      if (match) {
        const [_, day, month, year, h, m, s, ampm] = match;
        let hour = Number(h);
        if (ampm) {
          const isPM = ampm.toLowerCase().includes('p');
          if (isPM && hour < 12) hour += 12;
          if (!isPM && hour === 12) hour = 0;
        }
        date = new Date(Number(year), Number(month) - 1, Number(day), hour, Number(m), Number(s));
      }

      if (isNaN(date.getTime())) {
        setDisplayTime(timestamp);
        return;
      }

      const now = new Date();
      const diffMs = Math.max(0, now.getTime() - date.getTime());
      const diffSecs = Math.floor(diffMs / 1000);
      const diffMins = Math.floor(diffSecs / 60);
      const diffHours = Math.floor(diffMins / 60);

      if (diffHours < 24) {
        if (diffMins < 1) {
          setDisplayTime(`hace ${diffSecs} segundo${diffSecs !== 1 ? "s" : ""}`);
        } else if (diffHours < 1) {
          setDisplayTime(`hace ${diffMins} minuto${diffMins !== 1 ? "s" : ""}`);
        } else {
          setDisplayTime(`hace ${diffHours} hora${diffHours !== 1 ? "s" : ""}`);
        }
      } else {
        setDisplayTime(
          date.toLocaleString("es-AR", {
            day: "2-digit",
            month: "2-digit",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
          })
        );
      }
    };

    calculateTime();
    
    // Update every minute to keep relative time accurate
    const interval = setInterval(calculateTime, 60000);
    return () => clearInterval(interval);
  }, [timestamp]);

  return (
    <p className="text-sm font-medium text-zinc-500">
      Última actualización: {displayTime}
    </p>
  );
}
