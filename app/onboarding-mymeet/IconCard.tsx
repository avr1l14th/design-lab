import React from "react";
import { useReducedMotion } from "./useReducedMotion";

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

export default function IconCard({
  icon,
  iconSize = 24,
  label,
  labelWidth,
  labelNoWrap,
  selected,
  onClick,
}: IconCardProps) {
  const [hovered, setHovered] = React.useState(false);
  const reducedMotion = useReducedMotion();
  /* Figma states (node 30809:1642 for hover):
   * - default:  border #efefef, bg #fff,     icon default
   * - hover:    border #efefef, bg #fafafa,  icon default
   * - selected: border #0138c7, bg #f2f5fc,  icon blue */
  const borderColor = selected ? "#0138c7" : "#efefef";
  const background = selected ? "#f2f5fc" : hovered ? "#fafafa" : "#fff";
  const transition = reducedMotion ? "none" : "border-color 0.12s ease, background 0.12s ease";

  return (
    <button
      type="button"
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        width: 210,
        height: 152,
        padding: 48,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 16,
        border: `1px solid ${borderColor}`,
        borderRadius: 4,
        background,
        overflow: "hidden",
        cursor: "pointer",
        fontFamily: "'Inter', sans-serif",
        transition,
        flexShrink: 0,
        touchAction: "manipulation",
      }}
    >
      {/* Always mask-based so default reads as flat gray (Figma 30317:7529)
       * and selected gets exact #0138C7 — no PNG color bleed-through. */}
      <div
        aria-hidden="true"
        style={{
          width: iconSize,
          height: iconSize,
          flexShrink: 0,
          background: selected ? "#0138C7" : "#818aa3",
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
          color: "#212833",
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
