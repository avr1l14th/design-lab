import Link from "next/link";
import { prototypes, type Prototype } from "@/prototypes-registry";

const BASE = process.env.NODE_ENV === "production" ? "/design-lab" : "";

const tokens = {
  black: "#212833",
  grey: "#818aa3",
  grey10: "#fafafa",
  grey40: "#efefef",
} as const;

function SearchFiltersThumb() {
  return (
    <div
      className="relative h-[48px] w-[80px] shrink-0 overflow-hidden rounded-[4px]"
      style={{ backgroundColor: tokens.grey10 }}
    >
      {/* Left chip — blue, rotated -15deg */}
      <div
        className="absolute flex items-center justify-center"
        style={{
          left: "17px",
          top: "8px",
          width: "24.495px",
          height: "24.495px",
        }}
      >
        <div style={{ transform: "rotate(-15deg)" }}>
          <div
            className="flex items-center rounded-[2px] p-[4px]"
            style={{ backgroundColor: "#d6dff6" }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={`${BASE}/lab/icon-a.svg`}
              alt=""
              className="block h-[12px] w-[12px] max-w-none shrink-0"
            />
          </div>
        </div>
      </div>
      {/* Right chip — green, rotated 12.54deg */}
      <div
        className="absolute flex items-center justify-center"
        style={{
          left: "36px",
          top: "15px",
          width: "23.866px",
          height: "23.866px",
        }}
      >
        <div style={{ transform: "rotate(12.54deg)" }}>
          <div
            className="flex items-center rounded-[2px] p-[4px]"
            style={{ backgroundColor: "#d8eee4" }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={`${BASE}/lab/icon-b.svg`}
              alt=""
              className="block h-[12px] w-[12px] max-w-none shrink-0"
            />
          </div>
        </div>
      </div>
    </div>
  );
}

function EmptyThumb() {
  return (
    <div
      className="h-[48px] w-[80px] shrink-0 rounded-[4px]"
      style={{ backgroundColor: tokens.grey10 }}
    />
  );
}

function Thumb({ slug }: { slug: string }) {
  if (slug === "search-filters") return <SearchFiltersThumb />;
  return <EmptyThumb />;
}

function formatDate(iso: string) {
  // iso: YYYY-MM-DD → "23 апреля 2026"
  const months = [
    "января",
    "февраля",
    "марта",
    "апреля",
    "мая",
    "июня",
    "июля",
    "августа",
    "сентября",
    "октября",
    "ноября",
    "декабря",
  ];
  const [y, m, d] = iso.split("-").map(Number);
  if (!y || !m || !d) return iso;
  return `${d} ${months[m - 1]} ${y}`;
}

function Row({ p }: { p: Prototype }) {
  return (
    <Link
      href={`/${p.slug}`}
      className="-mx-3 flex items-center gap-[12px] rounded-[6px] px-3 py-[16px] transition-colors hover:bg-zinc-50"
    >
      <Thumb slug={p.slug} />
      <div className="flex min-w-0 flex-1 flex-col gap-[2px]">
        <span
          className="truncate text-[14px] font-medium leading-[1.35]"
          style={{ color: tokens.black, letterSpacing: "-0.28px" }}
        >
          {p.title}
        </span>
        <span
          className="truncate text-[13px] font-normal"
          style={{ color: tokens.grey, letterSpacing: "-0.13px" }}
        >
          {formatDate(p.updatedAt)}
        </span>
      </div>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={`${BASE}/lab/chevron.svg`}
        alt=""
        className="block h-[20px] w-[20px] max-w-none shrink-0"
      />
    </Link>
  );
}

export default function Home() {
  return (
    <main className="flex min-h-screen w-full flex-col items-center bg-white px-[32px] pt-[50px] pb-[80px]">
      <div className="flex flex-col items-center gap-[24px]">
        <h1
          className="text-center text-[14px] font-medium leading-[1.35]"
          style={{ color: tokens.black, letterSpacing: "-0.28px" }}
        >
          mymeet.ai design lab
        </h1>

        <div className="flex w-[700px] flex-col items-start">
          {prototypes.map((p) => (
            <div key={p.slug} className="w-full">
              <Row p={p} />
            </div>
          ))}
          <div
            className="h-px w-full"
            style={{ backgroundColor: tokens.grey40 }}
          />
        </div>
      </div>
    </main>
  );
}
