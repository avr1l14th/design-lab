import React, { useState } from "react";
import ProgressDots from "./ProgressDots";
import { LOGO_ICON, LOGO_TEXT, STEP5_TEAM } from "./assets";
import { useReducedMotion } from "./useReducedMotion";
import { useIsMobile } from "./useIsMobile";

/* Figma frame 30806:1377 — single-column layout:
 *   logo top → title → 2 cards (form 440 + dark benefits 468) → progress dots */
export default function Step5Team({
  step,
  totalSteps,
  onBack: _onBack,
  onFinish,
}: {
  step: number;
  totalSteps: number;
  onBack: () => void;
  onFinish: () => void;
}) {
  const [company, setCompany] = useState("");
  const [contact, setContact] = useState("");
  const [size, setSize] = useState("");
  const [focused, setFocused] = useState<string | null>(null);
  const reducedMotion = useReducedMotion();
  const isMobile = useIsMobile();

  const canSubmit = company.trim().length > 0 && contact.trim().length > 0 && size.length > 0;

  const fieldStyle = (id: string): React.CSSProperties => ({
    ...baseInputStyle,
    boxShadow: focused === id ? "0 0 0 2px #0138c7" : "none",
    transition: reducedMotion ? "none" : "box-shadow 0.12s ease",
  });

  return (
    <div
      style={{
        width: "100%",
        minHeight: "100vh",
        background: "#fff",
        display: "flex",
        justifyContent: "center",
        fontFamily: "'Inter', sans-serif",
      }}
    >
      <div
        style={{
          width: isMobile ? "100%" : 1300,
          maxWidth: "100%",
          minHeight: "100vh",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        {/* Top: Logo */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "32px 6px",
            flexShrink: 0,
          }}
        >
          <div style={{ display: "flex", gap: 10, alignItems: "center", padding: 1 }}>
            <img src={LOGO_ICON} alt="" width={32} height={32} style={{ width: 32, height: 32 }} />
            <img src={LOGO_TEXT} alt="MyMeet.ai" width={93} height={20} style={{ width: 93, height: 19.5 }} />
          </div>
        </div>

        {/* Middle: title block + cards */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 40,
          }}
        >
          {/* Title + subtitle */}
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 16, padding: isMobile ? "0 16px" : 0 }}>
            <h1
              style={{
                margin: 0,
                fontSize: isMobile ? 24 : 32,
                fontWeight: 500,
                letterSpacing: isMobile ? -0.72 : -0.96,
                color: "#212833",
                lineHeight: "normal",
                width: isMobile ? "100%" : 369,
                maxWidth: "100%",
                textAlign: "center",
              }}
            >
              Получите тариф Business на команду
            </h1>
            <p
              style={{
                margin: 0,
                fontSize: isMobile ? 14 : 16,
                fontWeight: 400,
                letterSpacing: -0.32,
                color: "#212833",
                lineHeight: "normal",
                textAlign: "center",
                whiteSpace: "pre-wrap",
              }}
            >
              Свяжемся с вами и предоставим временный доступ.
              <br />А пока можете попробовать mymeet.ai в деле
            </p>
          </div>

          {/* Cards row */}
          <div
            style={{
              display: "flex",
              flexDirection: isMobile ? "column" : "row",
              gap: isMobile ? 16 : 20,
              alignItems: "stretch",
              justifyContent: "center",
              width: isMobile ? "100%" : "auto",
              padding: isMobile ? "0 16px" : 0,
              boxSizing: "border-box",
            }}
          >
            {/* Form card (440px on desktop, full-width on mobile) */}
            <div
              style={{
                width: isMobile ? "100%" : 440,
                background: "#fff",
                border: "1px solid #efefef",
                borderRadius: 4,
                padding: 24,
                display: "flex",
                flexDirection: "column",
                gap: 20,
                boxSizing: "border-box",
              }}
            >
              <FormField label="Название компании" htmlFor="company">
                <input
                  id="company"
                  type="text"
                  autoComplete="organization"
                  value={company}
                  placeholder="Mymeet.ai"
                  onChange={(e) => setCompany(e.target.value)}
                  onFocus={() => setFocused("company")}
                  onBlur={() => setFocused(null)}
                  style={fieldStyle("company")}
                />
              </FormField>
              <FormField label="Телефон или Telegram" htmlFor="contact">
                <input
                  id="contact"
                  type="tel"
                  autoComplete="tel"
                  value={contact}
                  placeholder="+7 052 052 52 52"
                  onChange={(e) => setContact(e.target.value)}
                  onFocus={() => setFocused("contact")}
                  onBlur={() => setFocused(null)}
                  style={fieldStyle("contact")}
                />
              </FormField>
              <FormField label="Количество сотрудников" htmlFor="size">
                <div style={{ position: "relative" }}>
                  <select
                    id="size"
                    value={size}
                    onChange={(e) => setSize(e.target.value)}
                    onFocus={() => setFocused("size")}
                    onBlur={() => setFocused(null)}
                    style={{
                      ...fieldStyle("size"),
                      appearance: "none",
                      backgroundImage: "none",
                      paddingRight: 40,
                      background: "#fff",
                      color: size ? "#212833" : "#c7c8ca",
                      cursor: "pointer",
                    }}
                  >
                    <option value="" disabled>Выберите</option>
                    <option value="1-10">1–10</option>
                    <option value="11-50">11–50</option>
                    <option value="51-200">51–200</option>
                    <option value="200+">Больше 200</option>
                  </select>
                  <img
                    src={STEP5_TEAM.chevronDown}
                    alt=""
                    width={20}
                    height={20}
                    style={{
                      position: "absolute",
                      right: 12,
                      top: "50%",
                      transform: "translateY(-50%) rotate(180deg)",
                      width: 20,
                      height: 20,
                      pointerEvents: "none",
                    }}
                  />
                </div>
              </FormField>
              <button
                type="button"
                onClick={onFinish}
                disabled={!canSubmit}
                style={{
                  height: 40,
                  padding: "12px 24px",
                  background: canSubmit ? "#0138c7" : "#809be3",
                  border: "none",
                  borderRadius: 4,
                  color: "#fff",
                  fontSize: 14,
                  fontWeight: 400,
                  letterSpacing: -0.28,
                  lineHeight: 1.35,
                  cursor: canSubmit ? "pointer" : "not-allowed",
                  fontFamily: "'Inter', sans-serif",
                  transition: reducedMotion ? "none" : "background 0.12s ease",
                  touchAction: "manipulation",
                }}
              >
                Отправить
              </button>
              <button
                type="button"
                onClick={onFinish}
                style={{
                  height: 40,
                  padding: "12px 24px",
                  background: "#f7f7f8",
                  border: "none",
                  borderRadius: 4,
                  color: "#212833",
                  fontSize: 14,
                  fontWeight: 400,
                  letterSpacing: -0.28,
                  lineHeight: 1.35,
                  cursor: "pointer",
                  fontFamily: "'Inter', sans-serif",
                  touchAction: "manipulation",
                }}
              >
                Перейти в приложение
              </button>
            </div>

            {/* Dark benefits card (468px on desktop, full-width on mobile) */}
            <div
              style={{
                width: isMobile ? "100%" : 468,
                borderRadius: 4,
                padding: 24,
                position: "relative",
                overflow: "hidden",
                boxSizing: "border-box",
                display: "flex",
                flexDirection: "column",
                justifyContent: "center",
              }}
            >
              <div
                aria-hidden="true"
                style={{
                  position: "absolute",
                  inset: 0,
                  pointerEvents: "none",
                  borderRadius: 4,
                  overflow: "hidden",
                }}
              >
                <img
                  src={STEP5_TEAM.cardBg}
                  alt=""
                  style={{
                    position: "absolute",
                    inset: 0,
                    width: "100%",
                    height: "100%",
                    objectFit: "cover",
                  }}
                />
                <div
                  style={{
                    position: "absolute",
                    inset: 0,
                    background: "#212833",
                    mixBlendMode: "color",
                  }}
                />
              </div>

              <div
                style={{
                  position: "relative",
                  minHeight: isMobile ? "auto" : 361,
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "center",
                }}
              >
                <div style={{ display: "flex", flexDirection: "column", gap: 6.109 }}>
                  <BenefitRow icon={STEP5_TEAM.featureMedia} label="Полнофункциональный медиаплеер" />
                  <BenefitRow icon={STEP5_TEAM.featureCabinet} label="Удобный кабинет для команды" />
                  <BenefitRow icon={STEP5_TEAM.featureCustomize} label="Кастомизация бота и словаря терминов" />
                  <BenefitRow icon={STEP5_TEAM.featureManager} label="Личный аккаунт менеджер и поддержка" />
                  <BenefitRow icon={STEP5_TEAM.featurePricing} label="Командные варианты цен" />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom: progress dots */}
        <div style={{ flexShrink: 0, width: "100%" }}>
          <ProgressDots total={totalSteps} current={step} />
        </div>
      </div>
    </div>
  );
}

