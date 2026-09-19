import React from "react";
import { COLORS } from "../../config/constants";

export default function Tag({ children, color }) {
  const activeColor = color || COLORS.accent;
  return (
    <span style={{ display: "inline-block", background: activeColor + "18", color: activeColor, border: `1px solid ${activeColor}33`, borderRadius: 6, padding: "2px 8px", fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.03em" }}>
      {children}
    </span>
  );
}
