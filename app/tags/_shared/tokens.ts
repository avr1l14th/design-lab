// Токены и ассеты прототипа «Теги». Палитра и хелперы — общие с глобальным чатом,
// свои только иконки тегов (heroicons 20/solid в public/tags, рендер 16×16 через маску)
export { BASE, easeOut, focusRingClass, gcAsset, popoverShadow, pressableClass, sbAsset, sfAsset, shadow, tokens } from "../../global-chat/_shared/tokens";
import { BASE } from "../../global-chat/_shared/tokens";

export const tgAsset = (name: string) => `${BASE}/tags/${name}`;

/** Ключи хранилища прототипа в localStorage */
export const STORAGE_KEY = "tags-proto:v2";
export const OPEN_MEETING_KEY = "tags-proto:open-meeting";

/** Лимит длины названия тега */
export const TAG_NAME_MAX = 24;
