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
  title: "¿Hay paro de transporte hoy? | AMBA",
  description:
    "Consultá en tiempo real si hay paro de transporte en el Área Metropolitana de Buenos Aires (AMBA). Información actualizada de colectivos, trenes y subtes.",
  keywords: [
    "paro",
    "transporte",
    "AMBA",
    "Buenos Aires",
    "colectivos",
    "trenes",
    "subte",
  ],
  openGraph: {
    title: "¿Hay paro de transporte hoy?",
    description: "Consultá en tiempo real si hay paro de transporte en AMBA",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
        <Analytics />
      </body>
    </html>
  );
}
