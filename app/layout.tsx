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
