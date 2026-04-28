"use client";

import React, { createContext, useContext } from "react";

export type Theme = "light" | "dark";

/* Default value is "light" — components that read this outside of a Provider
 * stay light (used by non-tab screens like Step4Usage / Step5Team / Step5Solo). */
export const ThemeContext = createContext<Theme>("light");

export function useTheme(): Theme {
  return useContext(ThemeContext);
}
