import React from "react";
import Avatar from "../common/Avatar";
import { COLORS } from "../../config/constants";

export default function MobileTopBar({ user, onAvatarClick, onNotifClick, onMsgClick, onSupportClick, notifCount, msgCount, active }) {
  return (
    <div className="mobile-topbar">
      <div style={{ fontFamily: "'Syne',sans-serif", fontWeight: 800, fontSize: 20 }}>
        Zuxter<span style={{ color: COLORS.accent }}>X</span>
      </div>
      <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
        <button onClick={onSupportClick} style={{ position: "relative", background: active === "support" ? COLORS.pink + "15" : "transparent", border: `1px solid ${active === "support" ? COLORS.pink + "55" : COLORS.border}`, borderRadius: 10, width: 38, height: 38, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", fontSize: 16 }}>
          🎫
        </button>
        <button onClick={onMsgClick} style={{ position: "relative", background: active === "messages" ? COLORS.accent + "22" : "transparent", border: `1px solid ${active === "messages" ? COLORS.accent + "44" : COLORS.border}`, borderRadius: 10, width: 38, height: 38, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", fontSize: 16 }}>
          💬
          {msgCount > 0 && <div style={{ position: "absolute", top: -4, right: -4, background: COLORS.accent, color: "#000", borderRadius: "50%", width: 16, height: 16, fontSize: 9, fontWeight: 800, display: "flex", alignItems: "center", justifyContent: "center" }}>{msgCount > 9 ? "9+" : msgCount}</div>}
        </button>
        <button onClick={onNotifClick} style={{ position: "relative", background: "transparent", border: `1px solid ${COLORS.border}`, borderRadius: 10, width: 38, height: 38, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", fontSize: 16 }}>
          🔔
          {notifCount > 0 && <div style={{ position: "absolute", top: -4, right: -4, background: COLORS.pink, color: "#fff", borderRadius: "50%", width: 16, height: 16, fontSize: 9, fontWeight: 800, display: "flex", alignItems: "center", justifyContent: "center" }}>{notifCount > 9 ? "9+" : notifCount}</div>}
        </button>
        <Avatar src={user.avatar} name={user.name} size={36} onClick={onAvatarClick} />
      </div>
    </div>
  );
}
