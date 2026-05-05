"use client";

import { useEffect, useState } from "react";

const tokens = {
  black: "#212833",
  grey: "#818aa3",
  grey40: "#efefef",
  grey20: "#f7f7f8",
  blue: "#0138c7",
};

export default function DevPanel({
  errorOnNext,
  setErrorOnNext,
  onResetDemo,
  onFinishProcessing,
}: {
  errorOnNext: boolean;
  setErrorOnNext: (v: boolean) => void;
  onResetDemo: () => void;
  onFinishProcessing: () => void;
}) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      // Shift+/ → "?"
      if (e.key === "?" || (e.shiftKey && e.key === "/")) {
        e.preventDefault();
        setOpen((v) => !v);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  return (
    <>
      {/* discreet toggle dot bottom-right */}
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label="Dev панель (?)"
        className="fixed bottom-[16px] right-[16px] z-[100] h-[10px] w-[10px] rounded-full opacity-40 hover:opacity-100"
        style={{ backgroundColor: tokens.blue }}
      />
      {open && (
        <div
          className="fixed bottom-[36px] right-[16px] z-[100] flex w-[260px] flex-col gap-[10px] rounded-[6px] border border-solid bg-white p-[12px] shadow-[0_8px_24px_rgba(0,0,0,0.08)]"
          style={{ borderColor: tokens.grey40 }}
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-medium uppercase tracking-wider" style={{ color: tokens.grey }}>
              Dev panel
            </span>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="text-[12px]"
              style={{ color: tokens.grey }}
            >
              ✕
            </button>
          </div>
          <label className="flex items-center gap-[8px] text-[12px]" style={{ color: tokens.black }}>
            <input
              type="checkbox"
              checked={errorOnNext}
              onChange={(e) => setErrorOnNext(e.target.checked)}
            />
            Следующий файл — ошибка
          </label>
          <button
            type="button"
            onClick={onFinishProcessing}
            className="rounded-[4px] border border-solid px-[8px] py-[6px] text-[12px] hover:bg-[#f7f7f8]"
            style={{ borderColor: tokens.grey40, color: tokens.black }}
          >
            Завершить обработку всех
          </button>
          <button
            type="button"
            onClick={onResetDemo}
            className="rounded-[4px] border border-solid px-[8px] py-[6px] text-[12px] hover:bg-[#f7f7f8]"
            style={{ borderColor: tokens.grey40, color: tokens.black }}
          >
            Сбросить демо
          </button>
          <p className="text-[11px]" style={{ color: tokens.grey }}>
            Тогл по «?»
          </p>
        </div>
      )}
    </>
  );
}
