# Дизайн-система mymeet.ai — правила для Claude

> **Этот файл — единственный источник истины при генерации UI в design-lab.**
> Перед любой версткой Claude обязан прочитать его целиком и следовать правилам ниже.
> Когда нужно значение, которого здесь нет — Claude просит дизайнера выделить эталонный фрейм в Figma desktop app и читает его через `mcp__figma__get_design_context`.

**Источники:**
- Figma library: `mymeet.ai` (libraryKey `lk-b75b74abde4928fbe977e65ee9a7750188d46f83273822cd48ec71e06b47a48957be656c392783cbf775c7010f0bd874b8c2e5ebbaa33effc066ff1de3d717d0`)
- Figma file: `Ma7dtZb6eSHJ5YoaiVEUn2`
- Эталонные прототипы в этом репо: `app/search-filters`, `app/onboarding-mymeet`, `app/multi-file-upload`

---

## 1. Цвета (токены)

Палитра вытащена из работающих прототипов mymeet.ai. **Никогда не использовать произвольные hex'ы — только из этого списка.**

```ts
// Скопируй этот объект в начало page.tsx нового экрана
const tokens = {
  // Brand — полная шкала с состояниями primary кнопки
  blue:         "#0138C7",  // primary action (default)
  blueHover:    "#0032B1",  // primary hover
  bluePressed:  "#002C9C",  // primary pressed/active
  blueDisabled: "#809BE3",  // primary disabled
  blueSea:      "#E4ECFA",  // primary subtle / range fill / progress trough
  blueLightest: "#F6F8FE",  // мега-subtle (hover-tint на blue-subtle блоках)

  // Secondary action — серая кнопка
  actionSecondary:         "#EFEFEF",  // secondary default (= grey/200)
  actionSecondaryHover:    "#DDDEDF",  // secondary hover (= grey/300)
  actionSecondaryPressed:  "#C7C8CA",  // secondary pressed (= grey/400)
  actionSecondaryDisabled: "#F7F7F8",  // secondary disabled (= grey/100)

  // Text
  black:        "#212833",  // главный текст (заголовки, основной) — text/primary
  grey:         "#818AA3",  // вторичный текст — text/secondary
  greyHover:    "#585E6C",  // hover на secondary тексте/иконке — text/secondary-hover, icon/secondary-hover
  greyTertiary: "#585E6C",  // text/tertiary — третий уровень иерархии (helper text, метаданные)
  greyDisabled: "#C7C8CA",  // text/disabled (для задизейбленных элементов) и text/placeholder (для пустых инпутов)
  white:        "#FFFFFF",  // текст на blue, dark surfaces

  // Surfaces
  bgPage:      "#ffffff",  // основной фон страницы — surface/page
  bgSubtle:    "#f7f7f8",  // hover-фон, лёгкая подсветка контейнера — surface/subtle
  bgInfo:      "#F6F8FE",  // info banner (support popover, callout'ы) — surface/info
  backdrop:    "rgba(33, 40, 51, 0.4)", // затемнение за модалкой (slate/900 40%)

  // Borders & dividers (только 2 уровня в mymeet.ai)
  border:       "#EFEFEF",  // дефолтные бордеры карточек, дивайдеры строк — border/default
  borderStrong: "#DDDEDF",  // посильнее, выделенные бордеры — border/strong

  // Semantic
  red:         "#CC3333",  // error / destructive action ("Отключить")
  green:       "#0D9655",  // success

  // Accent / категориальные (для иконок отчётов, аватаров, иллюстраций — НЕ для UI-ролей)
  purple:      "#8A38F5",  // research, исследование
  orange:      "#FF9E2C",  // статьи, accent категории
  yellow:      "#F2C300",  // конспекты, accent категории
  teal:        "#0DACAA",  // медицина, изумрудно-бирюзовые категории
} as const;
```

**ВАЖНО — у mymeet.ai нет dark mode.** Только light theme. Не используй классы Tailwind `dark:*` и не пиши логику переключения тем — это вне DS.

