// Инлайнер иконок перед захватом прототипа в Figma (generate_figma_design).
// Проблема: иконки через CSS mask-image и <img src="*.svg"> приезжают в Figma серыми квадратами.
// Решение: до захвата заменить их на inline <svg> с fill = текущий цвет.
// Запуск: javascript_tool в built-in browser сразу после navigate (до figmadelay).
// Возвращает {masks, imgs} — сколько элементов заменено.
(async () => {
  const cache = new Map();
  const fetchSvg = async (url) => {
    if (!cache.has(url)) cache.set(url, fetch(url).then((r) => r.text()));
    return cache.get(url);
  };
  const parse = (text) => {
    const doc = new DOMParser().parseFromString(text, "image/svg+xml");
    const svg = doc.documentElement;
    if (svg.nodeName !== "svg") return null;
    return document.importNode(svg, true);
  };
  const urlFrom = (v) => {
    const m = /url\(["']?([^"')]+)["']?\)/.exec(v || "");
    return m ? m[1] : null;
  };
  let masks = 0, imgs = 0;
  // 1. Элементы с mask-image: цвет иконки = background-color элемента
  for (const el of Array.from(document.querySelectorAll("*"))) {
    const cs = getComputedStyle(el);
    const url = urlFrom(cs.webkitMaskImage || cs.maskImage);
    if (!url || !/\.svg(\?|$)/.test(url)) continue;
    const svg = parse(await fetchSvg(url));
    if (!svg) continue;
    const w = el.getBoundingClientRect().width, h = el.getBoundingClientRect().height;
    svg.setAttribute("width", String(w));
    svg.setAttribute("height", String(h));
    svg.style.display = "block";
    const color = cs.backgroundColor;
    svg.querySelectorAll("[fill]").forEach((n) => { if (n.getAttribute("fill") !== "none") n.setAttribute("fill", color); });
    if (!svg.getAttribute("fill")) svg.setAttribute("fill", color);
    svg.querySelectorAll("[stroke]").forEach((n) => { if (n.getAttribute("stroke") !== "none") n.setAttribute("stroke", color); });
    el.style.webkitMaskImage = "none";
    el.style.maskImage = "none";
    el.style.backgroundColor = "transparent";
    el.innerHTML = "";
    el.appendChild(svg);
    masks++;
  }
  // 2. <img src="*.svg"> → inline svg того же размера
  for (const img of Array.from(document.querySelectorAll('img[src$=".svg"], img[src*=".svg?"]'))) {
    const svg = parse(await fetchSvg(img.currentSrc || img.src));
    if (!svg) continue;
    const r = img.getBoundingClientRect();
    svg.setAttribute("width", String(r.width));
    svg.setAttribute("height", String(r.height));
    svg.setAttribute("class", img.getAttribute("class") || "");
    svg.style.cssText = img.style.cssText;
    svg.style.display = "block";
    img.replaceWith(svg);
    imgs++;
  }
  // 3. Служебные элементы лаборатории в захват не нужны
  // LabFAB — плавающая кнопка лаборатории (fixed z-[100001]); панель агентации (PageFeedbackToolbarCSS)
  // в DOM не всегда ловится — если приехала в захват, удалить слой по имени уже в Figma.
  document.querySelectorAll('div[class*="z-[100001]"]').forEach((n) => n.remove());
  return { masks, imgs };
})();
