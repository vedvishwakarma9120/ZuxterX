import React from "react";
import { COLORS } from "../../config/constants";

export default function Btn({ children, onClick, variant = "primary", disabled = false, style = {} }) {
  const isPri = variant === "primary";
  const bg = isPri ? COLORS.accent : "transparent";
  const fg = isPri ? "#000" : COLORS.text;
  const bd = isPri ? "none" : `1px solid ${COLORS.border}`;
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{ background: bg, color: fg, border: bd, borderRadius: 10, padding: "10px 20px", fontSize: 13, fontWeight: 700, cursor: disabled ? "not-allowed" : "pointer", opacity: disabled ? 0.6 : 1, transition: "all 0.15s ease", fontFamily: "'Outfit',sans-serif", display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 6, ...style }}
      onMouseOver={e => { if(!disabled && !isPri) e.currentTarget.style.background = COLORS.accent + "11"; }}
      onMouseOut={e => { if(!disabled && !isPri) e.currentTarget.style.background = "transparent"; }}
    >
      {children}
    </button>
  );
}
