"use client";

import React from "react";
import { useReducedMotion } from "./useReducedMotion";
import { useTheme } from "./ThemeContext";
import { useIsMobile } from "./useIsMobile";

export interface IconCardProps {
  icon: string;
  iconSize?: number;
  label: string;
  /** Max width for the label text; matches Figma per-card settings (some labels wrap in Figma). */
  labelWidth?: number;
  /** Label uses `whiteSpace: nowrap` when Figma marks the text as such. */
  labelNoWrap?: boolean;
  selected: boolean;
  onClick: () => void;
}

const TOKENS = {
  light: {
    borderDefault: "#efefef",
    borderSelected: "#0138c7",
    bgDefault: "#fff",
    bgHover: "#fafafa",
    bgSelected: "#f2f5fc",
    iconDefault: "#818aa3",
    iconSelected: "#0138C7",
    label: "#212833",
  },
  dark: {
    borderDefault: "#242424",
    borderSelected: "#2554cd",
    bgDefault: "transparent",
    bgHover: "#1c1c1c",
    bgSelected: "#181f33",
    iconDefault: "#818aa3",
    iconSelected: "#2554cd",
    label: "#fff",
  },
} as const;

export default function IconCard({
  icon,
  iconSize = 20,
  label,
  labelWidth,
  labelNoWrap,
  selected,
  onClick,
}: IconCardProps) {
  const [hovered, setHovered] = React.useState(false);
  const reducedMotion = useReducedMotion();
  const t = TOKENS[useTheme()];
  const isMobile = useIsMobile();

  const borderColor = selected ? t.borderSelected : t.borderDefault;
  const background = selected ? t.bgSelected : hovered ? t.bgHover : t.bgDefault;
  const transition = reducedMotion ? "none" : "border-color 0.12s ease, background 0.12s ease";

  return (
    <button
      type="button"
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        width: isMobile ? "100%" : 224,
        height: isMobile ? 112 : 144,
        padding: isMobile ? 16 : 48,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: isMobile ? 12 : 16,
        border: `1px solid ${borderColor}`,
        borderRadius: 4,
        background,
        overflow: "hidden",
        cursor: "pointer",
        fontFamily: "'Inter', sans-serif",
        transition,
        flexShrink: 0,
        touchAction: "manipulation",
        boxSizing: "border-box",
      }}
    >
      {/* Mask-based fill — exact icon color in both default and selected. */}
      <div
        aria-hidden="true"
        style={{
          width: iconSize,
          height: iconSize,
          flexShrink: 0,
          background: selected ? t.iconSelected : t.iconDefault,
          WebkitMaskImage: `url(${icon})`,
          maskImage: `url(${icon})`,
          WebkitMaskSize: "contain",
          maskSize: "contain",
          WebkitMaskRepeat: "no-repeat",
          maskRepeat: "no-repeat",
          WebkitMaskPosition: "center",
          maskPosition: "center",
          transition: reducedMotion ? "none" : "background 0.12s ease",
        }}
      />
      <p
        style={{
          margin: 0,
          fontSize: 13,
          fontWeight: 400,
          letterSpacing: -0.13,
          color: t.label,
          textAlign: "center",
          lineHeight: "normal",
          width: labelWidth ?? "auto",
          whiteSpace: labelNoWrap ? "nowrap" : "normal",
        }}
      >
        {label}
      </p>
    </button>
  );
}
