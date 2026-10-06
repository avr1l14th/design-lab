// Токены и ассеты прототипа «Реферальная программа». Палитра и хелперы — общие с глобальным чатом,
// свои только иконки (heroicons 20/solid в public/referral, рендер 16×16 через маску)
export { BASE, ctaAsset, easeOut, focusRingClass, popoverShadow, pressableClass, sbAsset, sfAsset, shadow, tokens } from "../../global-chat/_shared/tokens";
import { BASE } from "../../global-chat/_shared/tokens";

export const rfAsset = (name: string) => `${BASE}/referral/${name}`;

/** Ссылка-приглашение текущего пользователя */
export const INVITE_LINK = "mymeet.ai/r/fedos";
