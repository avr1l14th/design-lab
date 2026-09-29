# Снипеты Plugin API для доки

Все через `use_figma` со `skillNames: "resource:figma-use"`. Страница выбирается один раз за вызов: `await figma.setCurrentPageAsync(page)`. Перед `characters` — `loadFontAsync` для каждого сегмента.

```js
const get = async (id) => {
  const n = await figma.getNodeByIdAsync(id);
  if (!n || n.type !== "TEXT") throw new Error("not text " + id);
  for (const s of n.getStyledTextSegments(["fontName"])) await figma.loadFontAsync(s.fontName);
  return n;
};
```

## Клон эталонного фрейма

```js
const page = figma.root.children.find(p => p.name === "WIP Теги");
await figma.setCurrentPageAsync(page);
const src = await figma.getNodeByIdAsync("47347:190");
const clone = src.clone();
const target = figma.root.children.find(p => p.name === "WIP <Фича>"); // если другая страница — отдельный вызов
const section = figma.createSection();
section.name = "<Фича> — документация";
section.x = 0; section.y = <свободное место>;
section.resizeWithoutConstraints(2280, clone.height + 200);
section.appendChild(clone); clone.x = 100; clone.y = 100;
```

Заголовок — TEXT `Title` в `Header`, `Origin` — «Mymeet.ai design guides».

## Описание списком со ссылками

```js
const desc = await get(DESC_ID);
desc.characters = items.join("\n");
const len = desc.characters.length;
desc.setRangeListOptions(0, len, { type: "ORDERED" });
desc.setRangeHyperlink(0, len, null);
desc.setRangeTextDecoration(0, len, "NONE");
for (const url of [proto, code]) {
  const i = desc.characters.indexOf(url);
  desc.setRangeHyperlink(i, i + url.length, { type: "URL", value: url });
  desc.setRangeTextDecoration(i, i + url.length, "UNDERLINE");
}
```

Точечная замена без потери форматирования: `deleteCharacters(i, j)` + `insertCharacters(i, text, "AFTER")`.

## Строка таблицы

```js
const table = await figma.getNodeByIdAsync(TABLE_ID);
const rows = table.children.filter(c => c.name === "Row");
const clone = rows[rows.length - 1].clone();
table.insertChild(table.children.indexOf(rows[rows.length - 1]) + 1, clone);
const texts = clone.findAll(n => n.type === "TEXT"); // [терм, RUS, ENG] или [состояние]
```

Таблица состояний: `Row` → `children[0]` ячейка текста, `children[1]` ячейка дизайна (auto-layout VERTICAL, padding 24). Скрин кладется `cell.insertChild(0, node)`, `layoutPositioning = "AUTO"`.

## Найти элементы на экране для фрагмента

```js
const rel = (n, root) => ({
  x: Math.round(n.absoluteBoundingBox.x - root.absoluteBoundingBox.x),
  y: Math.round(n.absoluteBoundingBox.y - root.absoluteBoundingBox.y),
  w: Math.round(n.width), h: Math.round(n.height),
});
screen.findAll(n => n.name === "MeetingRow");            // строки списка
screen.findAll(n => /^Frame 20856650(43|44)$/.test(n.name)); // поповеры из DS
screen.findAll(n => n.name === "MeetingInfo");           // шапка страницы встречи
```

Имена в захвате = имена React-компонентов и DS-фреймов, проверять `get_metadata`.

## Фрагмент вокруг элемента

```js
const [x, y, w, h] = region;                 // относительно экрана 1512×982
const crop = figma.createFrame();
crop.name = screen.name + " — фрагмент";
crop.resize(w, h);
crop.clipsContent = true;
crop.fills = [{ type: "SOLID", color: { r: 1, g: 1, b: 1 } }];
crop.strokes = [{ type: "SOLID", color: { r: 0.937, g: 0.937, b: 0.937 } }];
crop.strokeWeight = 1; crop.strokeAlign = "INSIDE";
const clone = screen.clone();
crop.appendChild(clone); clone.x = -x; clone.y = -y;
cell.insertChild(0, crop); screen.remove();
```

Вернуть полный экран из фрагмента: `cell.insertChild(idx, crop.children[0]); screen.x = 24; screen.y = 24; crop.remove()`.

## Модалка на затемненном экране

```js
const dim = figma.createRectangle();
dim.name = "Backdrop";
dim.resize(screen.width, screen.height);
dim.fills = [{ type: "SOLID", color: { r: 33/255, g: 40/255, b: 51/255 }, opacity: 0.3 }];
screen.appendChild(dim);
dim.layoutPositioning = "ABSOLUTE";       // после appendChild, иначе встанет в поток
dim.constraints = { horizontal: "STRETCH", vertical: "STRETCH" };
dim.x = 0; dim.y = 0;
modal.layoutPositioning = "ABSOLUTE";
modal.x = 24 + Math.round((screen.width - modal.width) / 2);
modal.y = 24 + Math.round((screen.height - modal.height) / 2);
cell.appendChild(modal);
```

## Подогнать секцию

```js
const frame = await figma.getNodeByIdAsync(DOC_FRAME_ID);
const section = await figma.getNodeByIdAsync(SECTION_ID);
section.resizeWithoutConstraints(section.width, frame.y + frame.height + 100);
```

## Прочитать всю доку для ревью

```js
const rows = states.children.filter(c => c.name === "Row").map(r => ({
  id: r.id,
  text: (r.children[0].findOne(n => n.type === "TEXT") || {}).characters,
  screens: r.children[1].children.map(c => c.name + " " + Math.round(c.width) + "x" + Math.round(c.height)),
}));
```

## Грабли

- `get_metadata` на весь док не влезает в лимит — читать по узлам или через `use_figma`.
- Захват через `generate_figma_design` с `nodeId` иногда кладет фрейм на страницу — проверять `parent`.
- Клон фрейма с тысячами узлов работает, но один вызов на 13 строк — норм; больше не паковать.
- `figma.notify` не работает, вывод только через `return`.
