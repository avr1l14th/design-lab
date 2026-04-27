import React from "react";
import ProgressDots from "./ProgressDots";
import { LOGO_ICON, LOGO_TEXT } from "./assets";
import { useReducedMotion } from "./useReducedMotion";

export interface OnboardingShellProps {
  title: string;
  subtitle: string;
  children: React.ReactNode;
  step: number;
  totalSteps: number;
  canProceed: boolean;
  onContinue: () => void;
  /** Frame max-width — 1236 for screen 1 in Figma, 1300 for screens 2+. Use 1300 by default. */
  frameWidth?: number;
  /** Inner content-block width — 700 in Figma for screens 1-3. */
  contentWidth?: number;
  /** Skip rendering the built-in Continue button (for screens where selecting a card auto-advances). */
  hideCta?: boolean;
}

export default function OnboardingShell({
  title,
  subtitle,
  children,
  step,
  totalSteps,
  canProceed,
  onContinue,
  frameWidth = 1300,
  contentWidth = 700,
  hideCta = false,
}: OnboardingShellProps) {
  const reducedMotion = useReducedMotion();
  return (
    <div
      style={{
        background: "#fff",
        minHeight: "100vh",
        width: "100%",
        fontFamily: "'Inter', sans-serif",
        display: "flex",
        justifyContent: "center",
      }}
    >
      <div
        style={{
          width: frameWidth,
          maxWidth: "100%",
          minHeight: "100vh",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
        }}
      >
        {/* Top: logo — pinned to the top of the viewport */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "32px 6px",
            width: "100%",
            flexShrink: 0,
          }}
        >
          <div style={{ display: "flex", gap: 10, alignItems: "center", padding: 1 }}>
            <img src={LOGO_ICON} alt="" style={{ width: 32, height: 32, flexShrink: 0 }} />
            <img src={LOGO_TEXT} alt="MyMeet.ai" style={{ width: 93, height: 19.5, flexShrink: 0 }} />
          </div>
        </div>

        {/* Middle: content block — flexes to fill free space, centered */}
        <div
          style={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            gap: 38.032,
            width: contentWidth,
            padding: "24px 0",
          }}
        >
          {/* Title block */}
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              gap: 15.213,
              color: "#212833",
              textAlign: "center",
            }}
          >
            <h1
              style={{
                margin: 0,
                fontFamily: "'Inter', sans-serif",
                fontSize: 32,
                fontWeight: 500,
                letterSpacing: -0.96,
                lineHeight: "normal",
              }}
            >
              {title}
            </h1>
            <p
              style={{
                margin: 0,
                fontFamily: "'Inter', sans-serif",
                fontSize: 16,
                fontWeight: 400,
                letterSpacing: -0.32,
                lineHeight: "normal",
              }}
            >
              {subtitle}
            </p>
          </div>

          {/* Options + CTA */}
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "flex-start",
              gap: 32,
            }}
          >
            {children}

            {!hideCta && (
              <button
                type="button"
                onClick={onContinue}
                disabled={!canProceed}
                style={{
                  height: 40,
                  padding: "12px 24px",
                  width: "100%",
                  background: canProceed ? "#0138c7" : "#809be3",
                  border: "none",
                  borderRadius: 4,
                  color: "#fff",
                  fontFamily: "'Inter', sans-serif",
                  fontSize: 14,
                  fontWeight: 400,
                  letterSpacing: -0.28,
                  lineHeight: 1.35,
                  cursor: canProceed ? "pointer" : "not-allowed",
                  transition: reducedMotion ? "none" : "background 0.12s ease",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  whiteSpace: "nowrap",
                  touchAction: "manipulation",
                }}
              >
                Продолжить
              </button>
            )}
          </div>
        </div>

        {/* Bottom: progress — pinned to the bottom of the viewport */}
        <div style={{ flexShrink: 0, width: "100%" }}>
          <ProgressDots total={totalSteps} current={step} />
        </div>
      </div>
    </div>
  );
}
