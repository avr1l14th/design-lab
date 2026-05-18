---
name: mymeet-design
description: Generate ANY artifact in the mymeet.ai design language — UI screens, documents (case books, reports, guides), presentations (sales decks, pitch decks, KP — коммерческие предложения), email templates, landing pages. Activate this when the user asks to make / redesign / style anything in mymeet or in our design — phrases like сделай в нашем дизайне X, обнови X под mymeet, переверстай в стиле mymeet, сделай прототип, сделай дашборд, сделай кейсбук, сделай КП, сделай рассылку, сделай лендинг, make X in mymeet style, redesign X in our design.
---

# mymeet Design — universal generator

End-to-end procedure for turning any verbal request («сделай в нашем дизайне X», «обнови X под mymeet», «переверстай в стиле mymeet») into a finished artifact in the mymeet.ai visual language. Works for UI prototypes, long documents, presentations, email templates and landing pages — picks the right tech per artifact type, but uses the same design tokens, typography, philosophy and component instances for all of them.

---

## When to invoke

Activate this skill whenever a member of the team asks to **make or restyle anything** in mymeet's design. Typical triggers:

**UI screens (для дизайнеров / продуктов):**
- «Сделай в нашем дизайне экран X»
- «Сгенерируй прототип / дашборд / форму / онбординг»
- «Сделай в стиле mymeet экран ...»

**Documents (для сейлзов / маркетинга):**
- «Обнови этот кейсбук в нашем дизайне»
- «Переверстай отчёт под mymeet»
- «Сделай гайд / how-to / playbook в нашем стиле»

**Presentations / sales (для сейлзов):**
- «Сделай КП в нашем дизайне»
- «Перевёрстай pitch deck под mymeet»
- «Собери презентацию для клиента про X в нашем стиле»

**Emails (для маркетинга / продукта):**
- «Сделай рассылку про новую фичу»
- «Свёрстай welcome-email / transactional letter под mymeet»

**Landing pages (для маркетинга):**
- «Сделай лендинг для сегмента X»
- «Свёрстай страницу фичи в нашем дизайне»

If trigger is ambiguous (например «сделай X» без явной отсылки к mymeet или к типу артефакта) — ask one clarifying question. **Не активировать** для:
- Edits существующего screen/документа (когда user указывает конкретный путь в репо)
- Pure Figma operations без генерации artifact (`/figma-use` если нужно)
- Generic вопросы по React / CSS

---

## Step 0 — Detect artifact type (mandatory before any work)

By the user's request and any attached input, classify the artifact:

| Сигналы | Тип | Stage |
|---|---|---|
| «экран», «прототип», «дашборд», «форма», «онбординг», «настройки», UI screenshot reference | **UI screen** | A |
| «кейсбук», «отчёт», «гайд», «документ», «playbook», long-form PDF/DOCX на входе | **Document** | B |
| «КП», «презентация», «pitch deck», «slides», PPTX/Slides на входе, 16:9 framing | **Presentation** | C |
| «email», «рассылка», «письмо», «уведомление», «welcome», «onboarding email» | **Email template** | D |
| «лендинг», «landing», «marketing page», «фича-страница», «landing для сегмента» | **Landing page** | E |

If нельзя classify — спроси одну фразу: «Это [type1] или [type2]?» — и продолжай.

Если user приложил input file (PDF/DOCX/PPTX/image/Figma URL) — это **существующий** артефакт для restyle. Извлечь содержимое (через Read tool для PDF, или OCR/parse), затем переверстать под mymeet в **том же** или **выбранном** output формате.

---

## Prerequisites (must read before generating, FOR ALL ARTIFACT TYPES)

1. **`design-system/DESIGN_SYSTEM.md`** — colors, typography, spacing/radius scales, rules.
2. **`design-system/figma-library-snapshot.json`** — registry of Figma components (relevant for UI screens, sometimes presentations).
3. **«Design philosophy»** and **«Design north stars»** sections below — apply to ALL artifact types, not only UI.

If snapshot is older than ~2 weeks — suggest `/refresh-figma-snapshot` before generating UI/presentations.

---

## Design philosophy — mymeet.ai patterns (apply to ALL artifact types)