**Про accent-цвета:** `purple`, `orange`, `yellow`, `teal` применяются **только** для:
- Иконок категорий (отчёты, проекты, теги)
- Аватаров пользователей (initials backgrounds)
- Иллюстраций / графиков

**Никогда** не используй их для UI-ролей: кнопок, текста, фонов, бордеров. Для этого есть `blue` (primary), `red` (error), `green` (success), `grey/black/white` (нейтральные).

**Использование:**
- Inline через `style={{ color: tokens.black }}` — это паттерн команды (см. search-filters).
- Tailwind utility-классы — только для bg/border/text где значение совпадает (`bg-white`, `text-white`).
- `#FFFFFF` и `#0a0a0a` (текущие `--background`/`--foreground` в `globals.css`) — это дефолты Next.js, они НЕ являются токенами. Использовать `tokens.bgPage`/`tokens.black`.

---

## 2. Typography

**Шрифт:** Inter (Google Fonts, subsets `latin` + `cyrillic`). Подключён в `app/layout.tsx` как `--font-inter`.

**Реальные text styles в Figma (имена `Weight Size`):**

| Имя в Figma     | size | weight        | letter-spacing | line-height | Где применять |
|-----------------|------|---------------|----------------|-------------|---------------|
| `Semibold 32`   | 32   | 600 semibold  | -0.96          | normal      | H1 — большие заголовки экранов |
| `Medium 24`     | 24   | 500 medium    | -0.72          | normal      | H2 — заголовки секций, page header |
| `Medium 16`     | 16   | 500 medium    | -0.32          | normal      | заголовки внутри карточек |
| `Regular 16`    | 16   | 400 regular   | -0.32          | normal      | крупный текст параграфов |
| `Medium 14`     | 14   | 500 medium    | -0.28          | 1.35        | акценты в основном тексте |
| `Regular 14`    | 14   | 400 regular   | -0.28          | 1.35        | основной текст параграфов |
| `Medium 13`     | 13   | 500 medium    | -0.13          | normal      | **главный UI стиль** — sidebar, кнопки, заголовки в строках |
| `Regular 13`    | 13   | 400 regular   | -0.13          | normal      | обычный UI-текст в строках |
| `Medium 12`     | 12   | 500 medium    | -0.24          | normal      | выделения в подписях |
| `Regular 12`    | 12   | 400 regular   | -0.24          | normal      | метаданные, время, секондари инфо |
| `Medium 10`     | 10   | 500 medium    | -0.20          | normal      | бейджи, статусы |
| `Regular 10`    | 10   | 400 regular   | -0.20          | normal      | мелкие подписи |
| `Regular 8`     | 8    | 400 regular   | -0.16          | normal      | tooltip / минимально читаемый текст |

**Правила:**
- Веса по умолчанию `400` (regular) и `500` (medium). **`600` (semibold) разрешён только для H1 32px** — это исключение для оптического баланса крупного текста.
- Letter-spacing всегда отрицательный, формула приближённо `letter-spacing ≈ -(size × 0.02)px`. В Figma text styles он не зашит — применяется в коде inline через `letterSpacing: "-0.13px"` или Tailwind `tracking-[-0.13px]`.
- Line-height: только `Regular/Medium 14` имеют `1.35` (для параграфов с переносом). Остальные — `normal` (фактически ~1.2 от Figma).
- Lang attribute в `<html>` уже стоит — кириллица рендерится корректно через Inter (subset cyrillic подключён).

**Самый частый стиль: `Medium 13`** — это базовая UI-типографика mymeet.ai. Когда не уверен — используй его.

---

## 3. Spacing & размеры

**Spacing-шкала (px) — ровно то, что в Figma variables `Primitives → spacing/*`:**
```
0, 2, 4, 6, 8, 12, 16, 24, 32, 40, 64, 80
```

⚠️ **Никаких других значений для padding/gap нет.** Это не рекомендация — это **жёсткое правило**, потому что каждое значение в Figma привязано к переменной (token). Если в коде или макете встретилось `20`, `18`, `28`, `48`, `112` — это **ошибка**, замени на ближайшее из шкалы (обычно `16` или `24`).

