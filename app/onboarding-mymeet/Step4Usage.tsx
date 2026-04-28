import React from "react";
import { STEP4_IMAGES } from "./assets";
import { useReducedMotion } from "./useReducedMotion";
import { useIsMobile } from "./useIsMobile";

export type Step4Value = "self" | "team" | null;

/* Figma frame 30317:7602. Two cards side-by-side, 720px total width, gap 16. */
export default function Step4Usage({
  value,
  onChange,
}: {
  value: Step4Value;
  onChange: (v: Step4Value) => void;
}) {
  const isMobile = useIsMobile();
  return (
    <div
      style={{
        display: "flex",
        flexDirection: isMobile ? "column" : "row",
        gap: 16,
        alignItems: isMobile ? "stretch" : "center",
        width: isMobile ? "100%" : 720,
        maxWidth: "100%",
      }}
    >
      <UsageCard
        active={value === "self"}
        image={STEP4_IMAGES.self}
        title="Для себя"
        description="Личное пространство для встреч и записей"
        onClick={() => onChange("self")}
      />
      <UsageCard
        active={value === "team"}
        image={STEP4_IMAGES.team}
        title="Для команды"
        description="Удобная работа со встречами в команде"
        onClick={() => onChange("team")}
      />
    </div>
  );
}

function UsageCard({
  active,
  image,
  title,
  description,
  onClick,
}: {
  active: boolean;
  image: string;
  title: string;
  description: string;
  onClick: () => void;
}) {
  const [hovered, setHovered] = React.useState(false);
  const reducedMotion = useReducedMotion();
  const isMobile = useIsMobile();
  const borderColor = active || hovered ? "#0138c7" : "#efefef";
  const textBg = active ? "#f2f5fc" : "#fff";
  const borderTransition = reducedMotion ? "none" : "border-color 0.12s ease";
  const bodyTransition = reducedMotion ? "none" : "border-color 0.12s ease, background 0.12s ease";

  return (
    <button
      type="button"
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        flex: "1 0 0",
        minWidth: 0,
        display: "flex",
        flexDirection: "column",
        alignItems: "flex-start",
        padding: 0,
        background: "transparent",
        border: "none",
        borderRadius: 4,
        overflow: "hidden",
        cursor: "pointer",
        fontFamily: "'Inter', sans-serif",
        textAlign: "left",
        touchAction: "manipulation",
      }}
    >
      {/* Hero image */}
      <div
        style={{
          height: isMobile ? 140 : 200,
          width: "100%",
          borderTopLeftRadius: 4,
          borderTopRightRadius: 4,
          borderTop: `1px solid ${borderColor}`,
          borderLeft: `1px solid ${borderColor}`,
          borderRight: `1px solid ${borderColor}`,
          overflow: "hidden",
          transition: borderTransition,
        }}
      >
        <img
          src={image}
          alt=""
          style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
        />
      </div>

      {/* Text */}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: 8,
          alignItems: "center",
          width: "100%",
          padding: isMobile ? "16px 16px 20px" : "24px 32px 32px",
          borderBottom: `1px solid ${borderColor}`,
          borderLeft: `1px solid ${borderColor}`,
          borderRight: `1px solid ${borderColor}`,
          borderBottomLeftRadius: 4,
          borderBottomRightRadius: 4,
          background: textBg,
          textAlign: "center",
          transition: bodyTransition,
        }}
      >
        <p
          style={{
            margin: 0,
            fontSize: 20,
            fontWeight: 500,
            letterSpacing: -0.2,
            color: "#212833",
            lineHeight: "normal",
          }}
        >
          {title}
        </p>
        <p
          style={{
            margin: 0,
            fontSize: 13,
            fontWeight: 400,
            letterSpacing: -0.13,
            color: "#818aa3",
            lineHeight: "normal",
          }}
        >
          {description}
        </p>
      </div>
    </button>
  );
}