Эти правила определяют **«нативный» mymeet-look** даже когда нет библиотечного компонента под ситуацию. Они работают для UI экранов, документов, презентаций, email-ов и лендингов — везде где видна mymeet-эстетика.

### Density and rhythm
- **Comfortable middle**, не dense, не spacious. Стиль ближе к Stripe чем к Linear или Notion.
- UI: padding для карточек `16`–`24`, высота строк `48`–`56`.
- Documents: межстрочное spacing `8`–`16`, paragraph spacing `24`.
- Presentations: slide margin `40`–`80`, content gap `24`–`32`.

### Page / artifact layout
- **UI:** Sidebar `280` (не 240!) фиксированный. Main full-width только на дашбордах. Прочие экраны — container `580`–`670`.
- **Documents:** Контент центрирован, max-width `720`–`820` для длинных текстов. Поля `40`–`80`.
- **Presentations:** 16:9 (1920×1080), padding `80` со всех сторон, контент max-width `1280` если центрирован.
- **Emails:** Tabled layout `600`–`640` шириной (industry standard для Outlook).
- **Landings:** Sections full-width, content max-width `1200`, padding section `80`–`120`.

### Cards / blocks
- **Border-only, без shadow.** `1px border/default` + `surface/page` (white) + `radius/4`.
- Shadow только для popover/modal/dropdown (`shadow/default`).
- **Все cards белые.** Никаких tinted backgrounds кроме Banner (он использует `surface/info`).
- Padding `24` для крупных контентных блоков, `16` для compact.

### Typography (одинаково везде)
- **`Medium 13` — главный body text в UI.** Default для label, nav, list rows, badges, captions.
- `Regular 14` / `Medium 14` — для длинного текстового контента (документы, body параграфов, email) с line-height 135%.
- `Medium 16` — заголовки секций внутри страницы (Card header, Section header, slide subtitle).
- `Medium 20` — заголовки разделов в документах, slide title для compact decks.
- `Medium 24` — page H2 (главный заголовок страницы), document H2, slide title.
- `Semibold 32` — крупные метрики в дашбордах, hero numbers in decks/landings, document H1.
- `Regular 12` / `Medium 12` — мета, секондари инфа (время, размер, формат, footer notes).

