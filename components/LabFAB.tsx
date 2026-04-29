"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useLayoutEffect, useRef, useState } from "react";

const BASE = process.env.NODE_ENV === "production" ? "/design-lab" : "";
const asset = (p: string) => `${BASE}/lab-fab/${p}`;

const tokens = {
  black: "#212833",
  grey: "#818aa3",
  grey20: "#f7f7f8",
  grey40: "#efefef",
  grey50: "#dddedf",
  blue: "#0138c7",
  red: "#c33",
};

type Status = "idle" | "sending" | "success" | "error";

function collectContext(text: string, author: string) {
  const path = window.location.pathname;
  const trimmed = path.startsWith(BASE) ? path.slice(BASE.length) : path;
  const slug = trimmed.split("/").filter(Boolean)[0] ?? "";
  return {
    text,
    author,
    path,
    prototypeSlug: slug,
    url: window.location.href,
    viewport: `${window.innerWidth}×${window.innerHeight}`,
    screen: `${screen.width}×${screen.height}@${window.devicePixelRatio}x`,
    colorScheme: window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light",
    userAgent: navigator.userAgent,
    timestamp: new Date().toISOString(),
  };
}

export default function LabFAB() {
  const pathname = usePathname() ?? "/";
  const trimmedPath = pathname.startsWith(BASE) ? pathname.slice(BASE.length) : pathname;
  const isHome = trimmedPath === "/" || trimmedPath === "";

  const [open, setOpen] = useState(false);
  const [feedbackOpen, setFeedbackOpen] = useState(false);
  const [text, setText] = useState("");
  const [author, setAuthor] = useState("");
  const [status, setStatus] = useState<Status>("idle");
  const [pos, setPos] = useState<{ right: number; bottom: number } | null>(null);
  const [openWidth, setOpenWidth] = useState(220);
  const rowRef = useRef<HTMLDivElement>(null);
  const formRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const dragRef = useRef<{
    startX: number;
    startY: number;
    origRight: number;
    origBottom: number;
    moved: boolean;
  } | null>(null);
  const lottieHostRef = useRef<HTMLDivElement>(null);
  const [formPhase, setFormPhase] = useState<
    "closed" | "opening" | "open" | "closing"
  >("closed");

  const wantFormOpen = open && feedbackOpen;
  const formPhaseRef = useRef(formPhase);
  formPhaseRef.current = formPhase;
  useEffect(() => {
    if (wantFormOpen) {
      if (formPhaseRef.current === "open") return;
      setFormPhase("opening");
      const t = setTimeout(() => setFormPhase("open"), 16);
      return () => clearTimeout(t);
    }
    if (formPhaseRef.current === "closed") return;
    setFormPhase("closing");
    const t = setTimeout(() => setFormPhase("closed"), 150);
    return () => clearTimeout(t);
  }, [wantFormOpen]);

  useEffect(() => {
    const host = lottieHostRef.current;
    if (!host) return;
    let cancelled = false;
    let anim: { destroy: () => void } | null = null;
    import("lottie-web").then((mod) => {
      if (cancelled || !host) return;
      anim = mod.default.loadAnimation({
        container: host,
        renderer: "svg",
        loop: true,
        autoplay: true,
        path: asset("icon-info.json"),
      });
    });
    return () => {
      cancelled = true;
      anim?.destroy();
    };
  }, []);

  useEffect(() => {
    try {
      const raw = localStorage.getItem("lab-fab-pos");
      if (!raw) return;
      const parsed = JSON.parse(raw);
      if (typeof parsed?.right === "number" && typeof parsed?.bottom === "number") {
        setPos(parsed);
      } else {
        localStorage.removeItem("lab-fab-pos");
      }
    } catch {}
  }, []);

  useEffect(() => {
    try {
      const saved = localStorage.getItem("lab-fab-author");
      if (saved) setAuthor(saved);
    } catch {}
  }, []);

  useEffect(() => {
    if (!open) return;
    function onMouseDown(e: MouseEvent) {
      if (rowRef.current?.contains(e.target as Node)) return;
      if (formRef.current?.contains(e.target as Node)) return;
      closeAll();
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") {
        if (feedbackOpen) setFeedbackOpen(false);
        else closeAll();
      }
    }
    document.addEventListener("mousedown", onMouseDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onMouseDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open, feedbackOpen]);

  useEffect(() => {
    if (feedbackOpen) {
      requestAnimationFrame(() => textareaRef.current?.focus());
    }
  }, [feedbackOpen]);

  useLayoutEffect(() => {
    function measure() {
      if (!rowRef.current) return;
      let total = 0;
      for (const child of Array.from(rowRef.current.children)) {
        total += (child as HTMLElement).offsetWidth;
      }
      if (total > 44) setOpenWidth(total);
    }
    measure();
    if (typeof document !== "undefined" && document.fonts?.ready) {
      document.fonts.ready.then(measure);
    }
  }, [isHome]);

  function closeAll() {
    setOpen(false);
    setFeedbackOpen(false);
    if (status !== "sending") setStatus("idle");
  }

  async function submit() {
    if (!text.trim() || !author.trim() || status === "sending") return;
    setStatus("sending");
    const trimmedAuthor = author.trim();
    try {
      localStorage.setItem("lab-fab-author", trimmedAuthor);
    } catch {}
    const payload = collectContext(text.trim(), trimmedAuthor);
    const url = process.env.NEXT_PUBLIC_FEEDBACK_URL;
    try {
      if (!url) {
        // eslint-disable-next-line no-console
        console.log("[LabFAB] feedback (NEXT_PUBLIC_FEEDBACK_URL not set):", payload);
      } else {
        await fetch(url, {
          method: "POST",
          mode: "no-cors",
          headers: { "Content-Type": "text/plain;charset=utf-8" },
          body: JSON.stringify(payload),
        });
      }
      setStatus("success");
      setTimeout(() => {
        setText("");
        setFeedbackOpen(false);
        setOpen(false);
        setStatus("idle");
      }, 1500);
    } catch {
      setStatus("error");
    }
  }

  const positioned = pos
    ? { right: pos.right, bottom: pos.bottom }
    : { right: 24, bottom: 24 };

  const rightOffset = positioned.right ?? 24;
  const bottomOffset = positioned.bottom ?? 24;

  return (
    <>
      {formPhase !== "closed" && (
        <div
          ref={formRef}
          className="fixed z-[100001] flex w-[300px] flex-col gap-[12px] rounded-[4px] bg-white p-[12px]"
          style={{
            fontFamily: "var(--font-inter)",
            right: rightOffset,
            bottom: bottomOffset + 44 + 8,
            boxShadow: "0 0 4px 0 rgba(0,0,0,0.15)",
            transformOrigin: "center",
            transform: formPhase === "open" ? "scale(1)" : "scale(0.96)",
            opacity: formPhase === "open" ? 1 : 0,
            pointerEvents: formPhase === "open" ? "auto" : "none",
            transition:
              formPhase === "closing"
                ? "transform 150ms cubic-bezier(0.22, 1, 0.36, 1), opacity 150ms cubic-bezier(0.22, 1, 0.36, 1)"
                : "transform 250ms cubic-bezier(0.22, 1, 0.36, 1), opacity 250ms cubic-bezier(0.22, 1, 0.36, 1)",
            willChange: "transform, opacity",
          }}
        >
          {status === "success" ? (
            <div
              className="flex h-[100px] items-center justify-center text-[13px]"
              style={{ color: tokens.black, letterSpacing: "-0.13px" }}
            >
              Спасибо!
            </div>
          ) : (
            <>
              <input
                type="text"
                value={author}
                onChange={(e) => {
                  setAuthor(e.target.value);
                  if (status === "error") setStatus("idle");
                }}
                onKeyDown={(e) => {
                  if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
                    e.preventDefault();
                    submit();
                  }
                }}
                placeholder="Твоё имя"
                className="w-full rounded-[3px] border border-solid bg-white px-[10px] py-[8px] text-[13px] outline-none transition-colors focus:border-[color:var(--_f)] placeholder:text-[color:var(--_p)]"
                style={{
                  borderColor: tokens.grey40,
                  color: tokens.black,
                  letterSpacing: "-0.13px",
                  ["--_f" as string]: tokens.grey50,
                  ["--_p" as string]: "#c7c8ca",
                }}
              />
              <div className="relative w-full">
                {!text && (
                  <span
                    className="pointer-events-none absolute left-[11px] top-[9px] text-[13px]"
                    style={{
                      color: "#c7c8ca",
                      letterSpacing: "-0.13px",
                      lineHeight: "19.5px",
                    }}
                  >
                    Что заметил, что улучшить, что сломано…
                  </span>
                )}
                <textarea
                  ref={textareaRef}
                  value={text}
                  onChange={(e) => {
                    setText(e.target.value);
                    if (status === "error") setStatus("idle");
                  }}
                  onKeyDown={(e) => {
                    if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
                      e.preventDefault();
                      submit();
                    }
                  }}
                  rows={4}
                  className="relative block w-full resize-none rounded-[3px] border border-solid bg-transparent px-[10px] py-[8px] text-[13px] outline-none transition-colors focus:border-[color:var(--_f)]"
                  style={{
                    borderColor: tokens.grey40,
                    color: tokens.black,
                    letterSpacing: "-0.13px",
                    ["--_f" as string]: tokens.grey50,
                  }}
                />
              </div>
              {status === "error" && (
                <span
                  className="text-[12px]"
                  style={{ color: tokens.red, letterSpacing: "-0.24px" }}
                >
                  Не удалось отправить. Попробуй ещё раз.
                </span>
              )}
              <button
                type="button"
                onClick={submit}
                disabled={!text.trim() || !author.trim() || status === "sending"}
                className="flex h-[32px] items-center justify-center rounded-[3px] text-[13px] font-medium text-white transition-opacity disabled:opacity-40"
                style={{ backgroundColor: tokens.blue, letterSpacing: "-0.13px" }}
              >
                {status === "sending" ? "Отправка…" : status === "error" ? "Повторить" : "Отправить"}
              </button>
            </>
          )}
        </div>
      )}

      <div
        ref={rowRef}
        className="fixed z-[100001] flex items-center justify-end overflow-hidden bg-white"
        style={{
          fontFamily: "var(--font-inter)",
          right: rightOffset,
          bottom: bottomOffset,
          width: open ? openWidth : 44,
          borderRadius: open ? 4 : 22,
          transition:
            "width 280ms cubic-bezier(0.22, 1, 0.36, 1), border-radius 280ms cubic-bezier(0.22, 1, 0.36, 1)",
          boxShadow: "0 0 4px 0 rgba(0,0,0,0.15)",
        }}
      >
        {!isHome && (
          <div
            className="flex flex-col items-center justify-center border-r border-solid p-[4px] shrink-0"
            style={{ borderColor: tokens.grey40 }}
          >
            <Link
              href="/"
              onClick={() => setOpen(false)}
              tabIndex={open ? 0 : -1}
              className="flex items-center gap-[6px] bg-white p-[10px] transition-colors hover:bg-[color:var(--_h)]"
              style={{
                ["--_h" as string]: tokens.grey20,
                borderRadius: open ? 3 : 9999,
              }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={asset("icon-home.svg")} alt="" className="h-[16px] w-[16px] shrink-0" />
              <span
                className="text-[13px] leading-[16px] whitespace-nowrap"
                style={{ color: tokens.black, letterSpacing: "-0.13px" }}
              >
                Вернуться на главную
              </span>
            </Link>
          </div>
        )}
        <div
          className="flex flex-col items-center justify-center border-r border-solid p-[4px] shrink-0"
          style={{ borderColor: tokens.grey40 }}
        >
          <button
            type="button"
            onClick={() => setFeedbackOpen((v) => !v)}
            tabIndex={open ? 0 : -1}
            className="flex items-center gap-[6px] bg-white p-[10px] transition-colors hover:bg-[color:var(--_h)]"
            style={{
              ["--_h" as string]: tokens.grey20,
              borderRadius: open ? 3 : 9999,
              ...(feedbackOpen ? { backgroundColor: tokens.grey20 } : {}),
            }}
            aria-expanded={feedbackOpen}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={asset("icon-chat.svg")} alt="" className="h-[16px] w-[16px] shrink-0" />
            <span
              className="text-[13px] leading-[16px] whitespace-nowrap"
              style={{ color: tokens.black, letterSpacing: "-0.13px" }}
            >
              Оставить фидбэк
            </span>
          </button>
        </div>
        <div className="flex flex-col items-start p-[4px] shrink-0">
          <button
            type="button"
            aria-label={open ? "Закрыть" : "Открыть меню"}
            onClick={() => {
              if (dragRef.current?.moved) {
                dragRef.current = null;
                return;
              }
              dragRef.current = null;
              if (open) closeAll();
              else setOpen(true);
            }}
            onPointerDown={
              open
                ? undefined
                : (e) => {
                    if (e.button !== 0) return;
                    const rect = rowRef.current?.getBoundingClientRect();
                    if (!rect) return;
                    dragRef.current = {
                      startX: e.clientX,
                      startY: e.clientY,
                      origRight: window.innerWidth - rect.right,
                      origBottom: window.innerHeight - rect.bottom,
                      moved: false,
                    };
                    e.currentTarget.setPointerCapture(e.pointerId);
                  }
            }
            onPointerMove={
              open
                ? undefined
                : (e) => {
                    const d = dragRef.current;
                    if (!d) return;
                    const dx = e.clientX - d.startX;
                    const dy = e.clientY - d.startY;
                    if (!d.moved && Math.hypot(dx, dy) < 4) return;
                    d.moved = true;
                    const w = rowRef.current?.offsetWidth ?? 44;
                    const h = rowRef.current?.offsetHeight ?? 44;
                    const right = Math.max(8, Math.min(window.innerWidth - w - 8, d.origRight - dx));
                    const bottom = Math.max(8, Math.min(window.innerHeight - h - 8, d.origBottom - dy));
                    setPos({ right, bottom });
                  }
            }
            onPointerUp={
              open
                ? undefined
                : (e) => {
                    const d = dragRef.current;
                    try {
                      e.currentTarget.releasePointerCapture(e.pointerId);
                    } catch {}
                    if (d?.moved) {
                      const w = rowRef.current?.offsetWidth ?? 44;
                      const h = rowRef.current?.offsetHeight ?? 44;
                      const right = Math.max(8, Math.min(window.innerWidth - w - 8, d.origRight - (e.clientX - d.startX)));
                      const bottom = Math.max(8, Math.min(window.innerHeight - h - 8, d.origBottom - (e.clientY - d.startY)));
                      try {
                        localStorage.setItem("lab-fab-pos", JSON.stringify({ right, bottom }));
                      } catch {}
                    }
                  }
            }
            className={`flex items-center bg-white p-[10px] transition-colors hover:bg-[color:var(--_h)] ${
              open ? "" : "cursor-grab active:cursor-grabbing select-none touch-none"
            }`}
            style={{
              ["--_h" as string]: tokens.grey20,
              borderRadius: open ? 3 : 9999,
            }}
          >
            <div className="relative h-[16px] w-[16px] shrink-0 pointer-events-none">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={asset("icon-close.svg")}
                alt=""
                className="absolute inset-0 h-[16px] w-[16px]"
                draggable={false}
                style={{
                  opacity: open ? 1 : 0,
                  filter: open ? "blur(0)" : "blur(2px)",
                  transform: open ? "scale(1)" : "scale(0.25)",
                  transformOrigin: "center",
                  transition:
                    "opacity 200ms ease-in-out, filter 200ms ease-in-out, transform 200ms ease-in-out",
                  willChange: "opacity, filter, transform",
                }}
              />
              <div
                ref={lottieHostRef}
                className="absolute left-1/2 top-1/2 h-[32px] w-[32px]"
                style={{
                  opacity: open ? 0 : 1,
                  filter: open ? "blur(2px)" : "blur(0)",
                  transform: `translate(-50%, -50%) scale(${open ? 0.25 : 1})`,
                  transformOrigin: "center",
                  transition:
                    "opacity 200ms ease-in-out, filter 200ms ease-in-out, transform 200ms ease-in-out",
                  willChange: "opacity, filter, transform",
                }}
              />
            </div>
          </button>
        </div>
      </div>
    </>
  );
}
