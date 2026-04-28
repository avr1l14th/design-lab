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
    >
      <body className="min-h-full flex flex-col">
        {children}
        <LabFAB />
        {process.env.NODE_ENV !== "production" && <AgentationDev />}
      </body>
    </html>
  );
}