### Icons
- **Filled (heroicons solid), 16 или 20 px.** Не stroke!
- Default color: `icon/secondary` (#818AA3) — серые.
- Active/selected: `icon/primary` (#212833) — тёмные.
- Brand-цветные filled (Integrations, категорийные) — только когда иконка сама по себе бренд.
- ⚠️ **Не использовать outline / stroke иконки** (Lucide-style 1-1.5px) — это не в стиле mymeet.

### Avatars
- Только **два размера**: `16` (в badge'ах внутри строк) и `20` (немного крупнее, для inline-аватаров).
- Не делай 24, 32, 48 — их в DS не предусмотрено.

### Brand blue (`action/primary` / `#0138C7`)
- **Только для:** Primary CTA buttons, links, focus rings, selected/active states, chart bars/progress indicators, hero accents в landings.
- **Не для:** декоративных tint'ов карточек, общих accent'ов, gradients, headline-цвета.
- Сдержанный брендинг — синий виден на экране/слайде в 2–4 местах, не больше.

### Interactive states (UI / landings)
- **Background change only.** Никаких transforms, scale, opacity changes.
- Hover → `surface/light` (#FAFAFA) или `surface/subtle` (#F7F7F8).
- Pressed → `surface/subtle` (#F7F7F8).
- ⚠️ **Никаких CSS `transition`** в коде — UI **статичный**, переходы происходят мгновенно. Не добавлять `transition-colors`, `transition-all`, `hover:scale-*` в Tailwind классы.

### Loading states (UI only)
- **Skeleton (серые пластины).** Pulse animation OK, без shimmer.
- Spinner — только внутри submit-button во время async actions.

### Empty states (UI only)
- Использовать компонент `EmptyState` с variant `Type=Icon` или `Type=GIF`.
- **GIF variant** — анимированная gif с «котами или обезьянками» (не abstract illustrations).

### Toast / Snackbar (UI only)
- **Bottom-center.** Slide-in от низа, fade-in, исчезновение через 3–5 сек.

### Tone of voice (для текста ВЕЗДЕ — UI, docs, decks, emails, landings)
- Деловой но живой.
- Глаголы в инфинитиве: «Сохранить», «Добавить встречу», «Узнать больше».
- **Без «Вы» с большой буквы.** Только «вы» строчная (или вообще без обращения).
- Без эмодзи в UI/документах/КП (эмодзи допустимы только в illustrations/гифках).
- Короткие фразы. Не «Произошла ошибка при попытке выполнить запрос на сервер», а «Не получилось — попробуй ещё раз».

### Marketing / onboarding / decks pages
- Те же токены и компоненты, **чуть просторнее и празднично**.
- Padding больше: `40`–`80`–`120`, gap `24`–`32`.
- Можно использовать `Medium 24` или `Semibold 32` крупнее для hero-блоков.
- Никаких отдельных design language'ей — всё в той же mymeet-эстетике.

### Что **не** в стиле mymeet (типичные ошибки)
- ❌ Stroke иконки (Lucide-style) — должны быть filled heroicons
- ❌ Transitions на hover в коде — должно быть мгновенно
- ❌ Tinted card backgrounds — только белые с border (кроме Banner с `surface/info`)
- ❌ Аватары 24/32/48 — только 16 и 20
- ❌ Sidebar 240 — должен быть 280
- ❌ Settings или любой не-дашборд экран full-width — должен быть container 580–670
- ❌ «Вы» с большой буквы
- ❌ Toast bottom-right или top-right — только bottom-center
- ❌ Shadow на in-page cards — только border
- ❌ Bold (font-weight 700) — максимум Medium (500) или Semi Bold (600 для size 32)
- ❌ Material Design (ripples / heavy shadows), Bootstrap admin templates, Discord/Twitch gaming colors

---

## Design north stars — на чьи продукты команда равняется

Когда сомневаешься «как бы выглядело это решение» — представь как сделали бы они.

**Премиум SaaS / dashboards (главные ориентиры):**
- **Linear, Notion, Attio, Vercel** — UI и продукт
- **Sana, V7, Skiff, Craft, Framer** — премиум inputs

**Documents / writing:**
- **Notion docs, Craft, Strut, Skiff** — длинные документы, минималистичное оформление
- **Stripe docs** — типичный «дев-док» подход с code и diagrams

**Presentations / decks:**
- **Linear changelog, Vercel keynote slides, Stripe Sessions slides** — минимализм, один accent, generous whitespace
- **Pitch.com templates** — формальные KP-decks без excess decoration

**Landings:**
- **Vercel, Linear, Attio, Stripe, Skiff** — long-form scrolling с одним brand accent, без gradient overuse

**Emails:**
- **Stripe receipts, Linear notification emails, Vercel transactional** — clean tables, brand color только в CTA

### Что объединяет
1. Сдержанная палитра (1 brand color + grayscale)
2. Filled или mono icons
3. Border-only blocks с минимальной elevation
4. Medium-density
5. Минимум motion
6. Тщательная типографика
7. «Tool feel», не «marketing feel»

### Чем mymeet НЕ должен быть
- Material Design / Bootstrap / Discord / Salesforce / TikTok / Instagram

---

## Stage A — UI screen (the original design-screen workflow)

For UI prototypes that will run on localhost and be exported to Figma.

### A.1 Context gathering (5 min)

1. Read `DESIGN_SYSTEM.md` end-to-end.
2. Open `figma-library-snapshot.json`. Identify components for this screen. Note `name` and `key`.
3. If нужного компонента нет в snapshot — спросить дизайнера: «X отсутствует в либе. Custom-вариант или сначала добавить компонент?»

### A.2 Localhost prototype (15–30 min)

4. Create `app/<slug>/page.tsx`. `"use client"` for any interactive screen.
5. Copy `tokens` object from DESIGN_SYSTEM.md. Use only these colors — never raw hex.
6. Implement React functions with names **1-to-1** matching Figma library (`SidebarItem`, `TabSegmented`, `MeetingListItem`, `Logo`, `Button`, `Input`, `Checkbox`, `Tooltip`, etc.).
7. Use only allowed scale values (spacing: 0,2,4,6,8,12,16,24,32,40,64,80; radius: 0,1,2,3,4,full; font sizes из textStyles).
8. Register in `prototypes-registry.ts`.
9. Start dev server via `preview_start` (server name `design-lab`). Navigate to `/<slug>` via `preview_eval`. Take `preview_screenshot`. Verify.
10. Iterate on bugs with Edit + reload + screenshot.

### A.3 Figma capture (optional)

If user asks to export или нужен pixel reference:
11. Call `mcp__figma__generate_figma_design` (no params first → instructions; then with `outputMode: "existingFile"` + fileKey).
12. Ensure capture script in `app/layout.tsx` (already there for dev).
13. Open page with capture hash via bash `open` command.
14. Poll until `completed`. Get Figma URL.

### A.4 Instance-based Figma frame

15. Via `use_figma`: load pages, fonts (`Inter Regular`/`Medium`/`Semi Bold`).
16. For each needed component — `importComponentSetByKeyAsync(key)` или `importComponentByKeyAsync(key)` (keys из snapshot).
17. Find variant by name (`State=Active`) или use `defaultVariant`.
18. `variant.createInstance()`. Set text overrides via findOne by characters or layer name. Load font before setting characters.
19. Position frame next to capture (если есть).

### A.5 Token binding

20. Load all variables (`getLocalVariablesAsync`) and text styles (`getLocalTextStylesAsync`).
21. Walk frame recursively, skip INSTANCE children (styled by master).
22. For each FRAME / RECTANGLE / COMPONENT: bind paddings, corner radii, fills, strokes to library variables.
23. For each TEXT: apply `setRangeTextStyleIdAsync(0, len, styleId)` + bind fill color to `text/*` semantic variable.

### A.6 Audit + finalize

24. Walk frame again, snap any padding/gap/cornerRadius outside allowed scale to nearest, rebind.
25. `mcp__figma__get_screenshot` at `maxDimension: 1280` → show to user.
26. Summarize: localhost URL, Figma URL, components used, tokens bound.

---

## Stage B — Document (case book, report, guide)

For long-form documents that need to be readable as PDF.

### B.1 Context

1. If input file present (PDF/DOCX) — extract content via Read tool. Если PDF большой (>10 pages), читать с `pages` parameter по частям.
2. Identify structure: cover, sections, subsections, callouts, charts, image positions, tables.

### B.2 Output technology

Default — **HTML с print CSS** в `app/docs/<slug>/page.tsx`:
- Renders в браузере как читаемая страница
- Через `Cmd+P → Save as PDF` превращается в чистый PDF
- Использует те же mymeet tokens что и UI
- Может быть закоммичено в design-lab репо и задеплоено

Альтернативно — если user явно просит DOCX → use `docx` skill из anthropic-skills (если доступен); если PPTX → Stage C.

### B.3 Structure (HTML document)

- Container: max-width `720` (research/guide) или `820` (presentation-style doc). Centered. Padding x `40`, y `80`.
- **Cover page** (если есть): `Semibold 32` title + `Regular 14` subtitle + accent bar в `action/primary`. Page-break после.
- **Sections:** H1 = `Semibold 32`, H2 = `Medium 24`, H3 = `Medium 20`, H4 = `Medium 16`. Paragraph = `Regular 14` (line-height 135%).
- **Inline elements:** bold = `Medium`. Links = `text/link` + underline. Code = `Regular 13` mono в `surface/subtle` box.
- **Callouts** — Banner-style блоки (`surface/info` bg, `radius/4`, padding `16`).
- **Tables:** thin border `border/default`, header row Medium 13, cells Regular 13. Row hover NOT applied в print view.
- **Charts:** SVG inline, single accent (`action/primary`), grayscale grid lines.
- **Images:** rounded `radius/4`, max-width 100% контейнера.
- **Page break:** `@media print` rules — break перед каждой H1, avoid break inside callouts/tables.

### B.4 Print CSS

```css
@media print {
  body { max-width: none; margin: 0; }
  h1 { page-break-before: always; }
  .callout, table { page-break-inside: avoid; }
  a { color: inherit; text-decoration: none; }
}
```

### B.5 Output

- Path: `app/docs/<slug>/page.tsx` или standalone `public/docs/<slug>.html`
- Локальный preview: `http://localhost:3000/docs/<slug>`
- Скриншот через preview, проверка `Cmd+P` preview через `preview_eval('window.print()')` (chrome-only).
- Финальный артефакт: PDF (export через Save as PDF в браузере) или линк на онлайн-версию.

---

## Stage C — Presentation (КП, pitch deck, sales deck)

For 16:9 slide presentations.

### C.1 Context

1. Если на входе PPTX/Slides — extract slide structure через Read (PDF), python-pptx (если установлен), или ручной парс title+content.
2. Определить framing: pitch deck (10–20 slides) или КП (5–10 slides) или sales sheet (1–3 slides).

### C.2 Output technology

**Primary path: Figma Slides** (`figma.com/slides/...`). Создаётся через `use_figma` в новом Slides файле либо в existing presentations file mymeet.

Альтернативно если user просит PPTX — use `anthropic-skills:pptx` skill (если доступен) для генерации .pptx файла.

### C.3 Slide structure (Figma Slides)

Слайд = 1920×1080, padding `80` со всех сторон. Каждый slide один из templates:

**Cover slide:** Logo Mark `64×64` сверху-слева, title `Semibold 32`, subtitle `Medium 16` (`text/secondary`), date/author внизу.

**Section divider:** Полу-фуллскрин с `Medium 24` названием раздела + цифрой раздела `Semibold 32` в `action/primary`.

**Content slide:** Title `Medium 24` сверху, body `Regular 14` или bullet list `Regular 14` с Inter line-height 135%. Bullets не "•" а `Medium 13` нумерация или `Icons/Check/16` в `action/primary`.

**Comparison slide (КП):** 2 column layout, левая = «как сейчас», правая = «с mymeet». Cards border-only, padding 24, title `Medium 16`, body `Regular 13`.

**Numbers slide:** Большие метрики `Semibold 32` или `Semibold 48+` (если не помещается в Medium 32), label `Medium 16`, supporting text `Regular 14`.

**Closing slide:** CTA button-like blocks с brand action/primary, contact info.

### C.4 Generation via use_figma

```js
// (внутри use_figma script)
// 1. Создать Slides file через create_new_file API или использовать existing
// 2. Для каждого slide:
//    const slide = figma.createSlide();
//    slide.resize(1920, 1080);
//    slide.fills = [{type:"SOLID", color:{r:1,g:1,b:1}}];
//    // Title
//    const title = figma.createText();
//    title.textStyleId = mediumS24.id;
//    title.characters = "Slide title";
//    title.x = 80; title.y = 80;
//    slide.appendChild(title);
//    // ... etc
// 3. Импорт компонентов библиотеки (Logo, Badge, MetricCard если будет) — через importComponentByKeyAsync
```

⚠️ **Figma Slides API features могут быть ограничены.** Если `figma.createSlide` недоступен — упасть на создание frames 1920×1080 в обычном design file и сказать пользователю «закинул в design file, можешь конвертировать в Slides вручную».

### C.5 Output

- Figma URL — на slides file или design file с 16:9 frames
- Скриншот первого слайда через `get_screenshot`
- Summary: количество slides, что использовал из либы, что custom

---

## Stage D — Email template

For HTML email rendered in Gmail, Outlook, Apple Mail.

### D.1 Output technology

**Table-based HTML email** — единственный надёжный path для cross-client compatibility. CSS inline (style attributes), не external classes.

### D.2 Structure

- Outer container: `<table width="640">` centered, `surface/page` bg.
- Header: Logo Mark + product name. Padding `40` top/bottom, `24` left/right.
- Body sections: tables stacked, padding `24`. Title `Medium 24`, body `Regular 14` line-height 135%.
- CTA: full-width row с `action/primary` button bg, `text/on-action` text, padding `12 24`, `radius/4`.
- Footer: `Regular 12` `text/secondary`, links к unsubscribe и settings.

### D.3 Constraints

- **Не используй** flexbox / grid / custom fonts (fallback `system-ui, -apple-system, sans-serif`).
- **Используй** только web-safe fonts (Inter подгрузится не везде — fallback всегда).
- Inline styles для каждого `<td>` и `<p>`.
- Images через `<img src="absolute-url" alt="..." width="N">` с absolute URL.
- Dark mode hint: `<meta name="color-scheme" content="light">` чтобы Gmail не инвертировал.

### D.4 Output

- File: `app/emails/<slug>/email.html` или `app/emails/<slug>/page.tsx` (для preview в браузере).
- Preview через localhost: `http://localhost:3000/emails/<slug>`.
- Final artifact: standalone .html file который можно скопировать в ESP (Sendgrid, Mailchimp, etc.).

---

## Stage E — Landing page

For marketing pages with hero, features, social proof, CTA.

### E.1 Output technology

Next.js page в design-lab repo: `app/landing-<slug>/page.tsx`. Та же React + Tailwind стек что и UI экраны.

### E.2 Structure

- **Hero section:** padding `120` top/bottom, `40` left/right. Centered. Title `Semibold 32` (or larger via inline `style={{fontSize: 48}}` если нужен очень крупный hero — единственное место где можно отступать от шкалы). Subtitle `Regular 16`. CTA button (`action/primary`). Optional hero illustration справа.
- **Feature blocks:** rows с padding `80` top/bottom. Icon (`Icons/*/24` filled) + title `Medium 20` + body `Regular 14`. 3-column grid на desktop, stacked на mobile.
- **Numbers / social proof:** centered row с большими `Semibold 32` числами + labels `Medium 14`.
- **Testimonial cards:** Card-style (`border-only`), quote `Regular 16` italic, author Medium 13 с avatar 20px.
- **CTA section:** prominent button, secondary link рядом. `surface/subtle` или brand-tinted bg `color/blue/100` ALLOWED здесь (исключение из «без tinted cards»).
- **Footer:** thin row с links, copyright, `Regular 12` `text/secondary`.

### E.3 Responsive

- Tailwind breakpoints `md:` 768, `lg:` 1024.
- Hero/features stack vertical на mobile, grid на desktop.
- Min font size на mobile 14, не 13 (читаемость).

### E.4 Output

- Path: `app/landing-<slug>/page.tsx`
- Register в `prototypes-registry.ts` с тегом `["landing", "marketing"]`
- Preview: `http://localhost:3000/landing-<slug>`
- Screenshot через preview_screenshot

---

## Hard rules — apply to ALL artifact types

- ❌ **Never** invent spacing or radius values. Snap to allowed scale.
- ❌ **Never** add `shadcn`, `radix`, `mui`, `chakra` или другие UI libs.
- ❌ **Never** use `font-bold` (700), `font-extrabold`, `font-light` — только `Regular` (400), `Medium` (500), or `Semi Bold` (600 for size 32 only).
- ❌ **Never** use `Light Theme` или `Dark Theme` variable collections (deprecated). Bind to `Primitives` или `Semantic`.
- ❌ **Never** create custom logos / icons если есть в библиотеке.
- ❌ **Never** ignore the ToV — короткие фразы, без «Вы» с большой.

---

## Common pitfalls

### "User asked for X but I'm not sure if it's UI or document"
Спроси одну фразу. Не угадывай.

### "Input PDF is too large to read in one call"
Use `pages` parameter в Read для PDF >10 страниц. Читай chunks по 5-10 страниц.

### "Block comment closed early in page.tsx"
Avoid `*/16`, `*/24` etc. inside block comments — that closes the comment.

### "use_figma SyntaxError"
- All arrow functions с `await` должны быть `async`.
- `??` (nullish coalescing) может не поддерживаться — use `||`.

### "Figma Slides API not available"
Падай на 16:9 frames в обычном design file. Сообщи user'у что конвертация в Slides — ручная.

### "Email looks broken in Outlook"
Inline ВСЕ styles. Никаких external CSS classes. Use `<table>` для layout, не flexbox.

### "Variable binding doesn't show in inspector (Figma)"
`setBoundVariable` требует variable доступную в file. Для cross-file: `importVariableByKeyAsync` сначала.

### "Build fails: ReferenceError: <ComponentName> is not defined"
After renaming React component, `grep -n` для ALL usages и обновить.

---

## Color mapping (hex → semantic variable, для всех artifact types где нужен Figma binding)

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

## Output format expected (для всех типов)

When done, give the user:

1. **Тип артефакта** — что именно сгенерировано (UI screen / document / deck / email / landing)
2. **URL preview** — куда смотреть локально
3. **Финальный артефакт** — где взять (Figma URL / HTML файл / Next.js page / PPTX file)
4. **Что использовано из библиотеки** — count instances / tokens (если применимо)
5. **Custom / не из либы** — что пришлось делать вручную и почему
6. **Скриншот** — превью результата
