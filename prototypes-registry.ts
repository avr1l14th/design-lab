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
];
