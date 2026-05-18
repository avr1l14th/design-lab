---
name: mymeet-design
description: Generate or restyle ANYTHING in the mymeet.ai design language — applying the same tokens, typography, philosophy and reference patterns regardless of artifact type (UI screen, document, presentation, email, landing, dashboard widget, chart, social asset, illustration, you name it). Activate when the user asks to make, redesign, style or convert anything in mymeet or in our design — phrases like сделай в нашем дизайне X, обнови X под mymeet, переверстай в стиле mymeet, сделай прототип, собери, свёрстай, make X in mymeet style, redesign X in our design.
---

# mymeet Design

Self-contained skill для генерации в визуальном языке mymeet.ai. Не зависит от какого-либо репо или проекта — работает в любой папке, любой сессии Claude Code. Применяет mymeet-принципы к **любому** артефакту, который пользователь попросит сделать.

---

## When to invoke

Активируется когда пользователь просит **сделать или переверстать что угодно** в дизайне mymeet. Триггеры:

- «Сделай в нашем дизайне X»
- «Сделай X в стиле mymeet»
- «Обнови / переверстай X под наш дизайн»
- «Свёрстай X в нашем стиле»
- «Собери X в mymeet-эстетике»

Артефакт может быть **любым**: UI экран, документ, презентация, КП, рассылка, лендинг, отчёт, гайд, диаграмма, post в соцсети, slide-карточка, чек-лист, баннер, иллюстрация — что угодно. Не пытайся заранее ограничивать список форматов.

Если в запросе нет явной отсылки к mymeet/нашему дизайну — спроси одну фразу для подтверждения. Не активируй для generic вопросов по React / CSS / Figma API без отсылки к стилю.

---

## Procedure

Универсальная процедура одинакова для любого артефакта:

1. **Прочитай контекст** — все правила inline в этом SKILL.md ниже. Реестр Figma-компонентов лежит рядом в `figma-library-snapshot.json` — открой его если артефакт делается в Figma или использует компоненты.
2. **Определи формат output** под задачу. Не угадывай заранее — выбирай ту технологию, которая реально лучше всего подходит:
   - Интерактивный artifact → Next.js + Tailwind, HTML+CSS, или React-компонент
   - Read-only документ → HTML с print-CSS, опционально PDF
   - Слайды → Figma Slides файл (если MCP позволяет) или 16:9 фреймы в design file
   - Email → table-based HTML с inline styles (cross-client compat)
   - Diagram / illustration → SVG или Figma фрейм
   - Социальная карточка → Figma фрейм в нужных размерах (1080×1080, 1080×1920, etc.)
   - Что-то нестандартное → выбери разумный output, объясни выбор пользователю
3. **Выясни рабочее окружение** — пользователь может быть в любой папке. Спроси куда сохранять результат (текущая папка / Desktop / новый файл / Figma file / clipboard) если это неясно. Не предполагай конкретную структуру проекта.
4. **Сгенерируй** артефакт применяя принципы и токены ниже.
5. **Проверь** что соблюдены hard rules (spacing/radius/font scales, no transitions, no stroke icons, no «Вы» с большой и т.д.).
6. **Отчитайся** — путь до файла или preview URL, что использовано из либы, что custom и почему.

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
- Шрифт **Inter** (Google Fonts, subsets latin + cyrillic).
- **`Medium 13` — главный body text везде в UI.** Default для label, nav, list rows, badges, captions.
- `Regular 14` / `Medium 14` — для длинного текстового контента (документы, body параграфов, email) с line-height 135%.
- `Medium 16` — заголовки секций внутри страницы (Card header, Section header, slide subtitle).
- `Medium 20` — заголовки разделов в документах, slide title для compact decks.
- `Medium 24` — page H2 (главный заголовок страницы), document H2, slide title.
- `Semibold 32` — крупные метрики в дашбордах, hero numbers, document H1.
- `Regular 12` / `Medium 12` — мета, секондари инфа (время, размер, формат, footer notes).
- Letter-spacing отрицательный, формула `≈ -(size × 0.02)px`.

