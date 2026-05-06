"use client";

import { useEffect, useRef, useState } from "react";
import DropZone from "./DropZone";
import FileQueueItem from "./FileQueueItem";
import type { QueueItem } from "./types";

const tokens = {
  blue: "#0138c7",
  blueDisabled: "#809be3",
  black: "#212833",
  grey: "#818aa3",
  grey20: "#f7f7f8",
  grey40: "#efefef",
  white: "#ffffff",
};

const BASE = process.env.NODE_ENV === "production" ? "/design-lab" : "";
const asset = (p: string) => `${BASE}/multi-file-upload/${p}`;

function pluralFile(n: number): string {
  const mod10 = n % 10;
  const mod100 = n % 100;
  if (mod100 >= 11 && mod100 <= 14) return "файлов";
  if (mod10 === 1) return "файл";
  if (mod10 >= 2 && mod10 <= 4) return "файла";
  return "файлов";
}

function pluralMinute(n: number): string {
  const mod10 = n % 10;
  const mod100 = n % 100;
  if (mod100 >= 11 && mod100 <= 14) return "минут";
  if (mod10 === 1) return "минута";
  if (mod10 >= 2 && mod10 <= 4) return "минуты";
  return "минут";
}


function AiIconSquare() {
  return (
    <div
      className="relative shrink-0 overflow-clip rounded-[2px]"
      style={{ width: 16, height: 16, backgroundColor: tokens.grey }}
    >
      <div
        className="absolute"
        style={{ left: 4, top: 4, width: 8, height: 8, backgroundColor: tokens.white, borderRadius: 4 }}
      />
    </div>
  );
}

function Toggle({
  checked,
  onChange,
  reducedMotion,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  reducedMotion: boolean;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className="relative shrink-0"
      style={{ width: 24, height: 16 }}
    >
      {checked ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={asset("toggle-on.svg")}
          alt=""
          width={24}
          height={16}
          style={{
            display: "block",
            transition: reducedMotion ? "none" : "opacity 120ms ease",
          }}
        />
      ) : (
        <span
          className="absolute inset-0 rounded-full"
          style={{ backgroundColor: "#d6d8de" }}
        >
          <span
            className="absolute rounded-full bg-white"
            style={{ width: 12, height: 12, top: 2, left: 2 }}
          />
        </span>
      )}
    </button>
  );
}

function Divider() {
  return <div className="h-px w-full shrink-0" style={{ backgroundColor: tokens.grey40 }} />;
}

