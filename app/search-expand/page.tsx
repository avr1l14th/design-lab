"use client";

import { Inter } from "next/font/google";
import { useRef, useState } from "react";

const inter = Inter({ variable: "--font-inter", subsets: ["latin", "cyrillic"], weight: ["400", "500"] });

const BASE = process.env.NODE_ENV === "production" ? "/design-lab" : "";
const asset = (p: string) => `${BASE}/search-expand/${p}`;

const tokens = {
  black: "#212833",
  grey: "#818aa3",
  grey20: "#f7f7f8",
  grey40: "#efefef",
  grey50: "#dddedf",
  grey60: "#c7c8ca",
};

const EXPANDED_WIDTH = 480;
const COLLAPSED_WIDTH = 36;

export default function SearchExpandPage() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const openSearch = () => {
    setOpen(true);
    requestAnimationFrame(() => inputRef.current?.focus());
  };
  const closeSearch = () => {
    setOpen(false);
    setQuery("");
  };

  return (
    <main
      className={`${inter.className} flex min-h-screen w-full items-center justify-center bg-white`}
      style={{ color: tokens.black }}
    >
      <div
        className="flex h-[36px] shrink-0 items-center overflow-hidden rounded-[4px] border border-solid bg-white px-[10px] transition-[width,background-color] cursor-pointer"
        style={{
          width: open ? EXPANDED_WIDTH : COLLAPSED_WIDTH,
          borderColor: tokens.grey40,
          transitionDuration: "500ms",
          transitionTimingFunction: "cubic-bezier(0.22, 1, 0.36, 1)",
          backgroundColor: open ? "#ffffff" : "#ffffff",
        }}
        onClick={open ? undefined : openSearch}
        role={open ? undefined : "button"}
        tabIndex={open ? -1 : 0}
        onKeyDown={
          open
            ? undefined
            : (e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  openSearch();
                }
              }
        }
      >
        <div className="flex h-[16px] w-[16px] shrink-0 items-center justify-center">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={asset("icon-search.svg")} alt="" className="h-[16px] w-[16px]" draggable={false} />
        </div>
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Escape") closeSearch();
          }}
          placeholder="Поиск по названию или содержанию встречи"
          tabIndex={open ? 0 : -1}
          aria-hidden={!open}
          className={`min-w-0 bg-transparent text-[13px] outline-none placeholder:text-[color:var(--_p)] ${
            open ? "ml-[10px] flex-1" : "w-0 flex-none"
          }`}
          style={{
            color: tokens.black,
            letterSpacing: "-0.13px",
            opacity: open ? 1 : 0,
            pointerEvents: open ? "auto" : "none",
            transition: open
              ? "opacity 240ms cubic-bezier(0.22, 1, 0.36, 1) 220ms"
              : "opacity 120ms linear",
            ["--_p" as string]: tokens.grey60,
          }}
        />
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            closeSearch();
          }}
          tabIndex={open ? 0 : -1}
          aria-hidden={!open}
          className={`flex h-[16px] shrink-0 items-center justify-center ${open ? "ml-[10px] w-[16px]" : "w-0"}`}
          style={{
            opacity: open ? 1 : 0,
            pointerEvents: open ? "auto" : "none",
            transition: open
              ? "opacity 240ms cubic-bezier(0.22, 1, 0.36, 1) 220ms"
              : "opacity 120ms linear",
          }}
          aria-label="Закрыть поиск"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={asset("icon-close.svg")} alt="" className="h-[16px] w-[16px]" draggable={false} />
        </button>
      </div>
    </main>
  );
}
