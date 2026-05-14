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
  {
    slug: "meeting-stats",
    title: "Статистика встреч",
    description: "Дашборд статистики: метрики, график активности, источники, последние встречи",
    tags: ["dashboard", "ds-test"],
    updatedAt: "2026-05-11",
  },
];
