---
name: mymeet-design
description: Generate or restyle ANYTHING in the mymeet.ai design language — applying the same tokens, typography, philosophy and reference patterns regardless of artifact type (UI screen, document, presentation, email, landing, dashboard widget, chart, social asset, you name it). Activate when the user asks to make, redesign, style or convert anything in mymeet or in our design — phrases like сделай в нашем дизайне X, обнови X под mymeet, переверстай в стиле mymeet, сделай прототип, собери, свёрстай, make X in mymeet style, redesign X in our design.
---

# mymeet Design

Один skill для любой генерации в визуальном языке mymeet.ai. **Не зависит** от формата артефакта — UI экран, документ, презентация, email, лендинг, виджет, иллюстрация, диаграмма, post-картинка для соцсетей. Главное — применить принципы, токены и компоненты, а в каком формате это делать, реши сам по контексту запроса.

---

## When to invoke

Активируется когда кто-либо в команде просит **сделать или переверстать что угодно** в дизайне mymeet. Триггеры — фразы вроде:

- «Сделай в нашем дизайне X»
- «Сделай X в стиле mymeet»
- «Обнови / переверстай X под наш дизайн»
- «Свёрстай X в нашем стиле»
- «Собери X в mymeet-эстетике»

Артефакт может быть **любым**: UI экран, документ, презентация, КП, рассылка, лендинг, отчёт, гайд, диаграмма, post в соцсети, slide-карточка, чек-лист, баннер — что угодно. Не пытайся заранее ограничивать список.

Если в запросе нет явной отсылки к mymeet/нашему дизайну — спроси одну фразу для подтверждения. Не активируй для:
- Edits существующего artifact (когда юзер указывает конкретный путь в репо)
- Generic вопросы по React / CSS / Figma API

---

## Procedure

Универсальная процедура одинакова для любого артефакта:

1. **Прочитай контекст** (см. ниже) — обязательно перед любой генерацией.
2. **Определи формат output** под задачу. Не угадывай заранее — выбирай ту технологию, которая реально лучше всего подходит:
   - Интерактивный artifact (UI экран, лендинг) → Next.js + Tailwind в репо
   - Read-only документ (кейсбук, отчёт, гайд) → HTML с print-CSS, опционально PDF
   - Слайды → Figma Slides файл (если MCP позволяет) или 16:9 фреймы в design file
   - Email → table-based HTML inline-styles (cross-client compat)
   - Diagram / illustration / иконка → SVG или Figma фрейм
   - Социальная карточка → Figma фрейм в правильных размерах
   - Что-то нестандартное → выбери разумный output, объясни выбор юзеру
3. **Сгенерируй** артефакт применяя принципы и токены ниже.
4. **Проверь** что соблюдены hard rules (spacing/radius/font scales, no transitions, no stroke icons, no «Вы» с большой и т.д.).
5. **Отчитайся** — preview URL, путь до файла, что использовано из либы, что custom и почему.

---

## Контекст (обязательно прочитать перед работой)

1. **`design-system/DESIGN_SYSTEM.md`** — все правила, токены, типографика, spacing/radius scales, layout-паттерны, запреты.
2. **`design-system/figma-library-snapshot.json`** — реестр Figma-компонентов (`name`, `key`, variants, text layers). Source of truth для имён и пропсов компонентов. Если артефакт делается в Figma — используй инстансы оттуда.

Если snapshot старше ~2 недель — предложи юзеру `/refresh-figma-snapshot` перед работой.

---

## Design philosophy — mymeet.ai patterns

Применяй к любому артефакту, не только к UI.

### Density and rhythm
- **Comfortable middle**, не dense, не spacious. Стиль ближе к Stripe чем к Linear или Notion.
- Padding для cards / блоков: `16`–`24`.
- Высота строк в списках: `48`–`56`.
- Презентации и лендинги — чуть просторнее: padding `40`–`80`–`120`, gap `24`–`32`.

### Cards / blocks
- **Border-only, без shadow.** `1px border/default` + `surface/page` (white) + `radius/4`.
- Shadow только для popover / modal / dropdown.
- **Все cards белые.** Никаких tinted backgrounds кроме Banner (`surface/info`).
- Padding `24` для крупных контентных блоков, `16` для compact.

### Typography
- **`Medium 13` — главный body text везде в UI.** Default для label, nav, list rows, badges, captions.
- `Regular 14` / `Medium 14` — для длинного текстового контента (документы, body параграфов, email) с line-height 135%.
- `Medium 16` — заголовки секций внутри страницы (Card header, Section header, slide subtitle).
- `Medium 20` — заголовки разделов в документах, slide title для compact decks.
- `Medium 24` — page H2 (главный заголовок страницы), document H2, slide title.
- `Semibold 32` — крупные метрики в дашбордах, hero numbers, document H1.
- `Regular 12` / `Medium 12` — мета, секондари инфа (время, размер, формат, footer notes).

