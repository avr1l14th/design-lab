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
    slug: "task-improvements",
    title: "Улучшение задач",
    description: "Вкладка «Задачи» на странице встречи: фильтры по исполнителям, drag&drop, инлайн-создание и редактирование, копирование, удаление с отменой, конфетти при отметке",
    tags: ["tasks", "tabs", "checkbox", "figma"],
    updatedAt: "2026-08-31",
  },
  {
    slug: "report-switcher",
    title: "Новое применение отчетов",
    description: "Отчеты живут в одной вкладке: дропдаун с примененными, кастомными и предустановленными отчетами, пересоздание и заглушка генерации",
    tags: ["reports", "dropdown", "tabs", "figma"],
    updatedAt: "2026-08-25",
  },
  {
    slug: "ai-export-sharing",
    title: "ИИ экспорт и улучшение шеринга",
    description: "Страница встречи с транскриптом: AI-кнопка, сплит «Поделиться» с копированием ссылки, «Экспорт» и плеер",
    tags: ["export", "sharing", "ai", "figma"],
    updatedAt: "2026-08-11",
  },
  {
    slug: "add-meeting-update",
    title: "Обновление добавления встречи и подсветка десктопа",
    description: "База — «Обновление бокового меню» 1-в-1: новый флоу добавления встречи и промо десктопного приложения",
    tags: ["sidebar", "add-meeting", "desktop", "figma"],
    updatedAt: "2026-07-29",
  },
  {
    slug: "usage-stats",
    title: "Статистика использования",
    description: "Дашборд воркспейса: метрики, график встреч с тултипом и легендой-тогглами, вкладка «Участники», экспорт HTML/CSV, эмпти-стейт и скелетон",
    tags: ["dashboard", "chart", "table", "figma"],
    updatedAt: "2026-07-24",
  },
  {
    slug: "sidebar-menu-update",
    title: "Обновление бокового меню",
    description: "Новая структура sidebar: workspace header, CTA, ресурсы, папки и прогресс тарифа",
    tags: ["sidebar", "navigation", "figma"],
    updatedAt: "2026-06-22",
  },
  {
    slug: "b2c-upgrade-cta",
    title: "B2C CTA — Улучшить план",
    description: "CTA-баннер в сайдбаре между футер-меню и user info: «Улучшить план» + три стэкнутые интеграции",
    tags: ["sidebar", "cta", "b2c"],
    updatedAt: "2026-06-08",
  },
  {
    slug: "current-meeting",
    title: "Виджет текущей встречи",
    description: "Активная запись в сайдбаре — пульсирующий REC-индикатор над списком встреч",
    tags: ["sidebar", "recording"],
    updatedAt: "2026-06-02",
  },
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
