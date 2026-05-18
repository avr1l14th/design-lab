# Skill «mymeet-design» — генерация чего угодно в дизайне mymeet.ai

> Документ для шеринга члену команды (сейлзу / маркетологу / дизайнеру / продакту).

---

## Что это

`mymeet-design` — это один универсальный **Claude Code skill** для проекта design-lab. Когда ты пишешь Claude «сделай в нашем дизайне X», он автоматически:

1. Понимает что ты хочешь — UI-экран, документ, презентацию, email или лендинг
2. Применяет дизайн-токены и правила mymeet.ai (typography, colors, spacing, philosophy)
3. Использует библиотеку Figma-компонентов где это уместно
4. Выдаёт готовый артефакт — HTML/Next.js страницу, Figma фрейм, PDF или email-шаблон

**Все артефакты выглядят родными друг другу** — потому что используют одни и те же tokens и философию.

---

## Какие типы артефактов поддерживаются

| Кейс | Кто пользуется | Output |
|---|---|---|
| **UI экран / прототип** | Дизайнеры, продакты | Next.js страница в `app/<slug>/` + опционально Figma фрейм с инстансами либы |
| **Документ** (кейсбук, отчёт, гайд, playbook) | Сейлзы, маркетинг, продукт | HTML страница с print-CSS → Cmd+P → PDF |
| **Презентация** (КП, pitch deck, sales deck) | Сейлзы, founders | Figma Slides файл с инстансами либы (или PPTX) |
| **Email** (рассылка, transactional letter) | Маркетинг, продукт | HTML email table-based (Gmail/Outlook compat) |
| **Landing page** (фича-страница, сегмент) | Маркетинг | Next.js страница в `app/landing-<slug>/` |

---

## Что нужно поставить (один раз, ~15 минут)

### 1. Claude Code (CLI от Anthropic)
```bash
curl -fsSL https://claude.ai/install.sh | bash
```
Запусти `claude`, залогинься через браузер.

### 2. Figma Desktop App
Скачай: https://www.figma.com/downloads/. Залогинься в свой аккаунт. Убедись что есть доступ к команде **mymeet.ai** в Figma.

### 3. Подключи Figma MCP к Claude
```bash
claude mcp add figma
```

### 4. Склонируй design-lab
```bash
cd ~/Claude
git clone https://github.com/avr1l14th/design-lab.git
cd design-lab
npm install
```
Если нет push-доступа — попроси Фёдора добавить тебя в коллабораторы.

### 5. Запусти Claude в этой папке
```bash
cd ~/Claude/design-lab
claude
```

Проверь что skill подгружен — введи `/skills` или начни печатать `/mymeet-` — должна появиться подсказка `/mymeet-design`.

---

## Как пользоваться

### Через слеш-команду (надёжно)

```
/mymeet-design сделай экран настроек профиля
/mymeet-design обнови этот кейсбук под mymeet   [прикрепи PDF]
/mymeet-design собери КП для клиента про X в нашем стиле
/mymeet-design сделай рассылку про новую фичу транскриптов
/mymeet-design свёрстай лендинг для сегмента enterprise
```

### Без слеша (auto-invoke по фразе)

Skill активируется автоматически если в запросе есть «в нашем дизайне», «mymeet», «прототип», «кейсбук», «КП», «презентация», «рассылка», «лендинг»:

```
Сделай в нашем дизайне экран настроек профиля.
Обнови этот кейсбук под mymeet.
Сделай рассылку про новую фичу транскриптов.
```

Если auto-invoke не сработал (Claude пошёл вёрстать «по своему») — пиши явно через `/mymeet-design`.

---

## Что Claude сделает по skill'у

1. **Контекст** — прочитает `design-system/DESIGN_SYSTEM.md` (правила + токены) и `design-system/figma-library-snapshot.json` (реестр Figma-компонентов).
2. **Detection** — определит тип артефакта по запросу (UI / документ / презентация / email / лендинг).
3. **Generation** — сгенерит artifact с тем же:
   - Типографикой (Inter Medium 13 как UI body, Medium 24 для headings, Semibold 32 для hero numbers)
   - Цветами (action/primary brand blue, text/primary, surface/page, и т.д. из токенов)
   - Spacing (только 0,2,4,6,8,12,16,24,32,40,64,80)
   - Иконками (filled heroicons, не stroke)
   - Tone of voice (деловой живой, без «Вы» с большой)
4. **Output** — путь к локальному preview, финальный артефакт (HTML/Figma URL/файл), скриншот, summary.

---

## Если что-то не так

| Проблема | Что делать |
|---|---|
| Skill не активировался — Claude генерит без skill workflow | Вызови явно через `/mymeet-design` |
| Skill не в списке `/skills` | Перезапусти Claude Code (`/exit` + `claude`) |
| Нет нужного компонента в либе (Claude сам скажет) | Передай задачу Фёдору добавить, либо разреши Claude сделать custom-вариант |
| Дизайнер обновил либу — нужно подхватить новые компоненты | `обнови snapshot` — Claude запустит skill `/refresh-figma-snapshot` |
| Что-то не в стиле mymeet (например stroke иконки, transition анимации, sidebar 240 вместо 280) | Попроси Claude поправить с указанием конкретного правила. Skill знает все hard rules из Design philosophy. |

---

## Где живут актуальные правила

- **Skill (что Claude читает)**: `.claude/skills/mymeet-design/SKILL.md`
- **Дизайн-правила**: `design-system/DESIGN_SYSTEM.md`
- **Реестр Figma-компонентов** (обновляется через `/refresh-figma-snapshot`): `design-system/figma-library-snapshot.json`
- **Figma file** (mymeet.ai library): `Ma7dtZb6eSHJ5YoaiVEUn2`
- **GitHub**: https://github.com/avr1l14th/design-lab

Если что-то непонятно — открой `SKILL.md`, там полная процедура с примерами и common pitfalls.

---

## Примеры реальных запросов

### Сейлзу
```
/mymeet-design обнови этот кейсбук конкурентов в нашем дизайне
[прикрепляет PDF]
```
Skill: читает PDF, извлекает структуру (cover, разделы, сравнительные таблицы, цитаты), генерит HTML страницу с теми же mymeet-цветами и типографикой. Сейлз открывает в браузере → Cmd+P → Save as PDF → готовый кейсбук в стиле компании.

### Маркетингу
```
/mymeet-design сделай welcome-email для новых пользователей —
приветствие, 3 главные фичи с иконками, CTA «Создать первую встречу»
```
Skill: HTML письмо table-based с Logo Mark сверху, секции через `<table>`, brand color только в CTA-кнопке. Можно копировать прямо в Sendgrid/Mailchimp.

### Дизайнеру (или продакту)
```
Сделай в нашем дизайне экран статистики встреч с метриками и графиком активности
```
Skill: создаёт `app/meeting-stats/page.tsx` с SidebarItem, MetricCard, графиком, MeetingListItem. Запускает dev preview, делает скриншот. Опционально экспортирует в Figma с инстансами либы.

### Sales lead / founder
```
/mymeet-design собери КП для энтерпрайз-клиента про интеграции и безопасность —
обложка, проблема, наше решение, кейсы, цена, контакты
```
Skill: Figma Slides файл с 8-12 слайдами в 16:9, каждый с правильной типографикой и компонентами либы. Можно дальше править руками в Figma.
