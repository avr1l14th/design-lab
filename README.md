# Design Lab

Живые интерактивные прототипы дизайнов. Собираются из Figma-макетов, хостятся на GitHub Pages.

## Live

После настройки: `https://<твой-github-username>.github.io/design-lab/`

## Стек

- Next.js 16 (App Router, static export)
- TypeScript
- Tailwind CSS
- Framer Motion — для анимаций и интеракций

## Запуск локально

```bash
npm install     # один раз, при первом клоне
npm run dev     # запустит http://localhost:3000
```

## Как добавить новый прототип

> Подключаешься к репо впервые? Сначала пройди [CONTRIBUTING.md](./CONTRIBUTING.md).

1. Создай папку `app/my-feature/page.tsx` — это и есть прототип, URL будет `/my-feature`.
2. Добавь запись в `prototypes-registry.ts`, чтобы он появился на главной:

```ts
{
  slug: "my-feature",
  title: "My feature",
  description: "Что тут происходит",
  tags: ["motion"],
  updatedAt: "2026-04-23",
},
```

3. `git add . && git commit -m "add my-feature prototype" && git push` — через пару минут обновится на GitHub Pages.

## Деплой

Автоматически через GitHub Action (`.github/workflows/deploy.yml`):
- Любой push в `main` → билд → публикация на GitHub Pages.
- Прогресс деплоя виден во вкладке **Actions** репозитория.

## Первая настройка (делается один раз)

1. Создай **публичный** репозиторий на github.com с названием `design-lab` (без README/gitignore — они уже есть локально).
2. Подключи его к локальной папке:
   ```bash
   cd ~/Claude/design-lab
   git remote add origin https://github.com/<твой-username>/design-lab.git
   git branch -M main
   git push -u origin main
   ```
3. На github.com → **Settings** → **Pages** → в разделе "Build and deployment" выбери **Source: GitHub Actions**.
4. Дождись окончания Action во вкладке **Actions**. Ссылка появится там же.

## Handoff разрабам

Каждый прототип изолирован в своей папке `app/<slug>/`. Код Framer Motion анимаций и React-компонентов можно копировать в прод без изменений — стек совпадает.
