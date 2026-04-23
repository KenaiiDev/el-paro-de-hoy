import type { Metadata } from "next";
import { Outfit, Lora } from "next/font/google";
import "./globals.css";
import { Analytics } from "@vercel/analytics/next";

const outfitSans = Outfit({
  variable: "--font-outfit-sans",
  subsets: ["latin"],
});

const loraSerif = Lora({
  variable: "--font-lora-serif",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "¿Hay paro hoy? | Buenos Aires",
  description:
    "Consultá en tiempo real si hay paro en transporte, educación, salud, aeronáutico, bancarios, justicia y más en Buenos Aires y Argentina.",
  keywords: [
    "paro",
    "transporte",
    "AMBA",
    "Buenos Aires",
    "paro hoy",
    "educación",
    "salud",
    "bancarios",
    "aeronautico",
    "justicia",
  ],
  openGraph: {
    title: "¿Hay paro hoy?",
    description:
      "Estado en tiempo real de paros por sector en Buenos Aires y Argentina",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body
        className={`${outfitSans.variable} ${loraSerif.variable} antialiased relative min-h-screen selection:bg-zinc-200 selection:text-zinc-900 bg-zinc-50 text-zinc-900`}
      >
        {children}
        <Analytics />
      </body>
    </html>
  );
}