В mymeet.ai эта шкала используется и для **отступов** (gap, padding), и для **размеров элементов** (height, width, размеры иконок).

**Snap-таблица для нестандартных значений:**
| Встретилось | Замени на |
|---|---|
| `18`, `20`, `22` | `16` (компактно) или `24` (просторно) |
| `28`, `30` | `24` или `32` |
| `36`, `38`, `44` | `32` или `40` |
| `48`, `56` | `40` или `64` |
| `96`, `112` | `80` или `64` |

**Spacing — типичное применение:**
- `gap-[4px]` / `gap-[8px]` — внутри плотных строк/инлайн-списков
- `gap-[6px]` — внутри menu row (исключение, у них так используется)
- `gap-[12px]` — между блоками в строке (метрика + значение)
- `gap-[16px]` — секции внутри блока, padding контейнера
- `gap-[24px]` — секции на странице
- `gap-[32px]` — крупные блоки между секциями
- `p-[16px]` / `p-[24px]` — padding карточек, header'а
- `p-[80px]` — padding marketing-секций / главной лаборатории

**Размеры элементов — типичное применение:**
- `8px` — микро-иконки, dot'ы
- `12px–16px` — иконки UI, чекбоксы
- `24px` — иконки навигации, аватар-минис, теги
- `32px` — высота кнопки, аватар средний (со шрифтом 13px)
- `40px` — высота большой кнопки, аватар крупный
- `64px` — thumbnail встречи (или `80x48` non-square)
- `80px` — большой аватар / hero-секция

**Высота кнопок:** строго `32px` или `40px`. `36px` запрещено (не в шкале).

---

## 4. Радиусы

**Шкала:** `0, 1, 2, 3, 4, full`. У mymeet.ai жёстко малые радиусы — никогда не используй ≥ 6px.

**Правило: радиус зависит от размера элемента** (не от его роли). Чем меньше элемент — тем меньше радиус, иначе квадрат превращается в круг.

| Размер элемента (px) | Радиус | Tailwind/CSS |
|---|---|---|
| ≤ 2   | 0  | `rounded-none` |
| 4–8   | 1  | `rounded-[1px]` |
| 12–16 | 2  | `rounded-[2px]` |
| 20–24 | 3  | `rounded-[3px]` |
| ≥ 32  | 4  | `rounded-[4px]` ← **стандарт для кнопок, инпутов, карточек, popover'ов** |

**Полные круги:** только для круглых аватаров и dot-индикаторов — `rounded-full` или `borderRadius: 9999`.

**Не используй радиус 5+ кроме `full`.** Никаких `rounded-[8px]`, `rounded-[12px]`, `rounded-[16px]`.

---

## 5. Тени

В Figma зашита как Effect Style **`shadow/default`**. Это единственная стандартная тень в DS — используется везде, где нужно elevation: dropdown panels, popover'ы, calendar, modal cards.

```ts
// В коде:
boxShadow: "0 0 4px 0 rgba(0, 0, 0, 0.16)"
// Tailwind эквивалент (приближённо):
className="shadow-[0_0_4px_0_rgba(0,0,0,0.16)]"
```

Параметры: `X: 0, Y: 0, Blur: 4, Spread: 0, Color: #000000 16%`.

Других теней пока нет. **Никаких больших Material-style elevations.** Если в макете встречается тень с другими параметрами — это либо ошибка, либо повод добавить новый named shadow в DS (спросить у дизайнера).

---

## 6. Компоненты — код-сниппеты

> Это **inline patterns**, не отдельные React-компоненты. Команда не делает абстракции преждевременно — каждая страница реализует под себя, переиспользует через copy-paste из этого файла.

### 6.0 Бренд-лого

В Figma — компонент `Logo` с variant `Type = Mark | Full`:
- **Mark** (32×32) — только круглый знак (буква «m» в синем круге). Используется в компактных контекстах: tab bar, favicon-area, mobile header.
- **Full** (~135×32) — горизонтальный wordmark (Mark + текст «mymeet.ai»). Для sidebar header, landing top-bar, footer.