function FormField({ label, htmlFor, children }: { label: string; htmlFor: string; children: React.ReactNode }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8, width: "100%" }}>
      <label
        htmlFor={htmlFor}
        style={{
          margin: 0,
          fontSize: 14,
          fontWeight: 500,
          letterSpacing: -0.28,
          color: "#56596c",
          lineHeight: 1.35,
        }}
      >
        {label}
      </label>
      {children}
    </div>
  );
}

const baseInputStyle: React.CSSProperties = {
  width: "100%",
  height: 40,
  padding: 12,
  border: "1px solid #efefef",
  borderRadius: 4,
  fontFamily: "'Inter', sans-serif",
  fontSize: 14,
  fontWeight: 400,
  letterSpacing: -0.28,
  lineHeight: 1.35,
  color: "#212833",
  outline: "none",
  boxSizing: "border-box",
  background: "#fff",
};

function BenefitRow({ icon, label }: { icon: string; label: string }) {
  return (
    <div
      style={{
        padding: 10,
        background: "rgba(255,255,255,0.1)",
        backdropFilter: "blur(8px)",
        WebkitBackdropFilter: "blur(8px)",
        borderRadius: 4,
        display: "flex",
        gap: 12.218,
        alignItems: "center",
      }}
    >
      <div
        style={{
          width: 36.653,
          height: 36.653,
          padding: 9.163,
          background: "rgba(255,255,255,0.1)",
          backdropFilter: "blur(4.582px)",
          WebkitBackdropFilter: "blur(4.582px)",
          borderRadius: 4,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
          boxSizing: "border-box",
        }}
      >
        <img src={icon} alt="" width={18} height={18} style={{ width: 18.327, height: 18.327 }} />
      </div>
      <p
        style={{
          margin: 0,
          flex: "1 0 0",
          fontSize: 14,
          fontWeight: 500,
          letterSpacing: -0.28,
          color: "#fff",
          lineHeight: 1.35,
        }}
      >
        {label}
      </p>
    </div>
  );
}
