/* Asset URLs pulled from Figma MCP (file Ma7dtZb6eSHJ5YoaiVEUn2).
 * Figma CDN keeps these valid for ~7 days. If they 404, re-fetch via Figma MCP. */

export const LOGO_ICON = "https://www.figma.com/api/mcp/asset/defba6a8-9f06-4c3b-be87-efee2e5f30c9";
export const LOGO_TEXT = "https://www.figma.com/api/mcp/asset/eb9f4f69-646b-4570-828d-3a823bafd40f";

export const CHECKMARK_DOT = "https://www.figma.com/api/mcp/asset/8077899a-8a90-4bc5-9d22-afd81e5c479e";

export const STEP1_ICONS = {
  rec: "https://www.figma.com/api/mcp/asset/80bbd232-4c87-415f-aca5-3da4179c9bca",       // По рекомендации
  search: "https://www.figma.com/api/mcp/asset/91ed409b-2796-47bc-a221-a484b67d2360",    // Нашёл в поиске
  ai: "https://www.figma.com/api/mcp/asset/4062a482-b871-46a2-86d4-0b719b02e118",        // Ответ нейросети
  social: "https://www.figma.com/api/mcp/asset/154e8477-dd4f-4759-9891-558ad21e09cc",    // Соцсети и другие сайты
  dunno: "https://www.figma.com/api/mcp/asset/5c8f937b-6683-4725-b97f-f5393649c0d4",     // Не помню
  other: "https://www.figma.com/api/mcp/asset/32ec0b70-c35b-4716-9187-b5df13163f7c",     // Другое
};

export const STEP2_ICONS = {
  product: "https://www.figma.com/api/mcp/asset/70e4a5cd-1951-4450-817a-73bb81b9bba9",   // Продукт
  sales: "https://www.figma.com/api/mcp/asset/8b341edb-14dd-44fb-aab8-73143be5bdbc",     // Продажи
  research: "https://www.figma.com/api/mcp/asset/fa2887d0-fb8a-4422-9082-b5f6ac0ee237",  // Исследования
  hr: "https://www.figma.com/api/mcp/asset/d6d720cf-0319-4c14-ac68-2f98fdc29761",        // HR/Рекрутмент
  marketing: "https://www.figma.com/api/mcp/asset/d3ee1849-d73d-4fd7-93a6-5434832ffa16", // Маркетинг
  other: "https://www.figma.com/api/mcp/asset/632f2cde-24ad-4c9b-aadc-2d350947322e",     // Другое
};

export const STEP3_ICONS = {
  transcript: "https://www.figma.com/api/mcp/asset/1db1afaf-a965-4bc7-9bc4-380423d45187",  // Транскрипт
  analytics: "https://www.figma.com/api/mcp/asset/e1437b5f-4f50-4382-8fb3-da75a3a74c9e",   // Аналитика встреч
  tasks: "https://www.figma.com/api/mcp/asset/b1464bf8-3aac-4096-a5fe-d84d6016a239",       // Задачи и договоренности
  knowledge: "https://www.figma.com/api/mcp/asset/1c8be96a-0691-49ce-a220-a9fad4d0fb13",   // База знаний проектов
  recording: "https://www.figma.com/api/mcp/asset/f730bd4d-9ce8-46e6-9ffe-37d497a6bfd1",   // Запись онлайн-встреч
  other: "https://www.figma.com/api/mcp/asset/bc2c38fd-3ea4-4867-9042-dbb71eed3ce3",       // Другое
};

/* Step 4 usage cards (self/team). Two hero images, 200px tall. */
export const STEP4_IMAGES = {
  self: "https://www.figma.com/api/mcp/asset/d1978d48-26b2-42e7-8103-e093ff7d9110",
  team: "https://www.figma.com/api/mcp/asset/dc9e273f-1baa-4aa7-837d-763d7574112c",
};

/* Step 5a — Business contact form + benefits card. Figma frame 30806:1377. */
export const STEP5_TEAM = {
  chevronDown: "https://www.figma.com/api/mcp/asset/9448c52c-c90b-4576-8f28-8957fe399354",
  cardBg: "https://www.figma.com/api/mcp/asset/bfa21faf-e4ea-4a6a-9dd4-b43e07131dca",
  featureMedia: "https://www.figma.com/api/mcp/asset/fac9d69c-be74-45f9-a046-08fa6f2b84e9",
  featureCabinet: "https://www.figma.com/api/mcp/asset/c639969d-1a9d-43e1-830e-1f4c6e50a733",
  featureCustomize: "https://www.figma.com/api/mcp/asset/c5582dbe-f99d-4e6b-8278-3d80a9a135b9",
  featureManager: "https://www.figma.com/api/mcp/asset/e40d2786-4044-44c1-aba2-ccffcf050d67",
  featurePricing: "https://www.figma.com/api/mcp/asset/c3103b8a-bd6f-42b4-b203-e60d3a7cecc1",
};

/* Step 5b — pricing card header backgrounds.
 * (Plan name wordmarks in the Figma are rendered as SVG paths; for prototype
 * we render the word as plain text.) */
export const STEP5_SOLO = {
  headerLite: "https://www.figma.com/api/mcp/asset/d424ff1b-94ca-4cfd-8061-e3e81fb9af11",
  headerPro: "https://www.figma.com/api/mcp/asset/7a56ae3c-2d67-4ce5-8374-d8ef19390043",
  headerBusiness: "https://www.figma.com/api/mcp/asset/cd466168-4a89-4de3-8d75-503abe68662d",
  bulletIncluded: "https://www.figma.com/api/mcp/asset/41c6bc2c-0753-4b42-966c-352d73cb8260",
  bulletCheck: "https://www.figma.com/api/mcp/asset/48c783dd-e9b2-4d9d-bd0c-3704e95c659c",
  bulletStar: "https://www.figma.com/api/mcp/asset/c78c4559-cbaf-4052-b0d4-ca6d41ab5bea",
  popularIcon: "https://www.figma.com/api/mcp/asset/93dbd1a2-9ab0-4b02-b04c-9e9edcff3b1a",
};
