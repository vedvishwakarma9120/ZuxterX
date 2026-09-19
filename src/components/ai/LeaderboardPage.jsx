import React, { useState, useEffect } from "react";
import { COLORS, BASE_URL, CACHE_TTL } from "../../config/constants";
import Card from "../common/Card";
import Avatar from "../common/Avatar";
import Tag from "../common/Tag";
import { SpecialBadgeRow } from "../common/SpecialBadgePill";
import { cachedFetch } from "../../utils/cache";


import { Spinner } from "../common/Spinner";

export default function LeaderboardPage({ currentUser }) {
  const [board, setBoard] = useState([]);
  const [loading, setLoading] = useState(true);
  const medals = ["🥇", "🥈", "🥉"];

  useEffect(() => {
    cachedFetch("leaderboard", `${BASE_URL}/leaderboard`, {}, CACHE_TTL.leaderboard, (d) => {
      setBoard(d);
      setLoading(false);
    });
  }, []);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <div>
        <h2 style={{ fontFamily: "'Syne',sans-serif", fontSize: 26, fontWeight: 800 }}>Leaderboard</h2>
        <p style={{ color: COLORS.muted, marginTop: 4, fontSize: 14 }}>Top students ranked by XP — updated live from server.</p>
      </div>
      <Card>
        {loading ? (
          <Spinner />
        ) : board.length === 0 ? (
          <p style={{ color: COLORS.muted, textAlign: "center", padding: "24px 0" }}>No users yet. Be the first!</p>
        ) : (
          <div style={{ display: "flex", flexDirection: "column" }}>
            {board.filter((u) => (u.xp || 0) > 0).map((u, i) => {
              const isMe = u.email === currentUser.email;
              return (
                <div key={u.id} style={{ display: "flex", alignItems: "center", gap: 16, padding: "14px 12px", borderRadius: 10, background: isMe ? COLORS.accent + "12" : "transparent", borderBottom: i < board.length - 1 ? `1px solid ${COLORS.border}` : "none" }}>
                  <span style={{ fontSize: 20, width: 28, textAlign: "center" }}>{medals[i] || `#${i + 1}`}</span>
                  <Avatar src={u.avatar} name={u.name} size={32} />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 600, fontSize: 14, color: isMe ? COLORS.accent : COLORS.text, display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
                      {u.name} {isMe && <Tag color={COLORS.accent}>You</Tag>}
                      {(u.specialBadges || []).length > 0 && <SpecialBadgeRow badges={u.specialBadges} />}
                    </div>
                    <div style={{ fontSize: 12, color: COLORS.muted, marginTop: 2 }}>🔥 {u.streak} streak · 🏅 {(u.badges || []).length} badges</div>
                  </div>
                  <div style={{ fontFamily: "'Syne',sans-serif", fontWeight: 800, fontSize: 18, color: COLORS.gold }}>{u.xp} <span style={{ fontSize: 11, fontWeight: 400, color: COLORS.muted }}>XP</span></div>
                </div>
              );
            })}
          </div>
        )}
      </Card>
    </div>
  );
}
