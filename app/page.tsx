import Link from "next/link";
import { prototypes } from "@/prototypes-registry";

const BASE = process.env.NODE_ENV === "production" ? "/design-lab" : "";

const tokens = {
  black: "#212833",
  grey: "#c7c8ca",
  grey50: "#dddedf",
} as const;

function formatMonthYear(iso: string) {
  const months = [
    "Январь",
    "Февраль",
    "Март",
    "Апрель",
    "Май",
    "Июнь",
    "Июль",
    "Август",
    "Сентябрь",
    "Октябрь",
    "Ноябрь",
    "Декабрь",
  ];
  const [y, m] = iso.split("-").map(Number);
  if (!y || !m) return iso;
  return `${months[m - 1]} ${y}`;
}

export default function Home() {
  return (
    <main className="flex min-h-screen w-full items-start justify-center bg-white p-[80px]">
      <div className="flex w-[600px] shrink-0 flex-col items-start gap-[39px]">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={`${BASE}/lab/logo.svg`}
          alt="mymeet.ai"
          className="block h-[32px] w-[32px] max-w-none shrink-0"
        />

        <p
          className="text-[16px] font-medium leading-normal"
          style={{ color: tokens.black, letterSpacing: "-0.32px" }}
        >
          {"Дизайн лаборатория "}
          <a
            href="https://mymeet.ai/ru/"
            target="_blank"
            rel="noopener noreferrer"
            className="underline decoration-solid decoration-[#efefef] decoration-[2px] underline-offset-[3px] transition-[text-decoration-color] duration-150 hover:decoration-[#dddedf]"
            style={{ textDecorationSkipInk: "auto" }}
          >
            mymeet.ai
          </a>
        </p>

        <div className="flex w-full flex-col items-start gap-[30px]">
          {prototypes.map((p) => (
            <Link
              key={p.slug}
              href={`/${p.slug}`}
              className="flex w-full flex-col items-start gap-[2px]"
            >
              <span
                className="text-[16px] font-medium leading-normal"
                style={{ color: tokens.black, letterSpacing: "-0.32px" }}
              >
                {p.title}
              </span>
              <span
                className="whitespace-nowrap text-[16px] font-medium leading-normal"
                style={{ color: tokens.grey, letterSpacing: "-0.32px" }}
              >
                {formatMonthYear(p.updatedAt)}
              </span>
            </Link>
          ))}
        </div>
      </div>
    </main>
  );
}
