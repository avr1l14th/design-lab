"use client";

import type { QueueItem } from "./types";

const tokens = {
  black: "#212833",
  grey: "#818aa3",
  grey20: "#f7f7f8",
  grey40: "#efefef",
  grey60: "#c7c8ca",
  red: "#c33",
  green: "#0d9655",
};

const BASE = process.env.NODE_ENV === "production" ? "/design-lab" : "";
const asset = (p: string) => `${BASE}/multi-file-upload/${p}`;

function MetaLineContent({ item }: { item: QueueItem }) {
  if (item.status === "error") {
    return (
      <span className="flex items-center">
        <span
          className="text-[12px] leading-none"
          style={{ color: tokens.red, letterSpacing: "-0.24px" }}
        >
          {item.errorText ?? "Текст ошибки"}
        </span>
      </span>
    );
  }
  if (item.status === "done") {
    return (
      <span className="flex items-center gap-[4px]">
        <span
          className="text-[12px] leading-none"
          style={{ color: tokens.grey, letterSpacing: "-0.24px" }}
        >
          {item.durationMin} мин
        </span>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={asset("dot.svg")} alt="" className="h-[3px] w-[3px] shrink-0" />
        <span className="flex items-center gap-[4px]">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={asset("check-green.svg")} alt="" className="h-[12px] w-[12px]" />
          <span
            className="text-[12px] leading-none"
            style={{ color: tokens.green, letterSpacing: "-0.24px" }}
          >
            Загружено
          </span>
        </span>
      </span>
    );
  }
  // uploading
  return (
    <span className="flex items-center gap-[4px]">
      <span
        className="text-[12px] leading-none"
        style={{ color: tokens.grey60, letterSpacing: "-0.24px" }}
      >
        {item.durationMin} мин
      </span>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={asset("dot.svg")} alt="" className="h-[3px] w-[3px] shrink-0" />
      <span
        className="text-[12px] leading-none"
        style={{ color: tokens.grey60, letterSpacing: "-0.24px" }}
      >
        Загрузка...
      </span>
    </span>
  );
}

export default function FileQueueItem({
  item,
  onRemove,
  onRetry,
}: {
  item: QueueItem;
  onRemove: (id: string) => void;
  onRetry?: (id: string) => void;
}) {
  const isUploading = item.status === "uploading";
  const isError = item.status === "error";

  const thumb = isUploading ? (
    <div
      className="relative h-[48px] w-[80px] shrink-0 overflow-clip rounded-[4px] border border-solid"
      style={{ backgroundColor: tokens.grey20, borderColor: tokens.grey40 }}
    >
      <div
        className="absolute"
        style={{
          backgroundColor: tokens.grey40,
          height: "48px",
          left: "-1px",
          top: "-1px",
          width: `${(item.progressPct / 100) * 80}px`,
        }}
      />
      <div className="absolute inset-0 grid place-items-center">
        <span
          className="text-[12px] font-medium"
          style={{
            color: tokens.grey,
            letterSpacing: "-0.24px",
            lineHeight: 1,
            // optical compensation: Inter glyph baseline biases visually upward
            transform: "translateY(0.5px)",
          }}
        >
          {Math.round(item.progressPct)}%
        </span>
      </div>
    </div>
  ) : item.kind === "audio" ? (
    <div className="h-[48px] w-[80px] shrink-0 overflow-clip rounded-[4px]">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={asset("audio-thumbnail.svg")}
        alt=""
        className="h-full w-full"
        style={{ display: "block" }}
      />
    </div>
  ) : (
    <div
      className="flex h-[48px] w-[80px] shrink-0 items-center justify-center overflow-clip rounded-[4px] border border-solid p-[8px]"
      style={{ backgroundColor: tokens.grey20, borderColor: tokens.grey40 }}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={asset("video-icon.svg")}
        alt=""
        className="h-[20px] w-[20px]"
      />
    </div>
  );

  return (
    <div className="flex w-full items-center gap-[12px]">
      {thumb}

      <div className="flex min-w-0 flex-1 flex-col gap-[6px]">
        <p
          className="truncate text-[13px] font-medium leading-none"
          style={{
            color: isUploading ? tokens.grey60 : tokens.black,
            letterSpacing: "-0.13px",
          }}
        >
          {item.name}
        </p>
        <MetaLineContent item={item} />
      </div>

      {isError && onRetry && (
        <button
          type="button"
          onClick={() => onRetry(item.id)}
          aria-label="Повторить загрузку"
          className="flex h-[16px] w-[16px] shrink-0 items-center justify-center"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={asset("retry.svg")} alt="" className="h-[16px] w-[16px]" />
        </button>
      )}

      <button
        type="button"
        onClick={() => onRemove(item.id)}
        aria-label="Удалить файл"
        className="flex h-[16px] w-[16px] shrink-0 items-center justify-center"
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={asset("close-row.svg")} alt="" className="h-[16px] w-[16px]" />
      </button>
    </div>
  );
}