### Icons
- **Filled (heroicons solid), 16 или 20 px.** Не stroke!
- Default color: `icon/secondary` (#818AA3) — серые.
- Active/selected: `icon/primary` (#212833) — тёмные.
- Brand-цветные filled — только когда иконка сама по себе бренд (Google Meet, Zoom и т.д.).
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
- ⚠️ **Никаких CSS `transition`** в коде — UI **статичный**, переходы происходят мгновенно.

### Loading states
- **Skeleton (серые пластины).** Pulse animation OK, без shimmer.

### Empty states
- Иконка filled 24px + title + description, или анимированная gif с «котами или обезьянками».

### Tone of voice
- Деловой но живой.
- Глаголы в инфинитиве: «Сохранить», «Добавить», «Узнать больше».
- **Без «Вы» с большой буквы.** Только «вы» строчная или вообще без обращения.
- Без эмодзи в основных текстах (эмодзи допустимы только в illustrations/гифках).
- Короткие фразы.

### Anti-patterns
- ❌ Stroke иконки (Lucide-style)
- ❌ Transitions / animations / spring / bounce
- ❌ Tinted card backgrounds кроме Banner
- ❌ Аватары 24/32/48
- ❌ Sidebar 240 в UI — должен быть 280
- ❌ «Вы» с большой буквы
- ❌ Shadow на in-page cards
- ❌ Bold (font-weight 700) — максимум Medium (500) или Semi Bold (600 для size 32)
- ❌ Material Design / Bootstrap / Discord-style / Salesforce-complexity

---

## Tokens

### Spacing scale (px) — никаких других значений
```
0, 2, 4, 6, 8, 12, 16, 24, 32, 40, 64, 80
```

Если в input value `20` или `36` — snap к ближайшему: `20 → 16 или 24`, `36 → 32 или 40`.

### Radius scale
```
0, 1, 2, 3, 4, full (9999)
```

| Размер элемента | Radius |
|---|---|
| ≤ 2 | 0 |
| 4–8 | 1 |
| 12–16 | 2 |
| 20–24 | 3 |
| ≥ 32 | 4 |
| Круглые аватары / dots | full |

### Colors

```ts
// Brand
blue:          "#0138C7"  // primary action — действия, ссылки, accent
blueHover:     "#0032B1"
bluePressed:   "#002C9C"
blueDisabled:  "#809BE3"
blueSea:       "#E4ECFA"  // primary subtle / progress trough
blueLightest:  "#F6F8FE"  // info banner bg

// Text
textPrimary:    "#212833"  // основной текст
textSecondary:  "#818AA3"  // вторичный текст
textTertiary:   "#585E6C"  // третий уровень
textDisabled:   "#C7C8CA"  // disabled + placeholder
textOnAction:   "#FFFFFF"  // текст на blue

// Surface
surfacePage:    "#FFFFFF"  // фон страницы
surfaceLight:   "#FAFAFA"  // hover на pages
surfaceSubtle:  "#F7F7F8"  // hover на cards / pressed
surfaceInfo:    "#F6F8FE"  // info banner

// Border
borderDefault:  "#EFEFEF"
borderStrong:   "#DDDEDF"

// Semantic
textDanger:     "#CC3333"  // error / destructive
textSuccess:    "#0D9655"  // success

// Accent (только для категорий, иллюстраций, аватаров — НЕ для UI ролей)
purple:  "#8A38F5"
orange:  "#FF9E2C"
yellow:  "#F2C300"
teal:    "#0DACAA"
```

### Font size mapping (size + weight → text style)

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

### Color mapping (hex → semantic variable)

Used when binding paint to Figma variable (для Figma-artifacts).

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

---

## Figma library

Файл библиотеки: `Ma7dtZb6eSHJ5YoaiVEUn2`.

Полный реестр компонентов (имена, ключи, варианты, текстовые слои) — в файле **`figma-library-snapshot.json`** рядом с этим SKILL.md. Открой его если артефакт делается в Figma или нужно увидеть какие компоненты доступны.

Базовые компоненты которые точно есть: Button, Input, Checkbox, Toggle, Dropdown, DropdownItem, Badge, Banner, Tooltip, FileChip, EmptyState, ProgressBar, MeetingListItem, SidebarItem, List Item, Tile, Logo (Mark/Full), Tab/Segmented, Tab/Pill, Tab/Underline, Modal/Announcement, Player, Thumbnail, Onboarding/IconCard, Onboarding/ImageCard, Template/Section, Transcript/Chapter, Transcript/Speaker, Transcript/Text, MediaInput, плюс icons (Icons/*) и интеграции (Integrations/*).

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

- ❌ **Never** invent spacing or radius values. Allowed spacing: `0, 2, 4, 6, 8, 12, 16, 24, 32, 40, 64, 80`. Allowed radius: `0, 1, 2, 3, 4, full`.
- ❌ **Never** use font sizes outside the textStyles list (`10, 12, 13, 14, 16, 20, 24, 32`).
- ❌ **Never** invent hex colors — only tokens из этого SKILL.md.
- ❌ **Never** add `shadcn`, `radix`, `mui`, `chakra` или другие UI libs.
- ❌ **Never** use `font-bold` (700), `font-extrabold`, `font-light` — только Regular (400), Medium (500), Semi Bold (600 for size 32 only).
- ❌ **Never** use deprecated `Light Theme` или `Dark Theme` Figma variable collections. Bind to `Primitives` или `Semantic`.
- ❌ **Never** draw custom logo, chevron, avatar, X-icon, plus-icon если артефакт делается в Figma — все они есть в либе (`Icons/*`, `Logo`, `Avatar/*`).
- ❌ **Never** игнорировать ToV — короткие фразы, без «Вы» с большой.

---

## Tech tips (опциональный reference, не процедура)

Эти подсказки помогут если ты решил делать в определённой технологии. Не обязаны использоваться — выбор технологии за тобой исходя из задачи.

### Next.js + React (для интерактивных артефактов)
- Use Inter font: `next/font/google` с subsets `["latin","cyrillic"]`, weights `["400","500","600"]`
- Используй компоненты из либы как React functions с теми же именами что в Figma snapshot (`SidebarItem`, `MeetingListItem`, `Logo`, `Button`, etc.).
- Tokens inline через `style={{ color: tokens.textPrimary }}` — это паттерн.

### Figma instance-based generation
- `figma.importComponentSetByKeyAsync(key)` / `figma.importComponentByKeyAsync(key)` по ключам из `figma-library-snapshot.json`.
- Найти variant: `set.children.find(c => c.name === "State=Active")` или `set.defaultVariant`.
- Text overrides через `inst.findOne(n => n.type === "TEXT" && n.characters === "Title")` + `await figma.loadFontAsync(node.fontName)` + `node.characters = "..."`.

### Figma token binding
- Bind paddings, corners, fills, strokes к library variables — критично чтобы артефакт реагировал на изменения либы.
- `node.setBoundVariable(field, variable)` для spacing/radius. `figma.variables.setBoundVariableForPaint(paint, "color", v)` для fills/strokes.
- Skip INSTANCE children — они styled by master.

### Generate Figma capture (от localhost HTML/Next → Figma frame)
- `mcp__figma__generate_figma_design` без params первый раз → инструкции.
- Затем с `outputMode: "existingFile"` + `fileKey: "Ma7dtZb6eSHJ5YoaiVEUn2"` → `captureId`.
- Open page с capture hash через bash `open`.
- Poll до `completed`.

### Print-style HTML (для документов)
- `@media print { h1 { page-break-before: always; } table { page-break-inside: avoid; } }`
- max-width контейнера `720`–`820`, padding `40`–`80`.
- Пользователь делает Cmd+P → Save as PDF.

### Table-based email (cross-client compat)
- Inline ВСЕ styles (style attribute на каждом `<td>`).
- `<table width="640">` centered, no flexbox/grid.
- Web-safe fonts fallback: `Inter, system-ui, -apple-system, sans-serif`.

### SVG diagrams / illustrations
- Используй те же tokens (цвета).
- Stroke-width `1.5px` для линий и стрелок.
- Filled circles для nodes, тонкие arrows с marker-end.

---

## Common pitfalls

### «User asked for X but unclear what artifact type»
Спроси одну фразу. Не угадывай.

### «Input file большой (PDF/DOCX)»
Use `pages` parameter в Read для PDF >10 страниц. Читай chunks.

### «Block comment closed early in code»
Avoid `*/16`, `*/24` etc. inside block comments — закрывают коммент.

### «use_figma SyntaxError»
- Arrow functions с `await` должны быть `async`.
- `??` (nullish coalescing) может не поддерживаться — use `||`.

### «Figma Slides API недоступен»
Падай на 16:9 frames в обычном design file. Сообщи пользователю что конвертация в Slides — ручная.

### «Email сломался в Outlook»
Inline ВСЕ styles. Никаких external classes. `<table>` для layout, не flexbox.

### «Variable binding doesn't show в inspector»
`setBoundVariable` требует variable доступную в file. Для cross-file: `importVariableByKeyAsync` сначала.

---

## Refreshing the library snapshot

Если дизайнер обновил Figma-либу — `figma-library-snapshot.json` может устареть. Чтобы обновить:

Если у пользователя есть Figma MCP подключен:
```js
// Запусти через mcp__figma__use_figma:
(async () => {
  for (const p of figma.root.children) await p.loadAsync();
  const all = figma.root.findAllWithCriteria({ types: ["COMPONENT_SET", "COMPONENT"] });
  const out = [];
  for (const n of all) {
    if (n.parent && n.parent.type === "COMPONENT_SET") continue;
    const page = (() => { let p = n.parent; while (p && p.type !== "PAGE") p = p.parent; return p ? p.name : null; })();
    const item = { name: n.name, key: n.key, type: n.type, page };
    if (n.componentPropertyDefinitions) {
      const props = Object.entries(n.componentPropertyDefinitions).map(([k, def]) => {
        const cleanName = k.replace(/#\d+:\d+$/, "");
        return def.type === "VARIANT"
          ? { name: cleanName, type: "VARIANT", default: def.defaultValue, options: def.variantOptions }
          : { name: cleanName, type: def.type, default: def.defaultValue };
      });
      if (props.length) item.props = props;
    }
    const target = n.type === "COMPONENT_SET" ? (n.defaultVariant || n.children[0]) : n;
    const tx = [];
    const walk = (m) => { if (m.type === "TEXT") tx.push(m.name); if ("children" in m) m.children.forEach(walk); };
    walk(target);
    if (tx.length) item.textLayers = tx;
    item.size = `${target.width}x${target.height}`;
    out.push(item);
  }
  return out.sort((a, b) => a.name.localeCompare(b.name));
})();
```

Затем перезапиши `figma-library-snapshot.json` рядом с этим SKILL.md.

Если MCP нет — пропусти. Skill работает и без свежего snapshot, опираясь на inline список компонентов и общие принципы.

---

## Output format expected

После генерации дай пользователю:

1. **Что сделано** — какой артефакт сгенерирован
2. **Где смотреть** — путь до файла / Figma URL / preview URL (если применимо)
3. **Что использовано** — из либы (если применимо), какие tokens
4. **Что custom** — что пришлось делать вне библиотеки и почему
5. **Скриншот** (если применимо)
