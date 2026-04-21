import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Analytics } from "@vercel/analytics/next";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
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
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
        <Analytics />
      </body>
    </html>
  );
}
