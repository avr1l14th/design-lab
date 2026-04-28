"use client";

import React, { useState, useEffect } from "react";
import OnboardingShell from "./OnboardingShell";
import ProgressDots from "./ProgressDots";
import Step1Source, { Step1Id } from "./Step1Source";
import Step2Role, { Step2Id } from "./Step2Role";
import Step3Purpose, { Step3Id } from "./Step3Purpose";
import Step4Usage, { Step4Value } from "./Step4Usage";
import Step5Team from "./Step5Team";
import Step5Solo from "./Step5Solo";
import { LOGO_ICON, LOGO_TEXT } from "./assets";
import { ThemeContext, type Theme } from "./ThemeContext";

interface OnboardingState {
  sources: Step1Id[];
  roles: Step2Id[];
  purposes: Step3Id[];
  usage: Step4Value;
  plan: string | null;
}

const TOTAL_STEPS = 5;

export default function OnboardingFlow() {
  /* SSR-safe: start at 0, then sync from URL on mount.
   * Static export pre-renders this on the server where `window` is undefined. */
  const [step, setStep] = useState(0);

  useEffect(() => {
    const s = parseInt(new URLSearchParams(window.location.search).get("step") ?? "0", 10);
    if (Number.isFinite(s) && s >= 0 && s < TOTAL_STEPS) setStep(s);
  }, []);

  useEffect(() => {
    history.replaceState(null, "", `?step=${step}`);
  }, [step]);

  useEffect(() => {
    const onPop = () => {
      const s = parseInt(new URLSearchParams(window.location.search).get("step") ?? "0", 10);
      setStep(Number.isFinite(s) && s >= 0 && s < TOTAL_STEPS ? s : 0);
    };
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, []);
  const [state, setState] = useState<OnboardingState>({
    sources: [],
    roles: [],
    purposes: [],
    usage: null,
    plan: null,
  });
  const [finished, setFinished] = useState(false);
  const [theme, setTheme] = useState<Theme>("light");

  const goNext = () => setStep((s) => Math.min(s + 1, TOTAL_STEPS - 1));
  const goBack = () => setStep((s) => Math.max(s - 1, 0));

  const toggleSource = (id: Step1Id) =>
    setState((s) => ({ ...s, sources: s.sources.includes(id) ? s.sources.filter((v) => v !== id) : [...s.sources, id] }));
  const toggleRole = (id: Step2Id) =>
    setState((s) => ({ ...s, roles: s.roles.includes(id) ? s.roles.filter((v) => v !== id) : [...s.roles, id] }));
  const togglePurpose = (id: Step3Id) =>
    setState((s) => ({ ...s, purposes: s.purposes.includes(id) ? s.purposes.filter((v) => v !== id) : [...s.purposes, id] }));

  if (finished) return <Completed state={state} onReset={() => { setFinished(false); setStep(0); }} />;

  switch (step) {
    case 0:
      return (
        <ThemeContext.Provider value={theme}>
          <OnboardingShell
            title="Откуда вы о нас узнали?"
            subtitle="Мы персонализируем продукт под ваши задачи и опыт"
            step={step}
            totalSteps={TOTAL_STEPS}
            canProceed={state.sources.length > 0}
            onContinue={goNext}
            frameWidth={1236}
            onThemeChange={setTheme}
          >
            <Step1Source value={state.sources} onToggle={toggleSource} />
          </OnboardingShell>
        </ThemeContext.Provider>
      );
    case 1:
      return (
        <ThemeContext.Provider value={theme}>
          <OnboardingShell
            title="Кто вы?"
            subtitle="Мы персонализируем продукт под ваши задачи и опыт"
            step={step}
            totalSteps={TOTAL_STEPS}
            canProceed={state.roles.length > 0}
            onContinue={goNext}
            onThemeChange={setTheme}
          >
            <Step2Role value={state.roles} onToggle={toggleRole} />
          </OnboardingShell>
        </ThemeContext.Provider>
      );
    case 2:
      return (
        <ThemeContext.Provider value={theme}>
          <OnboardingShell
            title="Для чего вам сервис?"
            subtitle="Мы персонализируем продукт под ваши задачи и опыт"
            step={step}
            totalSteps={TOTAL_STEPS}
            canProceed={state.purposes.length > 0}
            onContinue={goNext}
            onThemeChange={setTheme}
          >
            <Step3Purpose value={state.purposes} onToggle={togglePurpose} />
          </OnboardingShell>
        </ThemeContext.Provider>
      );
    case 3:
      return (
        <OnboardingShell
          title="Как вы будете использовать сервис?"
          subtitle="Поможем выбрать подходящий формат использования"
          step={step}
          totalSteps={TOTAL_STEPS}
          canProceed={state.usage !== null}
          onContinue={goNext}
          contentWidth={720}
          hideCta
        >
          <Step4Usage value={state.usage} onChange={(v) => setState((s) => ({ ...s, usage: v }))} />
          {/* For Step 4 the Figma shows no Continue button — selecting a card
           * triggers the next step directly. Keeping `hideCta` and handling
           * transition on pick: */}
          <AutoAdvanceOnUsagePick usage={state.usage} onAdvance={goNext} />
        </OnboardingShell>
      );
    case 4:
      /* Branch: team → contact form; self → pricing grid. */
      if (state.usage === "team") {
        return (
          <Step5Team
            step={step}
            totalSteps={TOTAL_STEPS}
            onBack={goBack}
            onFinish={() => setFinished(true)}
          />
        );
      }
      /* Solo pricing needs the wide frame layout without the default CTA/footer from Shell. */
      return (
        <SoloShell step={step} totalSteps={TOTAL_STEPS}>
          <Step5Solo
            onFinish={(plan) => {
              setState((s) => ({ ...s, plan }));
              setFinished(true);
            }}
          />
        </SoloShell>
      );
    default:
      return null;
  }
}

/* A tiny effect helper so we can advance automatically once a card is picked
 * on step 4 (Figma has no Continue button on this screen). */
function AutoAdvanceOnUsagePick({ usage, onAdvance }: { usage: Step4Value; onAdvance: () => void }) {
  const picked = React.useRef(false);
  React.useEffect(() => {
    if (usage && !picked.current) {
      picked.current = true;
      const t = setTimeout(onAdvance, 180);
      return () => clearTimeout(t);
    }
  }, [usage, onAdvance]);
  return null;
}

/* Custom full-width shell for the Solo pricing step 5b (1236px frame).
 * Uses the same logo top and progress bottom as OnboardingShell but lets the
 * body grow to the full plan-card width. */
function SoloShell({
  step,
  totalSteps,
  children,
}: {
  step: number;
  totalSteps: number;
  children: React.ReactNode;
}) {
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
          width: 1236,
          maxWidth: "100%",
          minHeight: "100vh",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: "32px 6px", flexShrink: 0 }}>
          <div style={{ display: "flex", gap: 10, alignItems: "center", padding: 1 }}>
            <img src={LOGO_ICON} alt="" style={{ width: 32, height: 32 }} />
            <img src={LOGO_TEXT} alt="MyMeet.ai" style={{ width: 93, height: 19.5 }} />
          </div>
        </div>

        <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", padding: "24px 0" }}>
          {children}
        </div>

        <div style={{ flexShrink: 0, width: "100%" }}>
          <ProgressDots total={totalSteps} current={step} />
        </div>
      </div>
    </div>
  );
}

