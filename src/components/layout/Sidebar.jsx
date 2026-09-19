import React from "react";
import Avatar from "../common/Avatar";
import { COLORS } from "../../config/constants";

export default function Sidebar({ active, navigateTo, user, handleLogout, showNotifs, setShowNotifs, notifCount, msgCount }) {
  const nav = [
    { id: "planner", icon: "🗓", label: "Study Planner" },
    { id: "questions", icon: "❓", label: "Questions" },
    { id: "summary", icon: "📝", label: "AI Summary" },
    { id: "connect", icon: "🌐", label: "ZuxterConnect" },
    { id: "badges", icon: "🏅", label: "Achievements" },
    { id: "leaderboard", icon: "🏆", label: "Leaderboard" },
  ];

  return (
    <div className="sidebar-wrap" style={{ background: COLORS.surface, borderRight: `1px solid ${COLORS.border}`, display: "flex", flexDirection: "column", padding: "20px 12px", height: "100vh", position: "sticky", top: 0, overflowY: "auto" }}>
      <div style={{ padding: "0 4px", marginBottom: 24 }}>
        <h2 className="brand-name" style={{ fontFamily: "'Syne',sans-serif", fontWeight: 800, fontSize: 22, letterSpacing: "-0.5px" }}>
          Zuxter<span style={{ color: COLORS.accent, textShadow: `0 0 12px ${COLORS.accent}88` }}>X</span>
        </h2>
        <div style={{ fontSize: 11, color: COLORS.muted, marginTop: 2 }}>AI Study Platform</div>
      </div>

      <div onClick={() => navigateTo("profile")} title="Click to view profile"
        style={{ display: "flex", alignItems: "center", gap: 10, background: active === "profile" ? COLORS.accent + "12" : COLORS.surfaceAlt, borderRadius: 12, padding: "10px 12px", marginBottom: 28, border: `1px solid ${active === "profile" ? COLORS.accent + "44" : COLORS.border}`, cursor: "pointer", transition: "all .2s" }}>
        <Avatar src={user.avatar} name={user.name} size={36} />
        <div style={{ overflow: "hidden", flex: 1 }}>
          <div style={{ fontWeight: 600, fontSize: 13, fontFamily: "'Outfit',sans-serif", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{user.name}</div>
          <div style={{ fontSize: 10, color: COLORS.accent, marginTop: 1, fontWeight: 500 }}>
            ⭐ {user.xp || 0} XP · 🔥 {user.streak || 0} streak
          </div>
        </div>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 4, flex: 1 }}>
        {nav.map(item => {
          const isActive = active === item.id;
          return (
            <button key={item.id} onClick={() => navigateTo(item.id)} className="nav-btn"
              style={{ padding: "10px 14px", border: "none", borderRadius: 11, cursor: "pointer", background: isActive ? `linear-gradient(135deg,${COLORS.accent}22,${COLORS.accent}0a)` : "transparent", color: isActive ? COLORS.accent : COLORS.muted, fontFamily: "'Outfit',sans-serif", fontWeight: isActive ? 600 : 400, fontSize: 14, textAlign: "left", borderLeft: isActive ? `3px solid ${COLORS.accent}` : "3px solid transparent", display: "flex", alignItems: "center", gap: 10 }}>
              <span style={{ fontSize: 16 }}>{item.icon}</span>{item.label}
            </button>
          );
        })}

        {/* Messages — navigates to messages page */}
        <button onClick={() => navigateTo("messages")} className="nav-btn"
          style={{ padding: "10px 14px", border: "none", borderRadius: 11, cursor: "pointer", background: active === "messages" ? `linear-gradient(135deg,${COLORS.accent}22,${COLORS.accent}0a)` : "transparent", color: active === "messages" ? COLORS.accent : COLORS.muted, fontFamily: "'Outfit',sans-serif", fontWeight: active === "messages" ? 600 : 400, fontSize: 14, textAlign: "left", borderLeft: active === "messages" ? `3px solid ${COLORS.accent}` : "3px solid transparent", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}><span style={{ fontSize: 16 }}>💬</span>Messages</div>
          {msgCount > 0 && <span style={{ background: COLORS.accent, color: "#000", borderRadius: "10px", padding: "1px 6px", fontSize: 10, fontWeight: 700 }}>{msgCount > 9 ? "9+" : msgCount}</span>}
        </button>

        {/* Notifications — toggles the notifications panel */}
        <button onClick={() => setShowNotifs(v => !v)} className="nav-btn notif-btn"
          style={{ padding: "10px 14px", border: "none", borderRadius: 11, cursor: "pointer", background: showNotifs ? `linear-gradient(135deg,${COLORS.accent}22,${COLORS.accent}0a)` : "transparent", color: showNotifs ? COLORS.accent : COLORS.muted, fontFamily: "'Outfit',sans-serif", fontWeight: showNotifs ? 600 : 400, fontSize: 14, textAlign: "left", borderLeft: showNotifs ? `3px solid ${COLORS.accent}` : "3px solid transparent", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}><span style={{ fontSize: 16 }}>🔔</span>Notifications</div>
          {notifCount > 0 && <span style={{ background: COLORS.pink, color: "#fff", borderRadius: "10px", padding: "1px 6px", fontSize: 10, fontWeight: 700 }}>{notifCount > 9 ? "9+" : notifCount}</span>}
        </button>
      </div>

      <button onClick={() => navigateTo("support")} className="nav-btn"
        style={{ padding: "10px 14px", border: `1px solid ${active === "support" ? COLORS.pink + "55" : COLORS.border}`, borderRadius: 11, cursor: "pointer", background: active === "support" ? COLORS.pink + "15" : "transparent", color: active === "support" ? COLORS.pink : COLORS.muted, fontFamily: "'Outfit',sans-serif", fontWeight: active === "support" ? 600 : 400, fontSize: 13, textAlign: "left", display: "flex", alignItems: "center", gap: 10, marginTop: 8, transition: "all 0.2s" }}>
        <span style={{ fontSize: 16 }}>🎫</span> Support
      </button>

      <button onClick={handleLogout} style={{ marginTop: 8, padding: "10px 14px", border: `1px solid ${COLORS.danger}33`, borderRadius: 11, background: COLORS.danger + "12", color: COLORS.danger, cursor: "pointer", fontFamily: "'Outfit',sans-serif", fontWeight: 600, fontSize: 13, display: "flex", alignItems: "center", gap: 8, transition: "all 0.2s" }}
        onMouseOver={e => e.currentTarget.style.background = COLORS.danger + "25"} onMouseOut={e => e.currentTarget.style.background = COLORS.danger + "12"}>
        <span>⏻</span> Sign Out
      </button>
    </div>
  );
}
