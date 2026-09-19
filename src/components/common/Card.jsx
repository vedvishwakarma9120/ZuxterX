import React from "react";
import { COLORS } from "../../config/constants";

export default function Card({ children, style = {}, glow = false }) {
  return (
    <div style={{ background: COLORS.surface, border: `1px solid ${COLORS.border}`, borderRadius: 16, padding: 24, boxShadow: glow ? `0 0 20px ${COLORS.accent}12` : "none", transition: "all 0.3s ease", ...style }}>
      {children}
    </div>
  );
}
