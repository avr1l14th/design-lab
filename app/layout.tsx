import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import AgentationDev from "../components/AgentationDev";
import LabFAB from "../components/LabFAB";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin", "cyrillic"],
});

export const metadata: Metadata = {
  title: "Дизайн лаборатория mymeet.ai",
  description: "Интерактивные прототипы mymeet.ai",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${inter.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <head>
        {/* Visitors analytics — грузится на всех страницах, всегда. */}
        {/* eslint-disable-next-line @next/next/no-sync-scripts */}
        <script src="https://cdn.visitors.now/v.js" data-token="b2bc581d-520a-47f7-916e-6fd8ab19142a"></script>
        {/* Figma capture script — нужен для generate_figma_design.
            Активен только в dev-режиме; в проде не подгружается. */}
        {process.env.NODE_ENV !== "production" && (
          // eslint-disable-next-line @next/next/no-sync-scripts
          <script src="https://mcp.figma.com/mcp/html-to-design/capture.js" async />
        )}
      </head>
      <body className="min-h-full flex flex-col">
        {children}
        <LabFAB />
        {process.env.NODE_ENV !== "production" && <AgentationDev />}
      </body>
    </html>
  );
}
