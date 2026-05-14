---
name: refresh-figma-snapshot
description: Refresh design-system/figma-library-snapshot.json from the live mymeet.ai Figma file. Use when the designer says "обновил либу", "добавил компоненты в фигму", "обнови snapshot", "library changed", or before generating a screen if the snapshot file is more than ~2 weeks old.
---

# Refresh Figma Library Snapshot

Updates `design-system/figma-library-snapshot.json` from the live mymeet.ai Figma file. Run this whenever the designer has added, renamed, or changed components / styles / variables in the library.

## When to invoke

- User says «обновил либу», «закомпонентил X», «добавил компоненты в фигму»
- The `capturedAt` field in current snapshot is more than 2 weeks old
- A `/design-screen` invocation discovers a needed component that's missing from snapshot, but the designer claims it exists

## Procedure

The snapshot file has 3 sections that must be refreshed:
1. `components` — every Figma component / component_set
2. `textStyles` — all local text styles
3. `variableCollections` + `variables` — all variable collections and individual variables

Due to MCP response size limits (~20kb), do these in 2 separate `mcp__figma__use_figma` calls.

### Call 1 — Components only

```js
(async () => {
  for (const p of figma.root.children) await p.loadAsync();
  const all = figma.root.findAllWithCriteria({ types: ["COMPONENT_SET", "COMPONENT"] });
  const out = [];
  for (const n of all) {
    if (n.parent && n.parent.type === "COMPONENT_SET") continue; // skip variant children
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
    const walk = (m) => {
      if (m.type === "TEXT") tx.push(m.name);
      if ("children" in m) m.children.forEach(walk);
    };
    walk(target);
    if (tx.length) item.textLayers = tx;
    item.size = `${target.width}x${target.height}`;
    out.push(item);
  }
  out.sort((a, b) => a.name.localeCompare(b.name));
  return out;
})();
```

### Call 2 — Text styles + variables

```js
(async () => {
  const styles = (await figma.getLocalTextStylesAsync()).map(s => {
    const ls = s.letterSpacing;
    const lh = s.lineHeight;
    return {
      name: s.name, key: s.key,
      weight: s.fontName.style,
      size: s.fontSize,
      ls: ls.unit === "PERCENT" ? `${ls.value}%` : `${ls.value}${ls.unit === "PIXELS" ? "px" : ""}`,
      lh: lh.unit === "AUTO" ? "auto" : lh.unit === "PERCENT" ? `${Math.round(lh.value)}%` : `${lh.value}px`,
    };
  }).sort((a, b) => a.size - b.size);

  const collections = (await figma.variables.getLocalVariableCollectionsAsync()).map(c => ({
    name: c.name, key: c.key, id: c.id, modes: c.modes.map(m => m.name),
  }));
  const allVars = await figma.variables.getLocalVariablesAsync();
  const variables = allVars.map(v => {
    const col = collections.find(c => c.id === v.variableCollectionId);
    return {
      name: v.name, key: v.key, type: v.resolvedType,
      scopes: v.scopes.length === 1 && v.scopes[0] === "ALL_SCOPES" ? "ALL" : v.scopes,
      collection: col ? col.name : null,
    };
  }).sort((a, b) => (a.collection || "").localeCompare(b.collection || "") || a.name.localeCompare(b.name));

  return { textStyles: styles, collections, variables };
})();
```

## Saving the result

Combine outputs into `design-system/figma-library-snapshot.json` preserving the structure (see existing file as a template). Update `capturedAt` to today's date in YYYY-MM-DD format.

For variables, split by collection in the JSON for readability:
- `variables.spacing` — only `spacing/*` from Primitives
- `variables.radius` — only `radius/*` from Primitives
- `variables.colorSemantic` — everything from Semantic collection
- `variables.colorPrimitives` — everything color-related from Primitives

After save, summarize for the user:
- Total components
- Total text styles
- Total variables (per collection)
- Changes since last snapshot (added / removed / renamed components, if you can diff)

## File key

The mymeet.ai library file: `Ma7dtZb6eSHJ5YoaiVEUn2`. Hardcoded — do not ask the user.