В коде прототипа рисовать лого **не нужно** — это бренд-ассет. В прототипе достаточно placeholder'а, который дизайнер заменит инстансом `Logo` при экспорте в Figma:

```tsx
{/* Placeholder for Logo/Mark (32x32) */}
<div className="flex h-[32px] w-[32px] items-center justify-center rounded-full"
  style={{ backgroundColor: tokens.blue }}>
  <span className="text-[15px] font-medium text-white" style={{ letterSpacing: "-0.30px" }}>m</span>
</div>

{/* Placeholder for Logo/Full */}
<div className="flex items-center gap-[8px]">
  <div className="h-[32px] w-[32px] rounded-full" style={{ backgroundColor: tokens.blue }} />
  <span className="text-[20px] font-medium" style={{ color: tokens.black, letterSpacing: "-0.40px" }}>
    mymeet.ai
  </span>
</div>
```

Не используй `Logo/Full` где помещается только Mark — это нарушение бренд-гайдов.


### 6.1 Primary button (CTA)

```tsx
<button
  type="button"
  onClick={onClick}
  disabled={!enabled}
  className="flex h-[36px] items-center justify-center rounded-[4px] px-[10px] transition-colors"
  style={{
    backgroundColor: !enabled
      ? tokens.blueDisabled
      : isPressed
      ? tokens.bluePressed
      : isHovered
      ? tokens.blueHover
      : tokens.blue,
    cursor: enabled ? "pointer" : "not-allowed",
  }}
>
  <span className="text-[13px] font-medium text-white" style={{ letterSpacing: "-0.13px" }}>
    Применить
  </span>
</button>
```

