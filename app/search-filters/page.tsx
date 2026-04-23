import { Inter } from "next/font/google";

const inter = Inter({ subsets: ["latin", "cyrillic"], weight: ["400", "500"] });

const BASE = process.env.NODE_ENV === "production" ? "/design-lab" : "";
const asset = (p: string) => `${BASE}/search-filters/${p}`;

// Design tokens from Figma
const tokens = {
  blue: "#0138c7",
  black: "#212833",
  grey: "#818aa3",
  grey20: "#f7f7f8",
  grey40: "#efefef",
  grey50: "#dddedf",
  blueSea: "#e4ecfa",
  red: "#c33",
};

type Meeting = {
  title: string;
  time: string;
  duration: string;
  thumb: "audio1" | "audio2" | "audio3" | "error" | "legacy" | "new" | "default" | "empty";
  author: string;
  status: string;
};

type Group = { date: string; weekday: string; meetings: Meeting[] };

const groups: Group[] = [
  {
    date: "Вчера",
    weekday: "Среда",
    meetings: [
      { title: "Дизайн синк", time: "15:00", duration: "124 min", thumb: "audio1", author: "fedos@mymeet.ai", status: "Загружено" },
    ],
  },
  {
    date: "29 сентября",
    weekday: "Понедельник",
    meetings: [
      { title: "Синка с командой mymeet.ai и обсуждение Framer", time: "15:00", duration: "124 min", thumb: "audio2", author: "fedos@mymeet.ai", status: "Загружено" },
      { title: "Результаты спринта, синк", time: "15:00", duration: "124 min", thumb: "legacy", author: "fedos@mymeet.ai", status: "Загружено" },
      { title: "Девсинк", time: "15:00", duration: "124 min", thumb: "new", author: "fedos@mymeet.ai", status: "Загружено" },
    ],
  },
  {
    date: "2 июня",
    weekday: "Пятница",
    meetings: [
      { title: "Совещание по стратегии", time: "15:00", duration: "124 min", thumb: "new", author: "fedos@mymeet.ai", status: "Загружено" },
      { title: "Совещание по анализу рынка", time: "15:00", duration: "124 min", thumb: "default", author: "fedos@mymeet.ai", status: "Загружено" },
      { title: "Совещание по маркетингу", time: "15:00", duration: "124 min", thumb: "empty", author: "fedos@mymeet.ai", status: "Загружено" },
      { title: "Совещание по продажам", time: "15:00", duration: "124 min", thumb: "audio3", author: "fedos@mymeet.ai", status: "Загружено" },
      { title: "Совещание по развитию продукта", time: "15:00", duration: "124 min", thumb: "audio2", author: "fedos@mymeet.ai", status: "Загружено" },
      { title: "Совещание по пользовательскому опыту", time: "15:00", duration: "124 min", thumb: "error", author: "fedos@mymeet.ai", status: "Загружено" },
    ],
  },
];

