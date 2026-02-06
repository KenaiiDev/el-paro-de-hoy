"use client";

import { useEffect } from "react";

export function DynamicFavicon({ isStrike }: { isStrike: boolean }) {
  useEffect(() => {
    const color = isStrike ? "#dc2626" : "#059669";

    const svg = `
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
        <circle cx="50" cy="50" r="45" fill="${color}"/>
      </svg>
    `;

    const favicon = document.querySelector(
      "link[rel='icon']",
    ) as HTMLLinkElement;
    if (favicon) {
      favicon.href = `data:image/svg+xml,${encodeURIComponent(svg)}`;
    } else {
      const newFavicon = document.createElement("link");
      newFavicon.rel = "icon";
      newFavicon.href = `data:image/svg+xml,${encodeURIComponent(svg)}`;
      document.head.appendChild(newFavicon);
    }
  }, [isStrike]);

  return null;
}
