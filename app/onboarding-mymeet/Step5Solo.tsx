import React, { useState } from "react";
import { STEP5_SOLO } from "./assets";
import { useIsMobile } from "./useIsMobile";

type PlanId = "free" | "lite" | "pro" | "business";

interface Plan {
  id: PlanId;
  name: string;
  price: string;
  priceOld?: string;
  priceSuffix?: string;
  /** Solid header color. In Figma it's an abstract image with a hue/color
   * overlay; visually it reads as a solid tint, so we use the tint directly. */
  headerColor: string;
  /** Name color on the colored header. */
  nameColor: string;
  cta: string;
  featuresTitle: string;
  features: { icon: "included" | "check" | "star"; label: string; underline?: boolean }[];
  popular?: boolean;
}

const PLANS: Plan[] = [
  {
    id: "free",
    name: "Free",
    price: "0₽",
    priceSuffix: "бесплатно навсегда",
    headerColor: "#f3f3f3",
    nameColor: "#212833",
    cta: "Продолжить",
    featuresTitle: "Идеально для начинающих:",
    features: [
      { icon: "included", label: "180 мин в месяц", underline: true },
      { icon: "included", label: "10 запросов в AI-чат", underline: true },
      { icon: "included", label: "Календари и ВКС-интеграции", underline: true },
      { icon: "included", label: "Файлы размера 1 ГБ" },
      { icon: "included", label: "AI-отчет" },
    ],
  },
  {
    id: "lite",
    name: "Lite",
    price: "850₽",
    priceOld: "990₽",
    priceSuffix: "На пользователя/месяц",
    headerColor: "#ef9735",
    nameColor: "#fff",
    cta: "Продолжить",
    featuresTitle: "Для 3-8 встреч в неделю:",
    features: [
      { icon: "included", label: "500 мин в месяц", underline: true },
      { icon: "included", label: "10 запросов в AI-чат", underline: true },
      { icon: "included", label: "Календари и ВКС-интеграции", underline: true },
      { icon: "included", label: "Файлы размера 1 ГБ" },
      { icon: "included", label: "AI-отчет" },
    ],
  },
  {
    id: "pro",
    name: "Pro",
    price: "2 490₽",
    priceOld: "2 990₽",
    priceSuffix: "На пользователя/месяц",
    headerColor: "#1e58f0",
    nameColor: "#fff",
    cta: "Продолжить",
    popular: true,
    featuresTitle: "Для 10-12 встреч в неделю:",
    features: [
      { icon: "included", label: "Бесплатные минуты для онлайн-встреч и хром-расширения", underline: true },
      { icon: "included", label: "2000 мин в месяц для файлов", underline: true },
      { icon: "included", label: "Календари и ВКС-интеграции", underline: true },
      { icon: "included", label: "AI-Улучшение транскрипта", underline: true },
      { icon: "included", label: "AI-чат без ограничений" },
    ],
  },
  {
    id: "business",
    name: "Business",
    price: "По запросу",
    priceSuffix: "От 3 пользователей/год",
    headerColor: "#212833",
    nameColor: "#fff",
    cta: "Получить тестовый доступ",
    featuresTitle: "Все функции PRO, а также:",
    features: [
      { icon: "star", label: "Минимум от 3 сотрудников" },
      { icon: "check", label: "Полифункциональное демо" },
      { icon: "check", label: "Личный аккаунт менеджер" },
      { icon: "check", label: "SSO вход для сотрудников" },
      { icon: "check", label: "Командные варианты цен" },
      { icon: "star", label: "On-premise решение" },
    ],
  },
];

export default function Step5Solo({ onFinish }: { onFinish: (plan: PlanId) => void }) {
  const [hoveredId, setHoveredId] = useState<PlanId | null>(null);
  const isMobile = useIsMobile();
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: isMobile ? 24 : 40,
        width: isMobile ? "100%" : 1236,
        maxWidth: "100%",
        padding: isMobile ? "0 16px" : 0,
        boxSizing: "border-box",
      }}
    >
      <h1
        style={{
          margin: 0,
          fontSize: isMobile ? 24 : 32,
          fontWeight: 500,
          letterSpacing: isMobile ? -0.72 : -0.96,
          color: "#212833",
          lineHeight: "normal",
        }}
      >
        Выберите тариф
      </h1>

      <div
        style={{
          display: "flex",
          flexDirection: isMobile ? "column" : "row",
          gap: isMobile ? 12 : 8,
          alignItems: "stretch",
          width: "100%",
        }}
      >
        {PLANS.map((plan) => (
          <PlanCard
            key={plan.id}
            plan={plan}
            hovered={hoveredId === plan.id}
            onMouseEnter={() => setHoveredId(plan.id)}
            onMouseLeave={() => setHoveredId(null)}
            onClick={() => onFinish(plan.id)}
          />
        ))}
      </div>
    </div>
  );
}

