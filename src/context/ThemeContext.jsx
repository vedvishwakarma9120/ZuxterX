import { createContext } from "react";
import { COLORS, DARK_COLORS, LIGHT_COLORS } from "../config/constants";

export const ThemeContext = createContext({ theme: "dark", setTheme: () => {} });

export function applyTheme(theme) {
  const src = theme === "light" ? LIGHT_COLORS : DARK_COLORS;
  Object.keys(src).forEach((k) => {
    COLORS[k] = src[k];
  });
  if (typeof document !== "undefined") {
    if (theme === "light") {
      document.body.classList.add("light-mode");
      document.body.classList.remove("dark-mode");
    } else {
      document.body.classList.add("dark-mode");
      document.body.classList.remove("light-mode");
    }
  }
}