### Icons
- **Filled (heroicons solid), 16 или 20 px.** Не stroke!
- Default color: `icon/secondary` (#818AA3) — серые.
- Active/selected: `icon/primary` (#212833) — тёмные.
- Brand-цветные filled (Integrations, категорийные) — только когда иконка сама по себе бренд.
- ⚠️ **Не использовать outline / stroke иконки** (Lucide-style 1-1.5px) — это не в стиле mymeet.

### Avatars
- Только **два размера**: `16` и `20`. Не делай 24, 32, 48.

### Brand blue (`action/primary` / `#0138C7`)
- **Только для:** Primary CTA, links, focus rings, selected/active states, chart bars/progress indicators, hero accents.
- **Не для:** декоративных tint'ов, общих accent'ов, gradients, headline-цвета.
- Сдержанный брендинг — синий виден в артефакте в 2–4 местах, не больше.

### Interactive states (если артефакт interactive)
- **Background change only.** Никаких transforms, scale, opacity changes.
- Hover → `surface/light` (#FAFAFA) или `surface/subtle` (#F7F7F8).
- Pressed → `surface/subtle` (#F7F7F8).
- ⚠️ **Никаких CSS `transition`** в коде — UI **статичный**, переходы происходят мгновенно. Не добавлять `transition-colors`, `transition-all`, `hover:scale-*`.

### Loading states (если применимо)
- **Skeleton (серые пластины).** Pulse animation OK, без shimmer.
- Spinner — только внутри submit-button во время async actions.

### Empty states (если применимо)
- Использовать компонент `EmptyState` с variant `Type=Icon` или `Type=GIF`.
- GIF variant — анимированная gif с «котами или обезьянками».

### Tone of voice
- Деловой но живой.
- Глаголы в инфинитиве: «Сохранить», «Добавить», «Узнать больше».
- **Без «Вы» с большой буквы.** Только «вы» строчная или вообще без обращения.
- Без эмодзи в основных текстах (эмодзи допустимы только в illustrations/гифках).
- Короткие фразы.

### Что **не** в стиле mymeet (anti-patterns)
- ❌ Stroke иконки (Lucide-style)
- ❌ Transitions / animations / spring / bounce
- ❌ Tinted card backgrounds кроме Banner
- ❌ Аватары 24/32/48 — только 16 и 20
- ❌ Sidebar 240 в UI — должен быть 280
- ❌ «Вы» с большой буквы
- ❌ Shadow на in-page cards
- ❌ Bold (font-weight 700) — максимум Medium (500) или Semi Bold (600 для size 32)
- ❌ Material Design / Bootstrap / Discord-style / Salesforce-complexity

---

## Design north stars — на чьи продукты команда равняется

Когда сомневаешься «как бы выглядело это решение» — представь как сделали бы они.

**Премиум SaaS / dashboards:** Linear, Notion, Attio, Vercel, Sana, V7, Skiff, Craft, Framer.

**Documents / writing:** Notion docs, Craft, Strut, Skiff, Stripe docs.

**Presentations / decks:** Linear changelog, Vercel keynote slides, Stripe Sessions, Pitch.com templates.

**Landings:** Vercel, Linear, Attio, Stripe, Skiff — long-form scrolling с одним brand accent, без gradient overuse.

**Emails:** Stripe receipts, Linear notification emails, Vercel transactional — clean tables, brand color только в CTA.

**Что объединяет все эти референсы:**
1. Сдержанная палитра (1 brand color + grayscale)
2. Filled или mono icons
3. Border-only blocks с минимальной elevation
4. Medium-density (не dense, не spacious)
5. Минимум motion
6. Тщательная типографика, 1 font family, 2-3 weight
7. «Tool feel», не «marketing feel»

**Чем mymeet НЕ должен быть:** Material Design / Bootstrap / Discord / Salesforce / TikTok / Instagram-style.

---

## Hard rules

- ❌ **Never** invent spacing or radius values. Allowed spacing: `0, 2, 4, 6, 8, 12, 16, 24, 32, 40, 64, 80`. Allowed radius: `0, 1, 2, 3, 4, full`. Если в input value `20` или `36` — snap к ближайшему по таблице в DESIGN_SYSTEM.md.
- ❌ **Never** use font sizes outside the textStyles list (`10, 12, 13, 14, 16, 20, 24, 32`).
- ❌ **Never** invent hex colors — only tokens из DS или library variables.
- ❌ **Never** add `shadcn`, `radix`, `mui`, `chakra` или другие UI libs.
- ❌ **Never** use `font-bold` (700), `font-extrabold`, `font-light` — только Regular (400), Medium (500), Semi Bold (600 for size 32 only).
- ❌ **Never** use `Light Theme` или `Dark Theme` variable collections (deprecated). Bind to `Primitives` или `Semantic`.
- ❌ **Never** draw custom logo, chevron, avatar, X-icon, plus-icon — все есть в либе (`Icons/*`, `Logo`, `Avatar/*`).
- ❌ **Never** игнорировать ToV — короткие фразы, без «Вы» с большой.

---

## Color mapping (hex → semantic variable)

Used when binding paint to Figma variable (instance-based output) или mapping legacy hex в новый token.

| Hex | Frame/surface | Text | Stroke |
|---|---|---|---|
| `#212833` | — | `text/primary` | — |
| `#818AA3` | `color/grey/500` | `text/secondary` | — |
| `#C7C8CA` | — | `text/disabled` | — |
| `#FFFFFF` | `surface/page` | `text/on-action` | — |
| `#FAFAFA` | `surface/light` | — | — |
| `#F7F7F8` | `surface/subtle` | — | — |
| `#EFEFEF` | `border/default` | — | `border/default` |
| `#DDDEDF` | — | — | `border/strong` |
| `#0138C7` | `action/primary` | `text/link` | `border/focus` |
| `#0032B1` | `action/primary-hover` | — | — |
| `#0D9655` | `color/green/500` | `text/success` | — |
| `#CC3333` | `color/red/500` | `text/danger` | — |
| `#E4ECFA` | `color/blue/100` | — | — |
| `#8A38F5` | `color/purple/500` | — | — |
| `#00897B` | `color/teal/500` | — | — |
| `#2D8CFF` | `color/blue/600` | — | — |

## Font size mapping (size + weight → text style)

| Size | Regular (400) | Medium (500) | Semi Bold (600) |
|---|---|---|---|
| 10 | `Regular 10` | `Medium 10` | — |
| 12 | `Regular 12` | `Medium 12` | — |
| 13 | `Regular 13` | `Medium 13` | — |
| 14 | `Regular 14` | `Medium 14` | — |
| 16 | `Regular 16` | `Medium 16` | — |
| 20 | — | `Medium 20` | — |
| 24 | — | `Medium 24` | — |
| 32 | — | — | `Semibold 32` |

---

## Tech tips (если решил делать через эти технологии)

### Next.js prototype (для интерактивных артефактов)
- Create `app/<slug>/page.tsx`, `"use client"` для interactive.
- Use components из либы как React functions с теми же именами (`SidebarItem`, `MeetingListItem`, `Logo`, `Button`, etc.).
- Register в `prototypes-registry.ts`.
- Preview через `preview_start` + `preview_eval('location.assign("/<slug>")')`.

### Figma фрейм с инстансами
- `figma.importComponentSetByKeyAsync(key)` / `figma.importComponentByKeyAsync(key)` по ключам из snapshot.
- Найти variant: `set.children.find(c => c.name === "State=Active")` или `set.defaultVariant`.
- Text overrides через `inst.findOne(n => n.type === "TEXT" && n.characters === "Title")` + `await figma.loadFontAsync(node.fontName)` + `node.characters = "..."`.

### Token binding (Figma)
- Bind paddings, corners, fills, strokes к library variables — это критично чтобы артефакт реагировал на изменения либы.
- `node.setBoundVariable(field, variable)` для spacing/radius. `figma.variables.setBoundVariableForPaint(paint, "color", v)` для fills/strokes.
- Skip INSTANCE children — они styled by master.

### Generate Figma capture (от localhost → Figma frame)
- `mcp__figma__generate_figma_design` без params первый раз → инструкции.
- Затем с `outputMode: "existingFile"` + `fileKey: "Ma7dtZb6eSHJ5YoaiVEUn2"` → `captureId`.
- Open page с capture hash через bash `open`.
- Poll до `completed`.

### Print-style HTML (для документов)
- `@media print { h1 { page-break-before: always; } table { page-break-inside: avoid; } }`
- max-width контейнера `720`–`820`, padding `40`–`80`.
- Юзер делает Cmd+P → Save as PDF.

### Table-based email
- Inline ВСЕ styles (style attribute на каждом `<td>`).
- `<table width="640">` centered, no flexbox/grid.
- Web-safe fonts fallback: `Inter, system-ui, -apple-system, sans-serif`.

---

## Common pitfalls

### «User asked for X but unclear what artifact type»
Спроси одну фразу. Не угадывай.

### «Input file большой (PDF/DOCX)»
Use `pages` parameter в Read для PDF >10 страниц. Читай chunks.

### «Block comment closed early in page.tsx»
Avoid `*/16`, `*/24` etc. inside block comments.

### «use_figma SyntaxError»
- Arrow functions с `await` должны быть `async`.
- `??` (nullish coalescing) может не поддерживаться — use `||`.

### «Figma Slides API недоступен»
Падай на 16:9 frames в обычном design file. Сообщи юзеру что конвертация в Slides — ручная.

### «Email сломался в Outlook»
Inline ВСЕ styles. Никаких external classes. `<table>` для layout, не flexbox.

### «Variable binding doesn't show в inspector»
`setBoundVariable` требует variable доступную в file. Для cross-file: `importVariableByKeyAsync` сначала.

### «Build fails: ReferenceError»
После переименования React-компонента, `grep -n` для ALL usages и обновить.

---

## Output format expected

После генерации дай юзеру:

1. **Что сделано** — какой артефакт сгенерирован
2. **Где смотреть** — preview URL / Figma URL / путь до файла
3. **Что использовано** — из либы (count instances), какие tokens
4. **Что custom** — что пришлось делать вне библиотеки и почему
5. **Скриншот** (если применимо)
