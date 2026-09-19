import React, { useState } from "react";

export function SpecialBadgePill({ badge }) {
  const [tip, setTip] = useState(false);
  return (
    <div
      style={{ position: "relative", display: "inline-flex", alignItems: "center", cursor: "default" }}
      onMouseEnter={() => setTip(true)}
      onMouseLeave={() => setTip(false)}
    >
      {badge.image ? (
        <img src={badge.image} alt={badge.label} style={{ width: 20, height: 20, borderRadius: 5, objectFit: "cover", border: "1.5px solid #f5c518aa" }} />
      ) : (
        <span style={{ fontSize: 16, lineHeight: 1 }}>{badge.icon || "🏆"}</span>
      )}
      {tip && (
        <div style={{ position: "absolute", bottom: "125%", left: "50%", transform: "translateX(-50%)", background: "#0d0f14", border: "1px solid #f5c518", borderRadius: 7, padding: "4px 10px", fontSize: 11, color: "#f5c518", whiteSpace: "nowrap", zIndex: 9999, boxShadow: "0 4px 12px rgba(0,0,0,0.6)", fontWeight: 600, pointerEvents: "none" }}>
          {badge.label}
          <div style={{ position: "absolute", top: "100%", left: "50%", transform: "translateX(-50%)", borderWidth: "5px 5px 0", borderStyle: "solid", borderColor: "#f5c518 transparent transparent" }} />
        </div>
      )}
    </div>
  );
}

export function SpecialBadgeRow({ badges, style }) {
  const list = (badges || []).filter((b) => b && (b.image || b.icon));
  if (!list.length) return null;
  return (
    <div style={{ display: "flex", gap: 4, flexWrap: "wrap", alignItems: "center", ...style }}>
      {list.map((b, i) => (
        <SpecialBadgePill key={b.id || i} badge={b} />
      ))}
    </div>
  );
}