Состояния primary-кнопки:
- **default**: `tokens.blue` (#0138C7)
- **hover**: `tokens.blueHover` (#0032B1) — чуть темнее
- **pressed/active**: `tokens.bluePressed` (#002C9C) — ещё темнее
- **disabled**: `tokens.blueDisabled` (#809BE3) — приглушённый

В Tailwind 4 hover можно через CSS: `hover:bg-[#0032B1] active:bg-[#002C9C]`.

Большая версия (onboarding CTA): `h-[40px]`, `padding: "12px 24px"`, `text-[14px]`, `letterSpacing: -0.28`.

### 6.2 Secondary button (filled серая)

```tsx
<button
  type="button"
  onClick={onClick}
  disabled={!enabled}
  className="flex h-[36px] items-center justify-center rounded-[4px] px-[10px] transition-colors"
  style={{
    backgroundColor: !enabled
      ? tokens.actionSecondaryDisabled
      : isPressed
      ? tokens.actionSecondaryPressed
      : isHovered
      ? tokens.actionSecondaryHover
      : tokens.actionSecondary,
    cursor: enabled ? "pointer" : "not-allowed",
  }}
>
  <span
    className="text-[13px] font-medium"
    style={{
      color: enabled ? tokens.black : tokens.greyDisabled,
      letterSpacing: "-0.13px",
    }}
  >
    Отмена
  </span>
</button>
```

Состояния secondary-кнопки:
- **default**: `actionSecondary` (`#EFEFEF`)
- **hover**: `actionSecondaryHover` (`#DDDEDF`) — чуть темнее
- **pressed**: `actionSecondaryPressed` (`#C7C8CA`) — ещё темнее
- **disabled**: `actionSecondaryDisabled` (`#F7F7F8`) — светлее обычного, текст `text/disabled`

Используется для: «Отмена», «Назад», «Не сохранять», «AI отчеты», «Поделиться», «Экспорт» и любых нейтральных действий не-primary важности.

### 6.3 Icon button (square 36×36)

```tsx
<button
  className="flex h-[36px] w-[36px] items-center justify-center rounded-[4px] border border-solid bg-white hover:bg-[#F7F7F8]"
  style={{ borderColor: tokens.border }}
  aria-label="Фильтры"
>
  <img src="..." alt="" className="h-[16px] w-[16px]" />
</button>
```

### 6.4 Sidebar nav item

```tsx
<div
  className="group flex w-full items-center rounded-[4px] p-[4px] transition-colors hover:bg-[#F7F7F8]"
  style={{ backgroundColor: active ? tokens.bgSubtle : "transparent" }}
>
  <div className="flex items-center gap-[8px]">
    <img
      src={icon}
      alt=""
      className="h-[16px] w-[16px] shrink-0 transition-[filter]"
      style={{
        filter: active ? "brightness(0)" : undefined,  // активный — slate/900
      }}
    />
    <span
      className="text-[13px] transition-colors"
      style={{ color: tokens.black, letterSpacing: "-0.13px" }}
    >
      {label}
    </span>
  </div>
</div>
```

**Состояния иконок sidebar:**
- **default**: `tokens.grey` (`#818AA3` = slate/500) — `icon/secondary`
- **hover**: `#585E6C` (slate/700) — `icon/secondary-hover` (темнее на ~2 ступени)
- **active**: `tokens.black` (`#212833` = slate/900) — `icon/primary`

### 6.5 Input (с focus состоянием)

```tsx
<div
  className="flex h-[36px] items-center gap-[10px] rounded-[4px] border border-solid bg-white px-[10px] transition-colors"
  style={{
    borderColor: focused ? tokens.blue : tokens.border,
  }}
>
  <img src="icon-search.svg" alt="" className="h-[16px] w-[16px]" />
  <input
    type="text"
    placeholder="Поиск по встречам"
    className="flex-1 bg-transparent text-[13px] outline-none"
    onFocus={() => setFocused(true)}
    onBlur={() => setFocused(false)}
    style={{ color: tokens.black, letterSpacing: "-0.13px" }}
  />
</div>
```

Состояния border у инпута:
- **default**: `tokens.border` (`#EFEFEF`) — лёгкий grey (semantic: `border/default`)
- **focus**: `tokens.blue` (`#0138C7`) — синий бренд (semantic: `border/focus`)
- **strong** (если нужен более выразительный border): `tokens.borderStrong` (`#DDDEDF`) — semantic: `border/strong`

**Error state** в DS пока не предусмотрен — у mymeet.ai валидация инпутов не делается через красную обводку. Если такой паттерн появится, добавим `border/error` в semantic.

### 6.6 Checkbox

```tsx
{checked ? (
  <span className="flex h-[14px] w-[14px] items-center justify-center rounded-[2px]"
        style={{ backgroundColor: tokens.blue }}>
    <img src="icon-checkbox-check.svg" alt="" className="h-[12px] w-[12px]" />
  </span>
) : (
  <span className="h-[14px] w-[14px] rounded-[2px] border border-solid"
        style={{ borderColor: tokens.border }} />
)}
```

### 6.7 Avatar (initials)

```tsx
<span
  className="flex h-[16px] w-[16px] items-center justify-center rounded-full text-[9px] font-medium text-white"
  style={{ backgroundColor: tokens.avatarBlue, letterSpacing: "-0.18px" }}
>
  {name.charAt(0)}
</span>
```

Размеры: `16` (микро в строках), `32` (стандарт в карточке пользователя). На `32` шрифт `13px`/`500`, радиус `3px`.

### 6.8 Card / контейнер

mymeet.ai не использует «карточки» с большими радиусами и тенями в продуктовом UI. Контейнеры разделяются:
- **Background-divider:** `bgSubtle` (`#f7f7f8`) для inline-блоков
- **Border:** `border` (`#dddedf`) для outline-карточек
- **Hr-divider:** `<div className="h-px w-full" style={{ backgroundColor: tokens.border }} />`

Если действительно нужна карточка-блок (например, на дашборде):
```tsx
<div className="rounded-[4px] border border-solid bg-white p-[16px]" style={{ borderColor: tokens.border }}>
  ...
</div>
```

### 6.9 Progress bar

```tsx
<div className="relative h-[6px] w-full overflow-hidden rounded-[4px]" style={{ backgroundColor: tokens.blueSea }}>
  <div className="h-full rounded-[4px]" style={{ width: `${pct}%`, backgroundColor: tokens.blue }} />
</div>
```

### 6.10 Date header / section title

```tsx
<div className="flex items-center gap-[6px] px-[24px] text-[13px]" style={{ letterSpacing: "-0.13px" }}>
  <span className="font-medium" style={{ color: tokens.black }}>Сегодня</span>
  <span className="font-normal" style={{ color: tokens.grey }}>5 встреч</span>
</div>
```

### 6.11 Destructive button («Отключить интеграцию», «Удалить»)

```tsx
<button
  className="flex h-[36px] items-center justify-center rounded-[4px] px-[16px] transition-colors hover:bg-[#EFEFEF]"
  style={{ backgroundColor: tokens.bgSubtle }}
>
  <span className="text-[13px] font-medium" style={{ color: tokens.red, letterSpacing: "-0.13px" }}>
    Отключить
  </span>
</button>
```

Используется только для деструктивных действий (отключение интеграции, удаление, отмена подписки). НЕ для error-состояний форм — там просто `borderColor: tokens.red` на самом инпуте.

**Цвета:**
- bg = `surface/subtle` (`grey/100`) — нейтральный светлый фон
- text = `text/danger` (`red/500`) — красный текст

### 6.12 Tabs с активным indicator'ом

```tsx
<div className="flex items-center gap-[16px] border-b" style={{ borderColor: tokens.border }}>
  {tabs.map((tab) => (
    <button
      key={tab.id}
      onClick={() => setActive(tab.id)}
      className="relative flex items-center gap-[6px] px-[2px] pb-[12px] pt-[8px]"
    >
      <span
        className="text-[13px] font-medium"
        style={{
          color: active === tab.id ? tokens.black : tokens.grey,
          letterSpacing: "-0.13px",
        }}
      >
        {tab.label}
      </span>
      {active === tab.id && (
        <span
          className="absolute -bottom-px left-0 right-0 h-[2px]"
          style={{ backgroundColor: tokens.blue }}
        />
      )}
    </button>
  ))}
</div>
```

Активный таб обозначается **синей полоской снизу** (используется `tokens.blue` напрямую как primitive — это `color/blue/500`). Subtle подсветка фона активного таба используется только в settings-tabs (одиночные блоки), а не в content-tabs (на странице встречи). Смотри по контексту.

### 6.13 Modal с backdrop

```tsx
{open && (
  <div
    className="fixed inset-0 z-50 flex items-center justify-center"
    style={{ backgroundColor: tokens.backdrop }}      // overlay/backdrop
    onClick={onClose}
  >
    <div
      className="relative max-w-[480px] rounded-[4px] bg-white p-[24px]"
      style={{ boxShadow: "0 0 4px 0 rgba(0,0,0,0.16)" }}
      onClick={(e) => e.stopPropagation()}
    >
      {/* содержимое */}
    </div>
  </div>
)}
```

### 6.14 Info banner (callout)

```tsx
<div
  className="flex items-start gap-[12px] rounded-[4px] p-[12px]"
  style={{ backgroundColor: tokens.bgInfo }}
>
  <img src="icon-info.svg" alt="" className="h-[16px] w-[16px] shrink-0" />
  <div className="flex flex-col gap-[2px]">
    <span className="text-[13px] font-medium" style={{ color: tokens.black, letterSpacing: "-0.13px" }}>
      Мы запустили базу знаний
    </span>
    <span className="text-[13px]" style={{ color: tokens.grey, letterSpacing: "-0.13px" }}>
      Поможет решить вопрос без ожидания ответа от поддержки.{" "}
      <a href="#" style={{ color: tokens.blue }} className="underline">Перейти</a>
    </span>
  </div>
</div>
```

---

## 7. Layout-паттерны

### 7.1 App layout (sidebar + main)

См. `app/search-filters/page.tsx`. Структура:
- `<main>` flex h-screen
- `<aside>` width `280px`, `border-r`, `border-color: border`, sticky
- `<section>` flex-1, header высотой `54px` с `border-b`
- Контент скроллится внутри `<section>` через `overflow-y-auto`

Это базовый шаблон для любого экрана продукта (встречи, отчёты, настройки, статистика).

### 7.2 Onboarding / centered flow

См. `app/onboarding-mymeet/OnboardingShell.tsx`:
- Frame width `1300px` (или `1236` для первого шага)
- Inner content `700px`
- Logo top, content centered (flex-1), progress bottom
- Mobile: padding `16px`, full-width

### 7.3 Marketing / лаборатория

См. `app/page.tsx`:
- `padding: 80px`
- Колонка `600px` слева, контент-поток

---

## 8. Анимации и motion

Команда использует **Framer Motion 12** + кастомные CSS-transitions через переменные. Стандартные easing'и:
- `cubic-bezier(0.22, 1, 0.36, 1)` — основной (slow-out)
- `cubic-bezier(0.4, 0, 1, 1)` — exit (fast-out)
- `cubic-bezier(0.23, 1, 0.32, 1)` — enter (с overshoot)

Длительности: `120ms` (мгновенные), `180–280ms` (стандартные UI), `500ms` (большие layout-shifts).

Всегда уважать `prefers-reduced-motion: reduce` (см. `globals.css` `@media`).

---

## 9. Запреты

❌ **Никогда не делай:**
- shadcn/ui, Material-UI, Chakra и любые другие готовые UI-киты — у mymeet.ai свой стиль
- Произвольные hex-цвета вне `tokens` объекта
- Шрифты тяжелее `500` для размеров < 32px (Semibold/600 разрешён только для H1)
- Радиусы `>= 5px` кроме `full` (mymeet.ai жёстко малые: 0/1/2/3/4)
- Большие drop-shadow, glow-эффекты, gradient-кнопки
- Tailwind v3 синтаксис типа `text-gray-500` (у нас Tailwind 4 + кастомные tokens, серый — `tokens.grey`)
- Готовые иконочные шрифты типа Font Awesome — иконки лежат в `public/` как SVG

✅ **Всегда делай:**
- Копируй `tokens` объект в начало каждой страницы
- Используй `style={{ color: tokens.X }}` или Tailwind utility — оба валидны
- Проверяй экран в responsive: search-filters работает с `1280px+`, onboarding адаптивный
- Соблюдай letter-spacing из таблицы typography

---

## 10. Workflow Claude при генерации нового экрана

1. **Прочитать этот файл** (`design-system/DESIGN_SYSTEM.md`).
2. **Прочитать 1-2 эталонных прототипа** (`app/search-filters/page.tsx` для app-layout, `app/onboarding-mymeet/OnboardingShell.tsx` для центрированных).
3. **Создать папку** `app/<feature-slug>/` с `page.tsx`.
4. **В начале `page.tsx`** — скопировать `tokens` объект из этого файла.
5. **Если нужна точность по конкретному компоненту из Figma**, который не описан тут:
   - Попросить дизайнера выделить эталонный фрейм в Figma desktop app.
   - Вызвать `mcp__figma__get_design_context` с `fileKey` и `nodeId` фрейма.
   - Использовать возвращаемый код как референс (адаптируя под наши tokens).
6. **Зарегистрировать прототип** в `prototypes-registry.ts`.
7. **Запустить dev-server** через `mcp__Claude_Preview__preview_start` и сделать скриншот.
8. **Опционально:** экспортировать в Figma через `mcp__figma__generate_figma_design` (захват localhost:3000/<slug>).

---

## 11. Что мне (Claude) нужно от дизайнера

Когда я не уверен в значении или компоненте — я **не угадываю**, я прошу:

> «Чтобы продолжить, открой Figma desktop, перейди в файл mymeet.ai (`Ma7dtZb6eSHJ5YoaiVEUn2`), выдели фрейм с [этим компонентом] и подтверди — я тогда прочту реальные значения через MCP.»

Это нормальная часть workflow, не блокер.
