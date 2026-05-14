<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# Design system — обязательно к прочтению перед версткой

Перед генерацией любого UI-экрана читай:
1. **`design-system/DESIGN_SYSTEM.md`** — правила, токены, типографика, spacing/radius шкалы, запреты.
2. **`design-system/figma-library-snapshot.json`** — реальный реестр Figma-либы `mymeet.ai`: имена/keys/variants всех компонентов, text styles, variables (spacing/radius/color). Используй его как **источник истины** для имён компонентов в коде, размеров, состояний.

Эталонные прототипы для копирования паттернов:
- `app/search-filters/page.tsx` — app-layout (sidebar + main + popover'ы)
- `app/meeting-stats/page.tsx` — dashboard (sidebar + 4 metric cards + chart + sources + recent list) **с компонентами из либы**
- `app/onboarding-mymeet/OnboardingShell.tsx` — centered flow
- `app/multi-file-upload/UploadModal.tsx` — модалка с прогрессом

Figma library: `mymeet.ai` (file `Ma7dtZb6eSHJ5YoaiVEUn2`, libraryKey в snapshot).

---

# Workflow: «Сделай в нашем дизайне экран X»

Когда команда пишет «сделай в нашем дизайне экран ..., запусти на localhost и потом экспортируй в Figma» — выполняй эту последовательность шагов **без лишних уточнений**.

## Этап 1 — Подготовка контекста (5 мин)

1. Прочитай `design-system/DESIGN_SYSTEM.md` целиком.
2. Открой `design-system/figma-library-snapshot.json`. Найди компоненты, которые понадобятся в экране — выпиши их `name` и `key`.
3. Если нужного компонента в snapshot нет — **не выдумывай**, а спроси дизайнера: «Я бы использовал X, его в либе пока нет. Сделать кастом или добавишь?» (или используй inline-паттерн из DESIGN_SYSTEM.md). Если выясняется что компонент **есть, но добавлен недавно** — обнови snapshot (см. ниже).

## Этап 2 — Localhost (15–30 мин)

4. Создай `app/<slug>/page.tsx`. Используй `"use client"` если есть состояние.
5. В начало файла копируй блок `tokens` из DESIGN_SYSTEM.md (только цвета, остальное — через style binding в Figma на этапе 4).
6. Используй компоненты как **React-функции** с именами 1-в-1 как в snapshot: `SidebarItem`, `TabSegmented`, `MeetingListItem`, `Logo` и т.д. Их variant states / variant props — в одинаковом нэйминге (`State="Active"`, `Type="Full"`).
7. Все text/padding/gap/radius/cornerRadius значения бери **только** из разрешённых наборов:
   - Spacing: `0, 2, 4, 6, 8, 12, 16, 24, 32, 40, 64, 80`
   - Radius: `0, 1, 2, 3, 4, full`
   - Если в HTML/Figma нужны другие — это **ошибка**, snap к ближайшему по таблице в DESIGN_SYSTEM.md.
8. Зарегистрируй экран в `prototypes-registry.ts`.
9. Запусти dev server (`preview_start` сервера `design-lab`). Открой `/app/<slug>` через `preview_eval location.assign(...)`. Сделай `preview_screenshot`, проверь визуально.
10. При наличии багов — итерируй (Edit + reload + screenshot).

## Этап 3 — Захват в Figma (плоский reference, 1 мин)

11. Вызови `mcp__figma__generate_figma_design` без `outputMode` — получи список опций.
12. Вызови повторно с `outputMode: "existingFile"` и `fileKey: "Ma7dtZb6eSHJ5YoaiVEUn2"` — получишь `captureId`.
13. Открой страницу в браузере с capture hash через `open` (bash) + проверь что `capture.js` подключён в `app/layout.tsx` (он там есть только в dev-режиме).
14. Поллинг `mcp__figma__generate_figma_design` с тем же `captureId` до `completed`. URL фрейма придёт в ответе.
15. Этот фрейм — **layout reference**, плоский. Сразу переходи к этапу 4 (instance-based) — он его и заменит.

## Этап 4 — Сборка через инстансы (use_figma, 5–15 мин)

16. Через `use_figma` собери параллельный фрейм рядом с capture'ом. Используй `importComponentByKeyAsync(key)` / `importComponentSetByKeyAsync(key)` для каждого нужного компонента (keys — в snapshot).
17. Для `COMPONENT_SET` — после импорта найди нужный вариант: `set.children.find(c => c.name === "State=Active")`.
18. Создавай инстансы через `variant.createInstance()`. Применяй text overrides через `inst.findOne(n => n.type === "TEXT" && n.characters === "<placeholder>")` + `figma.loadFontAsync(node.fontName)` + присваивай `node.characters`.
19. Для «своих» (не библиотечных) frame'ов — создавай через `figma.createFrame()`, ставь `layoutMode`, `itemSpacing`, `padding*`, `cornerRadius` с разрешёнными значениями.

## Этап 5 — Биндинг токенов (use_figma, 2 мин)

20. Обходи весь новый фрейм рекурсивно, пропуская `INSTANCE` потомков (у них всё уже застайлено мастер-компонентом).
21. Для каждого `FRAME` / `RECTANGLE` / `COMPONENT`:
    - `paddingTop/paddingBottom/paddingLeft/paddingRight/itemSpacing` → `node.setBoundVariable(field, spacing/<N>)`
    - 4 угла `cornerRadius` → `node.setBoundVariable("topLeftRadius", radius/<N>)` и т.д.
    - `fills` / `strokes` → пересоздай через `figma.variables.setBoundVariableForPaint(paint, "color", v)`. Маппинг hex → semantic var см. в DESIGN_SYSTEM.md (`#212833` → `text/primary`, `#0138C7` → `action/primary` для surface или `text/link` для текста, и т.д.)
22. Для каждого `TEXT` ноды:
    - Определи стиль по `fontSize + fontName.style` → найди в `textStyles` snapshot'а по имени (`Medium 13`, `Regular 12`, и т.д.).
    - Применяй: `await node.setRangeTextStyleIdAsync(0, len, style.id)`.
    - Color текста → бинд к `text/*` semantic variable.

## Этап 6 — Audit (use_figma, 30 сек)

23. Пройдись по всему фрейму, найди любое значение padding/gap/cornerRadius **вне** разрешённой шкалы. Snap к ближайшему по таблице, перепривяжи к variable.
24. Сделай `get_screenshot` финального фрейма для подтверждения дизайнеру.

---

# Обновление snapshot

Если дизайнер добавил/изменил компоненты в Figma — нужно обновить `design-system/figma-library-snapshot.json`.

Запусти `use_figma` со скриптом из `design-system/HOW_TO_REFRESH_SNAPSHOT.md` (если есть) или используй код из истории сессии `2026-05-14`. Сохрани результат в JSON.

---

# Запреты при генерации экрана

- ❌ Не выдумывать значения spacing/radius. **Только из шкалы.** Если в макете встретилось 20 — это ошибка, snap к 16 или 24.
- ❌ Не использовать inline `letterSpacing: "-0.13px"` после биндинга — text style уже это содержит.
- ❌ Не рисовать «свою» версию лого, ChevronDown, аватара и т.д. — есть инстансы в либе, бери их.
- ❌ Не подключать `shadcn`, `radix`, `mui` — экран должен быть собран на токенах и Figma-инстансах.
- ❌ Не использовать `font-bold` (700) — в нашей либе максимум `Semi Bold` для `Semibold 32`. Всё остальное — `Medium` (500) или `Regular` (400).
- ❌ Не использовать коллекции `Light Theme` / `Dark Theme` из Figma — они deprecated. Только `Primitives` (для spacing/radius/raw colors) и `Semantic` (для UI).
