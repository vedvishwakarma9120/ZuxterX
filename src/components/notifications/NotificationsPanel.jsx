import React, { useState, useEffect } from "react";
import { COLORS, BASE_URL } from "../../config/constants";

export default function NotificationsPanel({ user, onClose, onNavigate }) {
  const [notifs, setNotifs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch(`${BASE_URL}/notifications`, {
          headers: { Authorization: "Bearer " + window._authToken },
        });
        if (res.ok) setNotifs(await res.json());
        fetch(`${BASE_URL}/notifications/mark-seen`, {
          method: "POST",
          headers: { Authorization: "Bearer " + window._authToken },
        });
      } catch {}
      setLoading(false);
    }
    load();
  }, []);

  function timeAgo(ts) {
    if (!ts) return "";
    const diff = Date.now() - new Date(ts).getTime();
    const m = Math.floor(diff / 60000);
    if (m < 1) return "just now";
    if (m < 60) return `${m}m ago`;
    const h = Math.floor(m / 60);
    if (h < 24) return `${h}h ago`;
    return `${Math.floor(h / 24)}d ago`;
  }

  function notifIcon(type) {
    if (type === "follow") return { icon: "👤", color: COLORS.blue };
    if (type === "like") return { icon: "❤️", color: COLORS.pink };
    if (type === "comment") return { icon: "💬", color: COLORS.accent };
    if (type === "message") return { icon: "✉️", color: COLORS.gold };
    return { icon: "🔔", color: COLORS.muted };
  }

  return (
    <div
      style={{
        position: "fixed",
        top: 56,
        left: 0,
        right: 0,
        zIndex: 500,
        background: COLORS.surface,
        borderBottom: `1px solid ${COLORS.border}`,
        boxShadow: "0 8px 32px rgba(0,0,0,0.5)",
        maxHeight: "60vh",
        overflowY: "auto",
      }}
    >
      <div style={{ padding: "14px 16px", borderBottom: `1px solid ${COLORS.border}`, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div style={{ fontFamily: "'Syne',sans-serif", fontWeight: 700, fontSize: 15 }}>🔔 Notifications</div>
        <button onClick={onClose} style={{ background: "none", border: "none", color: COLORS.muted, cursor: "pointer", fontSize: 18 }}>✕</button>
      </div>
      {loading ? (
        <div style={{ padding: 24, textAlign: "center", color: COLORS.muted, fontSize: 13 }}>Loading…</div>
      ) : notifs.length === 0 ? (
        <div style={{ padding: 24, textAlign: "center", color: COLORS.muted, fontSize: 13 }}>No notifications yet.</div>
      ) : (
        notifs.map((n, i) => {
          const { icon, color } = notifIcon(n.type);
          return (
            <div
              key={i}
              onClick={() => { if (n.type === "message") onNavigate("messages"); onClose(); }}
              style={{ display: "flex", gap: 12, padding: "12px 16px", borderBottom: `1px solid ${COLORS.border}`, cursor: n.type === "message" ? "pointer" : "default", background: n.seen ? "transparent" : COLORS.accent + "08" }}
              onMouseOver={(e) => { if (n.type === "message") e.currentTarget.style.background = COLORS.surfaceAlt; }}
              onMouseOut={(e) => { e.currentTarget.style.background = n.seen ? "transparent" : COLORS.accent + "08"; }}
            >
              <div style={{ width: 36, height: 36, borderRadius: "50%", background: color + "22", border: `1px solid ${color}44`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, flexShrink: 0 }}>
                {icon}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13, color: COLORS.text, lineHeight: 1.5 }}>{n.message}</div>
                <div style={{ fontSize: 11, color: COLORS.muted, marginTop: 3 }}>{timeAgo(n.createdAt)}</div>
              </div>
              {!n.seen && <div style={{ width: 8, height: 8, borderRadius: "50%", background: COLORS.accent, flexShrink: 0, marginTop: 6 }} />}
            </div>
          );
        })
      )}
    </div>
  );
}