function Thumb({ kind }: { kind: Meeting["thumb"] }) {
  // error: grey box with red "ERROR" text (Figma's "аудио 1" variant)
  if (kind === "error") {
    return (
      <div
        className="flex h-[48px] w-[80px] shrink-0 items-center justify-center overflow-clip rounded-[4px] border border-solid p-[8px]"
        style={{ backgroundColor: tokens.grey20, borderColor: tokens.grey40 }}
      >
        <span
          className="text-[12px] font-medium"
          style={{ color: tokens.red, letterSpacing: "-0.24px" }}
        >
          ERROR
        </span>
      </div>
    );
  }
  // legacy: grey box with download-tray icon (image442)
  if (kind === "legacy") {
    return (
      <div
        className="flex h-[48px] w-[80px] shrink-0 items-center justify-center overflow-clip rounded-[4px] border border-solid p-[8px]"
        style={{ backgroundColor: tokens.grey20, borderColor: tokens.grey40 }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={asset("image442.png")} alt="" className="h-[18px] w-[18px] object-cover" />
      </div>
    );
  }
  // empty: grey box with play icon (Figma "Variant11" = frame-audio2.svg)
  if (kind === "empty") {
    return (
      <div
        className="flex h-[48px] w-[80px] shrink-0 items-center justify-center overflow-clip rounded-[4px] border border-solid p-[8px]"
        style={{ backgroundColor: tokens.grey20, borderColor: tokens.grey40 }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={asset("frame-audio2.svg")} alt="" className="h-[20px] w-[20px]" />
      </div>
    );
  }
  if (kind === "new") {
    return (
      <div className="relative h-[48px] w-[80px] shrink-0 overflow-clip rounded-[4px]">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={asset("property2.png")} alt="" className="absolute inset-0 h-full w-full rounded-[4px] object-cover" />
        {/* Backdrop blur layer */}
        <div className="absolute inset-0 rounded-[4px] backdrop-blur-[3px] bg-[rgba(0,0,0,0.01)]" />
        {/* Semi-transparent white overlay */}
        <div className="absolute inset-0 rounded-[4px] bg-[rgba(255,255,255,0.24)]" />
        <div className="absolute inset-0 flex items-center justify-center">
          <span
            className="text-[12px] font-medium text-white"
            style={{ letterSpacing: "-0.24px", fontFamily: inter.style.fontFamily }}
          >
            NEW
          </span>
        </div>
      </div>
    );
  }
  if (kind === "default") {
    return (
      <div className="relative h-[48px] w-[80px] shrink-0 overflow-clip rounded-[4px]">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={asset("property2.png")} alt="" className="absolute inset-0 h-full w-full rounded-[4px] object-cover" />
      </div>
    );
  }
  // audio variants: image + dark overlay + play icon
  const imgMap: Record<string, string> = {
    audio1: "audio1.png",
    audio2: "audio2.png",
    audio3: "audio3.png",
  };
  return (
    <div className="relative h-[48px] w-[80px] shrink-0 overflow-clip rounded-[4px]">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={asset(imgMap[kind])} alt="" className="absolute inset-0 h-full w-full rounded-[4px] object-cover" />
      <div className="absolute inset-0 rounded-[4px] bg-[rgba(0,0,0,0.08)]" />
      <div className="absolute inset-0 flex items-center justify-center">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={asset("frame-audio.svg")} alt="" className="h-[20px] w-[20px]" />
      </div>
    </div>
  );
}

function MeetingRow({ m }: { m: Meeting }) {
  return (
    <div className="flex h-[72px] w-full items-center justify-between bg-white px-[24px] py-[12px]">
      <div className="flex items-center gap-[24px]">
        <div className="flex w-[446px] items-center gap-[12px]">
          <Thumb kind={m.thumb} />
          <div className="flex min-w-0 flex-1 flex-col gap-[4px]">
            <p
              className="truncate text-[13px] font-medium"
              style={{ color: tokens.black, letterSpacing: "-0.13px" }}
            >
              {m.title}
            </p>
            <div className="flex items-center gap-[4px]">
              <span
                className="text-[12px]"
                style={{ color: tokens.grey, letterSpacing: "-0.24px", fontFeatureSettings: "'lnum' 1, 'tnum' 1" }}
              >
                {m.time}
              </span>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={asset("dot.svg")} alt="" className="h-[3px] w-[3px]" />
              <span
                className="text-[12px]"
                style={{ color: tokens.grey, letterSpacing: "-0.24px", fontFeatureSettings: "'lnum' 1, 'tnum' 1" }}
              >
                {m.duration}
              </span>
            </div>
          </div>
        </div>
        <div className="flex w-[180px] flex-col items-start">
          <div className="flex w-[156px] items-center gap-[8px]">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={asset("ellipse.png")} alt="" className="h-[16px] w-[16px] shrink-0 rounded-full" />
            <p className="min-w-0 flex-1 truncate text-[12px]" style={{ color: tokens.black, letterSpacing: "-0.24px" }}>
              {m.author}
            </p>
          </div>
        </div>
        <div className="flex w-[180px] flex-col items-start overflow-clip">
          <div className="flex w-full items-center gap-[8px]">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={asset("arrow-down.svg")} alt="" className="h-[12px] w-[12px] shrink-0" />
            <span className="truncate text-[12px]" style={{ color: tokens.black, letterSpacing: "-0.24px" }}>
              {m.status}
            </span>
          </div>
        </div>
      </div>
      <div className="h-[16px] w-[16px] opacity-0" />
    </div>
  );
}

function DateHeader({ date, weekday }: { date: string; weekday: string }) {
  return (
    <div className="flex w-full shrink-0 flex-col items-start pt-[12px]">
      <div className="flex w-full flex-col items-start gap-[8px]">
        <div className="flex items-center gap-[6px] px-[24px] text-[13px]" style={{ letterSpacing: "-0.13px" }}>
          <span className="font-medium" style={{ color: tokens.black }}>
            {date}
          </span>
          <span className="font-normal" style={{ color: tokens.grey }}>
            {weekday}
          </span>
        </div>
        <div className="h-px w-full shrink-0" style={{ backgroundColor: tokens.grey40 }} />
      </div>
    </div>
  );
}

function SidebarMenuItem({
  icon,
  label,
  active,
}: {
  icon: string;
  label: string;
  active?: boolean;
}) {
  return (
    <div
      className="flex w-full items-center rounded-[4px] p-[4px]"
      style={{ backgroundColor: active ? tokens.grey20 : "#fff" }}
    >
      <div className="flex items-center gap-[8px]">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={asset(icon)} alt="" className="h-[16px] w-[16px] shrink-0" />
        <span className="text-[13px]" style={{ color: tokens.black, letterSpacing: "-0.13px" }}>
          {label}
        </span>
      </div>
    </div>
  );
}

export default function SearchFiltersPage() {
  return (
    <main className={`${inter.className} flex min-h-screen w-full bg-white`} style={{ color: tokens.black }}>
      <div
        className="relative flex min-h-screen flex-1 items-stretch overflow-clip bg-white"
      >
        {/* Sidebar */}
        <aside
          className="flex w-[280px] shrink-0 flex-col justify-between self-stretch border-r border-solid pt-[16px] pb-[4px]"
          style={{ borderColor: tokens.grey40 }}
        >
          <div className="flex w-[280px] flex-col gap-[12px]">
            <div className="flex w-full flex-col gap-[24px] px-[12px]">
              {/* Logo */}
              <div className="flex items-center">
                <div className="flex w-[128.941px] items-center justify-center gap-[9.412px]">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={asset("logo-icon.svg")} alt="" className="h-[30.118px] w-[30.118px]" />
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={asset("mymeet-text.svg")} alt="mymeet.ai" className="h-[18.353px] w-[87.53px]" />
                </div>
              </div>
              {/* Menu */}
              <div className="flex w-full flex-col gap-[16px]">
                {/* Add meeting CTA */}
                <div
                  className="flex h-[36px] w-full items-center justify-between rounded-[4px] px-[12px] py-[10px]"
                  style={{ backgroundColor: tokens.blue }}
                >
                  <span
                    className="text-[13px] font-medium text-white"
                    style={{ letterSpacing: "-0.13px" }}
                  >
                    Добавить встречу
                  </span>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={asset("icon-add.svg")} alt="" className="h-[16px] w-[16px]" />
                </div>
                <div className="flex w-[256px] flex-col items-start gap-[4px]">
                  <SidebarMenuItem icon="icon-meetings.svg" label="Встречи" active />
                  <SidebarMenuItem icon="icon-ai.svg" label="AI Отчеты" />
                  <SidebarMenuItem icon="icon-integrations.svg" label="Интеграции" />
                  <SidebarMenuItem icon="icon-settings.svg" label="Настройки" />
                </div>
              </div>
            </div>
            <div className="h-px w-full" style={{ backgroundColor: tokens.grey40 }} />
            {/* Footer items */}
            <div className="flex w-full flex-col items-start gap-[4px] px-[12px]">
              <SidebarMenuItem icon="icon-support.svg" label="Поддержка" />
              <SidebarMenuItem icon="icon-kb.svg" label="База знаний" />
              <SidebarMenuItem icon="icon-free.svg" label="Бесплатные минуты" />
              <SidebarMenuItem icon="icon-telegram.svg" label="Телеграм-бот" />
              <SidebarMenuItem icon="icon-power.svg" label="Выйти" />
            </div>
          </div>
          {/* User Info */}
          <div className="flex w-[280px] flex-col items-start rounded-[4px]">
            <div className="h-px w-full" style={{ backgroundColor: tokens.grey40 }} />
            <div className="flex w-full flex-col items-start rounded-t-[4px] pl-[8px] pr-[4px] py-[4px]">
              <div className="flex w-full items-center justify-between rounded-[4px] pl-[4px] pr-[8px] py-[4px]">
                <div className="flex items-center gap-[8px]">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={asset("user-avatar.png")} alt="" className="h-[32px] w-[32px] rounded-[3px] object-cover" />
                  <div className="flex flex-col items-start">
                    <p className="text-[13px] font-medium" style={{ color: tokens.black, letterSpacing: "-0.13px" }}>
                      Mymeet.ai
                    </p>
                    <p className="text-[12px]" style={{ color: tokens.grey, letterSpacing: "-0.24px" }}>
                      Владелец
                    </p>
                  </div>
                </div>
                <span className="text-[12px]" style={{ color: tokens.grey50 }}>
                  ⋯
                </span>
              </div>
            </div>
            <div className="h-px w-full" style={{ backgroundColor: tokens.grey40 }} />
            <div className="flex w-full flex-col items-start rounded-b-[4px] px-[8px] py-[4px]">
              <div className="flex w-full flex-col gap-[8px] p-[4px]">
                <div className="flex w-full items-end justify-between">
                  <span className="text-[13px] font-medium" style={{ color: tokens.black, letterSpacing: "-0.13px" }}>
                    Pro plan
                  </span>
                  <span className="text-[10px] font-medium" style={{ color: tokens.black, letterSpacing: "-0.1px" }}>
                    Доступно 1850 из 2500
                  </span>
                </div>
                <div className="relative h-[6px] w-full overflow-hidden rounded-[4px]" style={{ backgroundColor: tokens.blueSea }}>
                  <div className="h-full rounded-[4px]" style={{ width: "73.57%", backgroundColor: tokens.blue }} />
                </div>
              </div>
            </div>
          </div>
        </aside>

        {/* Main content */}
        <section className="flex min-w-0 flex-1 flex-col items-start justify-center">
          {/* Header */}
          <div
            className="flex h-[54px] w-full items-center border-b border-solid bg-white p-[16px]"
            style={{ borderColor: tokens.grey40 }}
          >
            <h1 className="text-[13px] font-medium" style={{ color: tokens.black, letterSpacing: "-0.13px" }}>
              Мои встречи
            </h1>
          </div>

          {/* Toolbar */}
          <div className="flex w-full items-center bg-white pl-[16px] pr-[24px] py-[16px]">
            <div className="flex w-[1112px] items-center gap-[12px]">
              <div className="flex items-center gap-[8px]">
                <button
                  className="flex h-[36px] w-[36px] shrink-0 items-center justify-center rounded-[4px] border border-solid"
                  style={{ borderColor: tokens.grey40 }}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={asset("icon-search.svg")} alt="" className="h-[16px] w-[16px] max-w-none shrink-0" />
                </button>
                <button
                  className="flex h-[36px] w-[36px] shrink-0 items-center justify-center rounded-[4px] border border-solid"
                  style={{ borderColor: tokens.grey40 }}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={asset("icon-filter.svg")} alt="" className="h-[16px] w-[16px] max-w-none shrink-0" />
                </button>
              </div>
              {/* vertical divider */}
              <div className="h-[24px] w-px" style={{ backgroundColor: tokens.grey40 }} />
              {/* tabs */}
              <div className="flex h-[36px] items-center">
                <div
                  className="flex h-full flex-col items-center justify-center rounded-[4px] px-[10px] py-[8px]"
                  style={{ backgroundColor: tokens.grey20 }}
                >
                  <span className="text-[13px]" style={{ color: tokens.black, letterSpacing: "-0.13px" }}>
                    Все встречи
                  </span>
                </div>
                <div className="flex h-full flex-col items-center justify-center rounded-[4px] px-[10px] py-[8px]">
                  <span className="text-[13px]" style={{ color: tokens.grey, letterSpacing: "-0.13px" }}>
                    Мои встречи
                  </span>
                </div>
                <div className="flex h-full flex-col items-center justify-center px-[10px] py-[8px]">
                  <span className="text-[13px]" style={{ color: tokens.grey, letterSpacing: "-0.13px" }}>
                    Доступные мне
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Meetings list */}
          <div className="flex w-[1160px] flex-col items-start">
            {groups.map((g) => (
              <div key={g.date + g.weekday + g.meetings[0].title} className="flex w-full flex-col">
                <DateHeader date={g.date} weekday={g.weekday} />
                {g.meetings.map((m) => (
                  <MeetingRow key={m.title} m={m} />
                ))}
              </div>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}
