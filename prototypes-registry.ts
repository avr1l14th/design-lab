export type Prototype = {
  slug: string;
  title: string;
  description: string;
  tags?: string[];
  updatedAt: string;
};

export const prototypes: Prototype[] = [
  // Пример формата — добавляй свои прототипы сюда.
  // Когда создаёшь папку app/my-feature/page.tsx — добавь запись с slug: "my-feature"
  //
  // {
  //   slug: "nav-transition",
  //   title: "Smooth nav transition",
  //   description: "Экспериментируем с плавным переходом между табами в боковом меню",
  //   tags: ["motion", "navigation"],
  //   updatedAt: "2026-04-23",
  // },
];