export default function UploadModal({
  open,
  items,
  onAddFiles,
  onRemoveItem,
  onRetryItem,
  onClose,
  onSubmit,
  reducedMotion,
}: {
  open: boolean;
  items: QueueItem[];
  onAddFiles: (files: File[]) => void;
  onRemoveItem: (id: string) => void;
  onRetryItem: (id: string) => void;
  onClose: () => void;
  onSubmit: () => void;
  reducedMotion: boolean;
}) {
  const [autoDetect, setAutoDetect] = useState(true);
  const [shown, setShown] = useState(false);
  const [isModalDragOver, setIsModalDragOver] = useState(false);
  const queueRef = useRef<HTMLDivElement>(null);
  const modalDragCounterRef = useRef(0);

  useEffect(() => {
    if (open) {
      const t = requestAnimationFrame(() => setShown(true));
      return () => cancelAnimationFrame(t);
    } else {
      setShown(false);
    }
  }, [open]);

  // Auto-scroll the queue to the bottom when count crosses into scrollable territory (>3 items)
  useEffect(() => {
    if (!open) return;
    if (items.length <= 3) return;
    // delay a tick so the new rows are laid out, then scroll
    const t = window.setTimeout(() => {
      const el = queueRef.current;
      if (!el) return;
      const target = el.scrollHeight - el.clientHeight;
      if (reducedMotion || target - el.scrollTop < 1) {
        el.scrollTop = target;
        return;
      }
      // smooth tween via setInterval (rAF gets throttled in bg tabs)
      const start = el.scrollTop;
      const distance = target - start;
      const startTs = performance.now();
      const dur = 220;
      const tick = window.setInterval(() => {
        const tt = Math.min(1, (performance.now() - startTs) / dur);
        const eased = 1 - Math.pow(1 - tt, 3);
        el.scrollTop = start + distance * eased;
        if (tt >= 1) clearInterval(tick);
      }, 16);
    }, 50);
    return () => clearTimeout(t);
  }, [items.length, open, reducedMotion]);

  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [open, onClose]);

  // Reset modal-level dragover when closing
  useEffect(() => {
    if (!open) {
      modalDragCounterRef.current = 0;
      setIsModalDragOver(false);
    }
  }, [open]);

  if (!open) return null;

  // Modal-level drop handlers — accept files dropped anywhere on modal surface
  const handleModalDragEnter = (e: React.DragEvent) => {
    if (!Array.from(e.dataTransfer.types).includes("Files")) return;
    e.preventDefault();
    e.stopPropagation();
    modalDragCounterRef.current += 1;
    setIsModalDragOver(true);
  };
  const handleModalDragOver = (e: React.DragEvent) => {
    if (!Array.from(e.dataTransfer.types).includes("Files")) return;
    e.preventDefault();
    e.stopPropagation();
    e.dataTransfer.dropEffect = "copy";
  };
  const handleModalDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    modalDragCounterRef.current -= 1;
    if (modalDragCounterRef.current <= 0) {
      modalDragCounterRef.current = 0;
      setIsModalDragOver(false);
    }
  };
  const handleModalDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    modalDragCounterRef.current = 0;
    setIsModalDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      onAddFiles(Array.from(e.dataTransfer.files));
      e.dataTransfer.clearData();
    }
  };

  // Кнопка активна только если есть файлы и все они done
  const submitEnabled = items.length > 0 && items.every((i) => i.status === "done");
  const doneItems = items.filter((i) => i.status === "done");
  const doneCount = doneItems.length;
  const doneMinutes = doneItems.reduce((sum, it) => sum + it.durationMin, 0);

  const overlayTransition = reducedMotion ? "none" : "opacity 180ms ease-out";
  const modalTransition = reducedMotion
    ? "none"
    : "opacity 180ms ease-out, transform 180ms ease-out";

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      role="dialog"
      aria-modal="true"
      aria-label="Загрузка аудио или видео файла"
      style={{ width: "100vw", height: "100vh" }}
    >
      <button
        type="button"
        aria-label="Закрыть"
        onClick={onClose}
        className="absolute inset-0"
        style={{
          backgroundColor: "rgba(33, 40, 51, 0.32)",
          opacity: shown ? 1 : 0,
          transition: overlayTransition,
        }}
      />

      <div
        className="relative flex flex-col rounded-[4px] bg-white"
        onDragEnter={handleModalDragEnter}
        onDragOver={handleModalDragOver}
        onDragLeave={handleModalDragLeave}
        onDrop={handleModalDrop}
        style={{
          width: 500,
          maxWidth: "calc(100% - 32px)",
          boxShadow: "0 16px 40px rgba(33,40,51,0.16)",
          opacity: shown ? 1 : 0,
          transform: shown ? "scale(1) translateY(0)" : "scale(0.97) translateY(4px)",
          transition: modalTransition,
        }}
      >
        {/* HEADER */}
        <div
          className="flex items-center justify-between border-b border-solid"
          style={{ padding: 16, borderColor: tokens.grey40 }}
        >
          <div className="flex items-center" style={{ gap: 8 }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={asset("header-archive.svg")} alt="" className="h-[16px] w-[16px]" />
            <span
              style={{
                fontSize: 14,
                fontWeight: 500,
                lineHeight: 1.35,
                color: tokens.black,
                letterSpacing: "-0.28px",
                whiteSpace: "nowrap",
              }}
            >
              Загрузка аудио или видео файла
            </span>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Закрыть модалку"
            className="flex shrink-0 items-center justify-center"
            style={{ width: 16, height: 16 }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={asset("header-close.svg")} alt="" className="h-[16px] w-[16px]" />
          </button>
        </div>

        {/* BODY */}
        <div className="flex flex-col" style={{ padding: 16, gap: 20, backgroundColor: tokens.white }}>
          <DropZone
            onFiles={onAddFiles}
            reducedMotion={reducedMotion}
            modalDragOver={isModalDragOver}
          />

          {items.length > 0 && (
            <div
              ref={queueRef}
              className="mfu-queue-scroll flex flex-col"
              style={{
                gap: 16,
                // 3 rows × 48 + 2 gaps × 16 = 176; cap height; scrollbar may or may not appear
                maxHeight: 176,
                overflowY: "auto",
                // Reserve 8px gutter at all times so the X column doesn't jump when
                // the scrollbar toggles after an add/remove crosses the 3-item threshold.
                scrollbarGutter: "stable",
                overscrollBehavior: "contain",
              }}
            >
              {items.map((it) => (
                <FileQueueItem
                  key={it.id}
                  item={it}
                  onRemove={onRemoveItem}
                  onRetry={onRetryItem}
                />
              ))}
            </div>
          )}

          <Divider />

          {/* Choose template */}
          <div className="flex flex-col" style={{ gap: 8 }}>
            <span
              style={{
                fontSize: 13,
                fontWeight: 400,
                lineHeight: 1,
                color: tokens.black,
                letterSpacing: "-0.13px",
              }}
            >
              Выбрать AI отчёт
            </span>
            <button
              type="button"
              className="flex items-center justify-between rounded-[4px] border border-solid bg-white"
              style={{
                height: 36,
                padding: "8px 12px",
                borderColor: tokens.grey40,
              }}
            >
              <div className="flex items-center" style={{ gap: 8 }}>
                <AiIconSquare />
                <span
                  style={{
                    fontSize: 13,
                    color: tokens.black,
                    letterSpacing: "-0.13px",
                    lineHeight: 1,
                  }}
                >
                  Обычная встреча
                </span>
              </div>
              <span className="flex h-[16px] w-[16px] items-center justify-center">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={asset("chevron-down.svg")} alt="" className="h-[6px] w-[10px]" />
              </span>
            </button>
          </div>

          <Divider />

          {/* Toggle row */}
          <div className="flex items-center justify-between" style={{ height: 28 }}>
            <span
              style={{
                fontSize: 13,
                color: tokens.black,
                letterSpacing: "-0.13px",
                lineHeight: 1,
              }}
            >
              Авто-распознавание количества участников
            </span>
            <Toggle checked={autoDetect} onChange={setAutoDetect} reducedMotion={reducedMotion} />
          </div>
        </div>

        {/* FOOTER */}
        <div
          className="flex items-center justify-between border-t border-solid"
          style={{
            padding: 16,
            backgroundColor: tokens.grey20,
            borderColor: tokens.grey40,
            borderRadius: "0 0 4px 4px",
          }}
        >
          {doneCount > 0 ? (
            <span
              className="text-[13px]"
              style={{ color: tokens.grey, letterSpacing: "-0.13px", lineHeight: 1 }}
            >
              {doneCount} {pluralFile(doneCount)} ({doneMinutes} {pluralMinute(doneMinutes)})
            </span>
          ) : (
            <span />
          )}
          <button
            type="button"
            disabled={!submitEnabled}
            onClick={onSubmit}
            className="flex items-center justify-center rounded-[4px]"
            style={{
              height: 36,
              padding: "10px 12px",
              backgroundColor: submitEnabled ? tokens.blue : tokens.blueDisabled,
              color: tokens.white,
              fontSize: 13,
              fontWeight: 500,
              letterSpacing: "-0.13px",
              lineHeight: 1,
              cursor: submitEnabled ? "pointer" : "not-allowed",
              transition: reducedMotion ? "none" : "background-color 160ms ease",
            }}
          >
            Начать обработку
          </button>
        </div>
      </div>
    </div>
  );
}
