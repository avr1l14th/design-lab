"use client";

import React, { useState } from "react";
import { type Theme } from "./ThemeContext";

/* Floating top-right button that swaps light ↔ dark.
 * Sun icon = currently dark (click to go light).
 * Moon icon = currently light (click to go dark). */
export default function ThemeToggle({
  theme,
  onChange,
}: {
  theme: Theme;
  onChange: (next: Theme) => void;
}) {
  const [hovered, setHovered] = useState(false);
  const isDark = theme === "dark";

  const bg = isDark
    ? hovered ? "#242424" : "transparent"
    : hovered ? "#fafafa" : "#fff";
  const border = isDark ? "#242424" : "#efefef";
  const stroke = isDark ? "#fff" : "#212833";

  return (
    <button
      type="button"
      aria-label={isDark ? "Включить светлую тему" : "Включить тёмную тему"}
      onClick={() => onChange(isDark ? "light" : "dark")}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        position: "fixed",
        top: 24,
        right: 24,
        width: 40,
        height: 40,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: bg,
        border: `1px solid ${border}`,
        borderRadius: 4,
        cursor: "pointer",
        transition: "background 0.12s ease, border-color 0.12s ease",
        touchAction: "manipulation",
        zIndex: 10,
      }}
    >
      {isDark ? <SunIcon stroke={stroke} /> : <MoonIcon stroke={stroke} />}
    </button>
  );
}

function SunIcon({ stroke }: { stroke: string }) {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
      <circle cx="10" cy="10" r="3.5" stroke={stroke} strokeWidth="1.5" />
      {[0, 45, 90, 135, 180, 225, 270, 315].map((angle) => {
        const rad = (angle * Math.PI) / 180;
        const x1 = 10 + Math.cos(rad) * 6.5;
        const y1 = 10 + Math.sin(rad) * 6.5;
        const x2 = 10 + Math.cos(rad) * 8.5;
        const y2 = 10 + Math.sin(rad) * 8.5;
        return (
          <line
            key={angle}
            x1={x1}
            y1={y1}
            x2={x2}
            y2={y2}
            stroke={stroke}
            strokeWidth="1.5"
            strokeLinecap="round"
          />
        );
      })}
    </svg>
  );
}

function MoonIcon({ stroke }: { stroke: string }) {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
      <path
        d="M16 11.2A6.5 6.5 0 0 1 8.8 4a6.5 6.5 0 1 0 7.2 7.2Z"
        stroke={stroke}
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
    </svg>
  );
}
