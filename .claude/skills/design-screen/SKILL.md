---
name: design-screen
description: End-to-end generation of a UI screen in the mymeet.ai design system. Use this when the user asks to make a screen in our design system or in mymeet style — phrases like сделай в нашем дизайне экран, сгенерируй экран в стиле mymeet, сделай прототип, make a dashboard for X, make a screen of X in mymeet style. The skill prototypes the screen on localhost (Next.js 16 with Tailwind 4) then optionally exports it back to Figma with library component instances and bound text styles plus spacing radius and color variables.
---

# Design Screen — mymeet.ai

End-to-end procedure for turning a designer's verbal request («сделай в нашем дизайне экран X») into a working Next.js prototype on localhost AND a clean Figma frame with library component instances.

---

## When to invoke

Activate this skill when the user requests a NEW UI screen and explicitly mentions our design system / mymeet style. Typical triggers:

- «Сделай в нашем дизайне экран X / Make a screen X in mymeet style»
- «Сгенерируй прототип X / Generate prototype X»
- «Сделай дашборд / онбординг / форму X»
- «Make me a meeting stats / search / settings / etc screen»

Do NOT invoke for:
- Edits to an existing screen (user names a specific `/app/<slug>` path)
- Pure Figma work without code (use `figma-use` skill instead, if available)
- Generic React questions

If trigger is ambiguous, ask one clarifying question, then proceed.

---

## Prerequisites (must read before generating)

1. **`design-system/DESIGN_SYSTEM.md`** — full design rules, token object, typography table, spacing/radius scales, allowed component patterns, layout templates.
2. **`design-system/figma-library-snapshot.json`** — registry of every Figma component (with `componentKey`, variants, text-layer names), text styles, and variables. This is the **source of truth** for component names, sizes, and variant options.

If `figma-library-snapshot.json` is older than ~2 weeks, suggest refreshing via `/refresh-figma-snapshot` skill before continuing.

---

## The six-stage procedure

### Stage 1 — Context gathering (5 min)

1. Read `design-system/DESIGN_SYSTEM.md` end-to-end.
2. Open `design-system/figma-library-snapshot.json`. Identify which library components will be used for this screen. Note their `name` and `key`.
3. If a needed component is missing from the snapshot:
   - Tell the designer: «X отсутствует в либе. Сделать кастом-вариант или сначала добавишь компонент в Figma?»
   - If user says "custom" — use inline pattern from DESIGN_SYSTEM.md.
   - If user says "added it" — refresh snapshot first.

### Stage 2 — Localhost prototype (15–30 min)

4. Create `app/<slug>/page.tsx`. Use `"use client"` for any interactive screen.
5. Copy the `tokens` object from DESIGN_SYSTEM.md into the file. Use **only** these colors — never raw hex.
6. Implement components as React functions with names **1-to-1** matching the Figma library:
   - `SidebarItem`, `TabSegmented`, `MeetingListItem`, `Logo`, `Button`, `Input`, `Checkbox`, `Tooltip`, `Avatar/Default` (use `Avatar` in code), etc.
   - For variant props use camelCase mirroring Figma's variant property names: `state="active"`, `type="full"`, `size="m"`.
7. Use **only** allowed scale values:
   - **Spacing**: `0, 2, 4, 6, 8, 12, 16, 24, 32, 40, 64, 80`
   - **Radius**: `0, 1, 2, 3, 4, full (9999)`
   - **Font sizes**: only those in `textStyles` array of the snapshot (`10, 12, 13, 14, 16, 20, 24, 32`)
   - If a Figma reference shows a value outside this set, snap to the nearest allowed per the table in DESIGN_SYSTEM.md.
8. Register the prototype in `prototypes-registry.ts`:
   ```ts
   {
     slug: "<your-slug>",
     title: "Русский заголовок",
     description: "Что это",
     tags: ["dashboard" | "form" | "modal" | ...],
     updatedAt: "YYYY-MM-DD",
   }
   ```
9. Start the dev server via `mcp__Claude_Preview__preview_start` (server name `design-lab`).
10. Navigate to `/<slug>` via `preview_eval('location.assign("/<slug>")')`. Take `preview_screenshot`. Verify visually.
11. Iterate on bugs — `Edit` + reload + screenshot. Aim for clean console (`preview_console_logs level: "error"`).

### Stage 3 — Figma capture (1 min, optional)

If the user asks to export OR you proactively want a pixel reference:

12. Call `mcp__figma__generate_figma_design` with no params — receive options listing.
13. Call again with `outputMode: "existingFile"` and `fileKey: "Ma7dtZb6eSHJ5YoaiVEUn2"` — receive `captureId`.
14. Make sure `app/layout.tsx` includes the capture script in dev mode (it should — see the layout file). If missing, add:
    ```tsx
    {process.env.NODE_ENV !== "production" && (
      <script src="https://mcp.figma.com/mcp/html-to-design/capture.js" async />
    )}
    ```
15. Open the page with capture hash via Bash:
    ```
    open "http://localhost:3000/<slug>#figmacapture=<captureId>&figmaendpoint=https%3A%2F%2Fmcp.figma.com%2Fmcp%2Fcapture%2F<captureId>%2Fsubmit&figmadelay=2000"
    ```
16. Poll `mcp__figma__generate_figma_design` with the same `captureId` every 5–8s until status is `completed`. Server returns a Figma URL.

This gives a pixel-perfect FLAT frame in Figma. Useful as visual reference but not enough on its own — proceed to Stage 4.

### Stage 4 — Instance-based Figma frame (5–15 min)

This is the main value-add. Build a parallel frame using **real library component instances**.

17. Call `mcp__figma__use_figma` with the file key. In the script:
    - Load all pages: `for (const p of figma.root.children) await p.loadAsync();`
    - Load required fonts: `await figma.loadFontAsync({family:"Inter", style:"Regular"})` (and `Medium`, `Semi Bold` if needed)
    - For each library component you need, look up `key` in snapshot and import:
      ```js
      const set = await figma.importComponentSetByKeyAsync("<key>");
      // or for non-set:
      const comp = await figma.importComponentByKeyAsync("<key>");
      ```
    - For a component set, find the variant: `set.children.find(c => c.name === "State=Active")` or use `set.defaultVariant`.
    - Create an instance: `const inst = variant.createInstance();`
18. Build the layout using `figma.createFrame()` for non-library wrappers, with `layoutMode`, `itemSpacing`, `padding*`, `cornerRadius`. Use only allowed scale values from Stage 2 step 7.
19. For each instance — set text overrides:
    ```js
    const titleNode = inst.findOne(n => n.type === "TEXT" && n.characters === "Title");
    if (titleNode) {
      await figma.loadFontAsync(titleNode.fontName);
      titleNode.characters = "<real title>";
    }
    ```
    Text-layer names are listed in `textLayers` field of each component in the snapshot.
20. **Position the frame** to the right of any existing capture (so designer can compare):
    ```js
    const captureNode = await figma.getNodeByIdAsync("<captureId from Stage 3>");
    root.x = captureNode ? captureNode.x + captureNode.width + 200 : 0;
    root.y = captureNode ? captureNode.y : 0;
    ```
21. Set current page to where the capture lives, return rootId.

### Stage 5 — Token binding (2 min)

Walk every non-instance node and bind to library tokens. Critical for the frame to react to future library updates.

