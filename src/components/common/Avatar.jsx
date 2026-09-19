import React from "react";
import { COLORS } from "../../config/constants";

export default function Avatar({ src, name, size = 34, onClick, style = {} }) {
  if (src) {
    return (
      <img
        src={src}
        alt="avatar"
        onClick={onClick}
        style={{
          width: size,
          height: size,
          borderRadius: size > 50 ? 16 : 10,
          objectFit: "cover",
          flexShrink: 0,
          border: `2px solid ${COLORS.accent}55`,
          cursor: onClick ? "pointer" : "default",
          ...style,
        }}
      />
    );
  }
  return (
    <div
      onClick={onClick}
      style={{
        width: size,
        height: size,
        borderRadius: size > 50 ? 16 : 10,
        background: `linear-gradient(135deg,${COLORS.accent}44,${COLORS.blue}33)`,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: size * 0.44,
        fontWeight: 700,
        color: COLORS.accent,
        fontFamily: "'Syne',sans-serif",
        flexShrink: 0,
        border: `2px solid ${COLORS.accent}33`,
        cursor: onClick ? "pointer" : "default",
        ...style,
      }}
    >
      {name ? name[0].toUpperCase() : "?"}
    </div>
  );
}