function PlanCard({
  plan,
  hovered,
  onMouseEnter,
  onMouseLeave,
  onClick,
}: {
  plan: Plan;
  hovered: boolean;
  onMouseEnter: () => void;
  onMouseLeave: () => void;
  onClick: () => void;
}) {
  const isMobile = useIsMobile();
  return (
    <div
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      style={{
        width: isMobile ? "100%" : 262,
        background: "#fff",
        borderRadius: 4,
        display: "flex",
        flexDirection: "column",
        boxSizing: "border-box",
        border: hovered ? "1px solid #0138c7" : "1px solid transparent",
        transition: "border-color 0.12s ease",
      }}
    >
      {/* Header */}
      <div
        style={{
          height: 110,
          position: "relative",
          overflow: "hidden",
          borderTopLeftRadius: 4,
          borderTopRightRadius: 4,
          background: plan.headerColor,
        }}
      >
        {/* Plan name — Figma uses SVG wordmarks; simplified to text for prototype. */}
        <div
          style={{
            position: "absolute",
            left: 17,
            top: 62,
            fontSize: 28,
            fontWeight: 600,
            letterSpacing: -0.84,
            color: plan.nameColor,
            lineHeight: 1,
            fontFamily: "'Inter', sans-serif",
            fontStyle: "italic",
          }}
        >
          {plan.name}
        </div>

        {/* Popular badge */}
        {plan.popular && (
          <div
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              right: 0,
              background: "rgba(0,0,0,0.3)",
              padding: 8,
              display: "flex",
              alignItems: "center",
              justifyContent: "flex-start",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "0 8px" }}>
              <img src={STEP5_SOLO.popularIcon} alt="" style={{ width: 16, height: 16 }} />
              <span
                style={{
                  fontSize: 13,
                  fontWeight: 500,
                  letterSpacing: -0.13,
                  color: "#fff",
                  lineHeight: "normal",
                  whiteSpace: "nowrap",
                }}
              >
                Самый популярный тариф
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Body */}
      <div
        style={{
          border: "1px solid #f3f3f3",
          borderTop: "none",
          borderBottomLeftRadius: 4,
          borderBottomRightRadius: 4,
          padding: "20px 16px 8px",
          display: "flex",
          flexDirection: "column",
          gap: 24,
          flex: 1,
        }}
      >
        {/* Price block */}
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
            <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
              <span
                style={{
                  fontSize: 28,
                  fontWeight: 500,
                  letterSpacing: -0.84,
                  color: "#212833",
                  lineHeight: "normal",
                  fontFeatureSettings: "'tnum' 1",
                  fontVariantNumeric: "tabular-nums",
                }}
              >
                {plan.price}
              </span>
              {plan.priceOld && (
                <span
                  style={{
                    fontSize: 20,
                    fontWeight: 500,
                    letterSpacing: -0.6,
                    color: "#8a8b8d",
                    textDecoration: "line-through",
                    lineHeight: "normal",
                  }}
                >
                  {plan.priceOld}
                </span>
              )}
            </div>
            <span
              style={{
                fontSize: plan.id === "free" ? 16 : 14,
                fontWeight: plan.id === "free" ? 500 : 400,
                letterSpacing: plan.id === "free" ? -0.32 : -0.28,
                color: "#212833",
                lineHeight: plan.id === "free" ? "normal" : 1.35,
              }}
            >
              {plan.priceSuffix}
            </span>
          </div>

          <button
            type="button"
            onClick={onClick}
            style={{
              height: 40,
              padding: "10px 12px",
              background: "#f7f7f8",
              border: "none",
              borderRadius: 4,
              fontFamily: "'Inter', sans-serif",
              fontSize: 14,
              fontWeight: 400,
              letterSpacing: -0.28,
              color: "#212833",
              cursor: "pointer",
              lineHeight: 1.35,
              transition: "background 0.12s ease",
            }}
          >
            {plan.cta}
          </button>
        </div>

        <div style={{ height: 1, background: "#f3f3f3", width: "100%" }} />

        {/* Features */}
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <p
            style={{
              margin: 0,
              fontSize: 13,
              fontWeight: 500,
              letterSpacing: -0.13,
              color: "#212833",
              lineHeight: "normal",
            }}
          >
            {plan.featuresTitle}
          </p>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {plan.features.map((f, i) => (
              <div key={i} style={{ display: "flex", gap: 8, alignItems: "center" }}>
                <img
                  src={
                    f.icon === "included"
                      ? STEP5_SOLO.bulletIncluded
                      : f.icon === "check"
                      ? STEP5_SOLO.bulletCheck
                      : STEP5_SOLO.bulletStar
                  }
                  alt=""
                  width={16}
                  height={16}
                  style={{ width: 16, height: 16, flexShrink: 0 }}
                />
                <span
                  style={{
                    fontSize: 13,
                    fontWeight: 400,
                    letterSpacing: -0.13,
                    color: "#212833",
                    lineHeight: f.underline ? "20px" : "normal",
                    textDecoration: f.underline ? "underline dotted #818aa3" : "none",
                    textUnderlineOffset: 3,
                  }}
                >
                  {f.label}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
