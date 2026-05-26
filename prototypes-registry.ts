export type Prototype = {
  slug: string;
  title: string;
  description?: string;
  tags?: string[];
  previewImage?: string;
  updatedAt: string;
};

export const prototypes: Prototype[] = [
  {
    slug: "app-leads-v2",
    title: "App Leads V2",
    description: "4 B2B-lead элемента (топ-баннер, сайдбар, in-list, меню) с тоглами и модалкой Business",
    tags: ["leads", "modal", "hover"],
    updatedAt: "2026-05-26",
  },
  {
    slug: "search-filters",
    title: "Поиск и фильтры",
    description: "Мои встречи — список с группировкой по датам",
    updatedAt: "2026-04-24",
  },
  {
    slug: "onboarding-mymeet",
    title: "Онбординг mymeet.ai",
    description: "5-шаговый флоу: источник → роль → цели → формат → тариф/команда",
    tags: ["motion", "forms"],
    updatedAt: "2026-04-27",
  },
  {
    slug: "multi-file-upload",
    title: "Загрузка нескольких файлов",
    description: "Модалка multi-upload: DnD, очередь, прогресс, ошибки, сабмит",
    tags: ["modal", "upload"],
    updatedAt: "2026-05-05",
  },
];
