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
    slug: "search-expand",
    title: "Search expand",
    description: "Кнопка поиска ↔ длинный инпут — изолированный переход",
    tags: ["motion"],
    updatedAt: "2026-04-28",
  },
];
