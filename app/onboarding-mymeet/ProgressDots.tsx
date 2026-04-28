import React from "react";
import { CHECKMARK_DOT } from "./assets";
import { useReducedMotion } from "./useReducedMotion";
import { useTheme } from "./ThemeContext";

const DOT_TOKENS = {
  light: { active: "#8a8b8d", inactive: "#d9d9d9" },
  dark: { active: "#929292", inactive: "#2c2c2c" },
} as const;

/* Figma 30317:7529 — 16×16 container with 12×12 inner dot (left:2,top:2).
 * Completed state swaps in CHECKMARK_DOT image.
 * Both layers are kept mounted and crossfaded via opacity/scale so the
 * transition between current → completed animates smoothly. */
export default function ProgressDots({
  total,
  current,
}: {
  total: number;
  /** 0-based index of the active step */
  current: number;
}) {
  const reducedMotion = useReducedMotion();
  const colors = DOT_TOKENS[useTheme()];
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: 16,
        padding: "32px 6px",
        borderRadius: 23,
        width: "100%",
      }}
    >
      {Array.from({ length: total }).map((_, i) => (
        <Dot
          key={i}
          completed={i < current}
          active={i === current}
          reducedMotion={reducedMotion}
          activeColor={colors.active}
          inactiveColor={colors.inactive}
        />
      ))}
    </div>
  );
}

function Dot({
  completed,
  active,
  reducedMotion,
  activeColor,
  inactiveColor,
}: {
  completed: boolean;
  active: boolean;
  reducedMotion: boolean;
  activeColor: string;
  inactiveColor: string;
}) {
  const ease = "cubic-bezier(0.4, 0, 0.2, 1)";
  return (
    <div
      style={{
        width: 16,
        height: 16,
        position: "relative",
        overflow: "hidden",
        flexShrink: 0,
      }}
    >
      {/* Gray inner dot — fades out when completed (size stays constant) */}
      <div
        style={{
          position: "absolute",
          left: 2,
          top: 2,
          width: 12,
          height: 12,
          borderRadius: 32,
          background: active ? activeColor : inactiveColor,
          opacity: completed ? 0 : 1,
          transition: reducedMotion
            ? "none"
            : `opacity 0.35s ${ease}, background 0.45s ${ease}`,
        }}
      />

      {/* Completed checkmark — fades + scales in (0.1s delay) */}
      <img
        src={CHECKMARK_DOT}
        alt=""
        aria-hidden="true"
        width={16}
        height={16}
        style={{
          position: "absolute",
          inset: 0,
          width: 16,
          height: 16,
          opacity: completed ? 1 : 0,
          transform: completed ? "scale(1)" : "scale(0.3)",
          transformOrigin: "center",
          transition: reducedMotion
            ? "none"
            : `opacity 0.35s ${ease} 0.1s, transform 0.35s ${ease} 0.1s`,
        }}
      />
    </div>
  );
}
