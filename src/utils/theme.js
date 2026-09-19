import { COLORS, LIGHT_COLORS, DARK_COLORS } from "../config/constants";

export default function applyTheme(theme) {
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