function Completed({ state, onReset }: { state: OnboardingState; onReset: () => void }) {
  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#fff",
        fontFamily: "'Inter', sans-serif",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 24,
      }}
    >
      <div style={{ maxWidth: 520, display: "flex", flexDirection: "column", gap: 20, textAlign: "center" }}>
        <h1 style={{ margin: 0, fontSize: 32, fontWeight: 500, letterSpacing: -0.96, color: "#212833" }}>
          Онбординг завершён
        </h1>
        <p style={{ margin: 0, fontSize: 14, color: "#818aa3", letterSpacing: -0.14, lineHeight: 1.5 }}>
          Заглушка финального экрана с дампом state.
        </p>
        <pre
          style={{
            padding: 16,
            background: "#f7f7f8",
            border: "1px solid #efefef",
            borderRadius: 4,
            fontFamily: "'Menlo', monospace",
            fontSize: 12,
            color: "#212833",
            textAlign: "left",
            whiteSpace: "pre-wrap",
            margin: 0,
          }}
        >
{JSON.stringify(state, null, 2)}
        </pre>
        <button
          type="button"
          onClick={onReset}
          style={{
            height: 40,
            background: "#0138c7",
            color: "#fff",
            border: "none",
            borderRadius: 4,
            fontFamily: "'Inter', sans-serif",
            fontSize: 14,
            fontWeight: 400,
            letterSpacing: -0.28,
            cursor: "pointer",
          }}
        >
          Пройти ещё раз
        </button>
      </div>
    </div>
  );
}
