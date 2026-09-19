import React from "react";
import { COLORS } from "../../config/constants";

export default function MobileBottomNav({ active, setActive }) {
  const items = [
    { id: "planner", icon: "🗓", label: "Plan" },
    { id: "questions", icon: "❓", label: "Questions" },
    { id: "summary", icon: "📝", label: "Summary" },
    { id: "connect", icon: "🌐", label: "Connect" },
    { id: "badges", icon: "🏅", label: "Badges" },
    { id: "leaderboard", icon: "🏆", label: "Rank" },
  ];
  return (
    <div className="mobile-bottomnav">
      {items.map(item => {
        const isActive = active === item.id;
        return (
          <button key={item.id} onClick={() => setActive(item.id)}
            style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 2, background: "none", border: "none", cursor: "pointer", padding: "6px 0", color: isActive ? COLORS.accent : COLORS.muted }}>
            <span style={{ fontSize: 20, filter: isActive ? `drop-shadow(0 0 6px ${COLORS.accent})` : "none" }}>{item.icon}</span>
            <span style={{ fontSize: 10, fontWeight: isActive ? 700 : 400, fontFamily: "'Outfit',sans-serif" }}>{item.label}</span>
          </button>
        );
      })}
    </div>
  );
}
