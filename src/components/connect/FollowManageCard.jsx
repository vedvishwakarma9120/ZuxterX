import React, { useState, useEffect } from "react";
import Card from "../common/Card";
import Avatar from "../common/Avatar";
import { COLORS, BASE_URL } from "../../config/constants";

export default function FollowManageCard({ user, onUserUpdate }) {
  const [tab, setTab] = useState("followers"); // "followers" | "following"
  const [profiles, setProfiles] = useState([]);
  const [loading, setLoading] = useState(false);

  const ids = tab === "followers" ? (user.followers || []) : (user.following || []);

  useEffect(() => {
    if (ids.length === 0) { setProfiles([]); return; }
    setLoading(true);
    Promise.all(ids.map(id =>
      fetch(`${BASE_URL}/connect/user/${id}`, { headers: { "Authorization": "Bearer " + window._authToken } })
        .then(r => r.ok ? r.json() : null).catch(() => null)
    )).then(results => {
      setProfiles(results.filter(Boolean));
      setLoading(false);
    });
  }, [tab, user.followers?.length, user.following?.length]);

  async function handleUnfollow(targetId) {
    try {
      const res = await fetch(`${BASE_URL}/connect/follow/${targetId}`, {
        method: "POST", headers: { "Authorization": "Bearer " + window._authToken }
      });
      const data = await res.json();
      if (res.ok) onUserUpdate({ ...user, following: data.following, followers: data.followers });
    } catch { }
  }

  async function handleRemoveFollower(targetId) {
    alert("To remove a follower, you can block them from ZuxterConnect and they'll be removed.");
  }

  return (
    <Card>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
        <div style={{ fontFamily: "'Syne',sans-serif", fontWeight: 700, fontSize: 15 }}>Social</div>
        <div style={{ display: "flex", gap: 8 }}>
          {["followers", "following"].map(t => (
            <button key={t} onClick={() => setTab(t)}
              style={{ padding: "5px 14px", borderRadius: 8, border: `1px solid ${tab === t ? COLORS.blue + "55" : COLORS.border}`, background: tab === t ? COLORS.blue + "18" : "transparent", color: tab === t ? COLORS.blue : COLORS.muted, cursor: "pointer", fontFamily: "'Outfit',sans-serif", fontSize: 12, fontWeight: 600, textTransform: "capitalize" }}>
              {t === "followers" ? `👥 Followers (${(user.followers || []).length})` : `➕ Following (${(user.following || []).length})`}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div style={{ color: COLORS.muted, fontSize: 13, textAlign: "center", padding: "20px 0" }}>Loading…</div>
      ) : profiles.length === 0 ? (
        <div style={{ color: COLORS.muted, fontSize: 13, textAlign: "center", padding: "20px 0" }}>
          {tab === "followers" ? "No followers yet. Share your profile!" : "You're not following anyone yet."}
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {profiles.map(p => (
            <div key={p.id} style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 12px", background: COLORS.surfaceAlt, borderRadius: 10, border: `1px solid ${COLORS.border}` }}>
              <Avatar src={p.avatar} name={p.name} size={36} />
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 600, fontSize: 13 }}>{p.name}</div>
                <div style={{ fontSize: 11, color: COLORS.muted }}>{p.email}</div>
              </div>
              <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                <span style={{ fontSize: 11, color: COLORS.muted }}>⭐ {p.xp || 0} XP</span>
                {tab === "following" ? (
                  <button onClick={() => handleUnfollow(p.id)}
                    style={{ background: COLORS.danger + "18", border: `1px solid ${COLORS.danger}33`, borderRadius: 7, padding: "4px 10px", color: COLORS.danger, cursor: "pointer", fontFamily: "'Outfit',sans-serif", fontSize: 11, fontWeight: 600 }}>
                    Unfollow
                  </button>
                ) : (
                  <button onClick={() => handleRemoveFollower(p.id)}
                    style={{ background: COLORS.surfaceAlt, border: `1px solid ${COLORS.border}`, borderRadius: 7, padding: "4px 10px", color: COLORS.muted, cursor: "pointer", fontFamily: "'Outfit',sans-serif", fontSize: 11 }}>
                    Remove
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}