22. In a fresh `mcp__figma__use_figma` call:
    - Load all variables: `const vars = await figma.variables.getLocalVariablesAsync();`
    - Load all text styles: `const styles = await figma.getLocalTextStylesAsync();`
    - Build lookups: `const v = name => vars.find(x => x.name === name); const s = name => styles.find(x => x.name === name);`
    - Walk frame recursively, **skip INSTANCE children** (they're styled by the master).
23. For each FRAME / RECTANGLE / COMPONENT:
    - Bind paddings: for each of `paddingTop/Bottom/Left/Right/itemSpacing` — `n.setBoundVariable(field, v("spacing/<N>"))`
    - Bind corner radius: 4 corners independently — `n.setBoundVariable("topLeftRadius", v("radius/<N>"))` etc.
    - Bind fills:
      ```js
      n.fills = n.fills.map(p => p.type === "SOLID"
        ? figma.variables.setBoundVariableForPaint(p, "color", v(colorMap[hex(p.color)]))
        : p);
      ```
    - Bind strokes similarly.
24. For each TEXT:
    - Resolve text style by `fontSize + fontName.style` (e.g. `13 + Medium` → `Medium 13`).
    - Apply: `await text.setRangeTextStyleIdAsync(0, text.characters.length, style.id);`
    - Bind text fill color to a `text/*` semantic variable.

### Color mapping (hex → semantic variable)

Use these by default. Override only with strong reason.

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
| `#FF0000` | `color/red/500` | — | — |

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

### Stage 6 — Audit + finalize (1 min)

25. Walk frame again, find any padding/gap/cornerRadius value NOT in allowed set. Snap to nearest, rebind to variable. Report fix count to user.
26. Call `mcp__figma__get_screenshot` of the final frame at `maxDimension: 1280`, `enableBase64Response: true`. Show to user.
27. Summarize what was created:
    - localhost URL: `http://localhost:3000/<slug>`
    - Figma URL: `https://www.figma.com/design/Ma7dtZb6eSHJ5YoaiVEUn2?node-id=<rootId>`
    - Components used (count of instances per library component)
    - Tokens bound (counts: text styles applied, fills bound, paddings bound, radii bound)

---

## Hard rules — do not break

- ❌ **Never** invent spacing or radius values. If reference shows `20`, replace with `16` or `24`. If `36`, replace with `32` or `40`. Snap table in DESIGN_SYSTEM.md.
- ❌ **Never** draw a custom logo, chevron, avatar, X-icon, plus-icon — they are in the library (see `Icons/*`, `Logo`, `Avatar/*` in snapshot). Always use instances.
- ❌ **Never** apply inline `letterSpacing` after Stage 5 — the text style already contains it.
- ❌ **Never** add `shadcn`, `radix`, `mui`, `chakra` or any other UI lib. The DS is self-contained.
- ❌ **Never** use `font-bold` (700), `font-extrabold`, `font-light` — only `Regular` (400), `Medium` (500), or `Semi Bold` (600 for size 32 only).
- ❌ **Never** use `Light Theme` or `Dark Theme` variable collections — they are deprecated. Bind to `Primitives` (raw colors, spacing, radius) or `Semantic` (text/*, surface/*, border/*, icon/*, action/*).
- ❌ **Never** create new pages in Figma without confirming. Always export to existing file `Ma7dtZb6eSHJ5YoaiVEUn2`.

---

## Common pitfalls and fixes

### "Block comment closed early in page.tsx"
Avoid `*/16`, `*/24` etc. inside block comments — that closes the comment. Use HTML entity `&lt;Provider&gt;/16` or rephrase.

### "captureForDesign promise never resolves"
The capture script must be in the HEAD of the page when it loads. Check `app/layout.tsx` has the dev-only `<script src=".../capture.js">`. If missing, add it, restart dev, retry.

### "use_figma SyntaxError"
- All arrow functions that use `await` must be `async`. `const fn = async () => { ... }`.
- `??` (nullish coalescing) may not be supported in the Figma plugin runtime — use `||` or explicit checks.

### "Tab/Segmented has only 3 fixed labels (Tab 1, Tab 2, Tab 3) and Tab 1 is always active"
This is the current library limitation. Map your active option to `Tab 1`. If user wants Tab 2 active, edit the library compositing in Figma or pre-set component property override (currently not parametric).

### "SidebarItem width is 255 but my sidebar is 240"
Set `inst.layoutAlign = "STRETCH"` so it fills the parent. Or pad the parent so internal width is 255.

### "MeetingListItem has TWO 'Label' text layers (email + source)"
Use `inst.findAll(n => n.type === "TEXT" && n.name === "Label")` — `[0]` is email, `[1]` is source.

### "Variable binding doesn't show in inspector"
`setBoundVariable` requires the variable to be available in the file (it's local to mymeet.ai library file). For cross-file usage from another Figma file, `importVariableByKeyAsync` first.

### "Build fails: ReferenceError: <ComponentName> is not defined"
After renaming a React component, search for ALL usages with `grep -n "<old-name>"` and update.

---

## Example: prior session (meeting-stats screen, 2026-05-14)

Reference outcome: `https://www.figma.com/design/Ma7dtZb6eSHJ5YoaiVEUn2?node-id=32874-45581`

- 9× `SidebarItem` (4 primary nav with `State=Active`/`Inactive`, 5 secondary)
- 1× `Tab/Segmented` (labels: 30 дней / 7 дней / 90 дней)
- 5× `MeetingListItem` (`State=default`, with title/time/duration/email/source overrides)
- 4× `Integrations/{GoogleMeet, Zoom, Telemost, Teams}/16`
- 1× `Logo` (`Type=Full`) in sidebar header
- Custom (non-library) frames: 4 MetricCard, Activity chart, Sources progress card, Recent meetings card
- After Stage 5: 51 text styled, 52 text fills bound, 333 paddings bound, 84 corner radii bound, 16 frame fills bound, 10 strokes bound

This is the standard output volume for one medium-complexity dashboard.

---

## Output format expected

When done, give the user:
1. Localhost URL
2. Figma URL (instance-based frame node-id)
3. Compact table: components used, tokens bound
4. Screenshot of the Figma frame
5. Note about any custom (non-library) elements and why
