import React, { useState, useEffect } from "react";
import { COLORS } from "../../config/constants";
import Avatar from "../common/Avatar";
import Card from "../common/Card";
import PostCard from "./PostCard";
import { cachedFetch } from "../../utils/cache";

import { BASE_URL } from "../../config/constants";

const CACHE_TTL_PROFILE = 120 * 1000;
const CACHE_TTL_POSTS = 60 * 1000;

export default function UserProfileView({ userId, currentUser, onBack, onFollow, onMessage }) {
  const [profile, setProfile] = useState(null);
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const authHdr = { headers: { Authorization: "Bearer " + window._authToken } };
    let done = 0;
    const checkDone = () => { done++; if (done >= 2) setLoading(false); };
    cachedFetch(`userProfile_${userId}`, `${BASE_URL}/connect/user/${userId}`, authHdr, CACHE_TTL_PROFILE, (d) => { setProfile(d); checkDone(); });
    cachedFetch(`userPosts_${userId}`, `${BASE_URL}/connect/user/${userId}/posts`, authHdr, CACHE_TTL_POSTS, (d) => { setPosts(Array.isArray(d) ? d : []); checkDone(); });
  }, [userId]);

  async function handleLike(postId) {
    try {
      await fetch(`${BASE_URL}/connect/post/${postId}/like`, { method: "POST", headers: { Authorization: "Bearer " + window._authToken } });
      setPosts((prev) =>
        prev.map((p) => {
          if (p._id !== postId) return p;
          const already = (p.likes || []).includes(currentUser.id);
          return { ...p, likes: already ? p.likes.filter((id) => id !== currentUser.id) : [...(p.likes || []), currentUser.id] };
        })
      );
    } catch {}
  }

  async function handleComment(postId, text) {
    if (!text.trim()) return;
    try {
      const res = await fetch(`${BASE_URL}/connect/post/${postId}/comment`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: "Bearer " + window._authToken },
        body: JSON.stringify({ text }),
      });
      if (res.ok) {
        const updated = await res.json();
        setPosts((prev) => prev.map((p) => p._id === postId ? { ...p, comments: updated.comments || p.comments } : p));
      }
    } catch {}
  }

  if (loading) return <div style={{ color: COLORS.muted, padding: 40, textAlign: "center" }}>Loading profile…</div>;
  if (!profile) return <div style={{ color: COLORS.danger, padding: 40 }}>User not found.</div>;

  const isFollowing = (currentUser.following || []).includes(userId);
  const isOwn = userId === currentUser.id;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20, maxWidth: "100%" }}>
      <button
        onClick={onBack}
        style={{ alignSelf: "flex-start", display: "flex", alignItems: "center", gap: 6, background: COLORS.surfaceAlt, border: `1px solid ${COLORS.border}`, borderRadius: 10, padding: "8px 14px", color: COLORS.muted, cursor: "pointer", fontFamily: "'Outfit',sans-serif", fontSize: 13, fontWeight: 500 }}
      >
        ← Back to Feed
      </button>

      <Card>
        <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
          <Avatar src={profile.avatar} name={profile.name} size={80} />
          <div style={{ flex: 1 }}>
            <div style={{ display: "flex", gap: 10, alignItems: "flex-start", flexDirection: "column" }}>
              <div style={{ fontFamily: "'Syne',sans-serif", fontWeight: 800, fontSize: 22 }}>{profile.name}</div>
              {(profile.badges || []).length > 0 && (
                <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
                  {(profile.badges || []).map((b) => {
                    const icons = { first_plan: "🗓", streak3: "🔥", streak7: "⚡", ten_q: "❓", explorer: "🌐", top3: "🏆" };
                    return (
                      <div key={b} title={b} style={{ background: COLORS.surfaceAlt, border: `1px solid ${COLORS.border}`, borderRadius: "50%", width: 24, height: 24, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, cursor: "help" }}>
                        {icons[b] || "🏅"}
                      </div>
                    );
                  })}
                </div>
              )}
              {/* Special badge — highest priority */}
              {(() => {
                const specials = (profile.specialBadges || []).filter((b) => b && (b.image || b.icon));
                if (!specials.length) return null;
                const top = specials.reduce((a, b) => (b.priority || 0) > (a.priority || 0) ? b : a, specials[0]);
                return (
                  <div title={top.label} style={{ display: "inline-flex", alignItems: "center", gap: 4, background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.15)", borderRadius: 20, padding: "2px 10px", fontSize: 11, fontWeight: 600, color: "#f5c518", fontFamily: "'Outfit',sans-serif" }}>
                    {top.image ? <img src={top.image} alt={top.label} style={{ width: 14, height: 14, borderRadius: 3, objectFit: "cover" }} /> : <span style={{ fontSize: 13 }}>{top.icon}</span>}
                    {top.label}
                  </div>
                );
              })()}
            </div>
            {profile.bio && <div style={{ color: COLORS.text, fontSize: 14, marginTop: 4, lineHeight: 1.5 }}>{profile.bio}</div>}
            <div style={{ color: COLORS.muted, fontSize: 13, marginTop: 4 }}>{profile.email}</div>
            <div style={{ display: "flex", gap: 20, marginTop: 10 }}>
              {[
                { label: "Followers", val: (profile.followers || []).length },
                { label: "Following", val: (profile.following || []).length },
                { label: "XP", val: profile.xp || 0 },
              ].map((s) => (
                <div key={s.label} style={{ textAlign: "center" }}>
                  <div style={{ fontWeight: 800, fontSize: 18, color: COLORS.accent, fontFamily: "'Syne',sans-serif" }}>{s.val}</div>
                  <div style={{ fontSize: 11, color: COLORS.muted }}>{s.label}</div>
                </div>
              ))}
            </div>
          </div>
          {!isOwn && (
            <div style={{ display: "flex", gap: 8, flexDirection: "column" }}>
              <button
                className="connect-btn"
                onClick={() => onFollow(userId)}
                style={{ background: isFollowing ? COLORS.surfaceAlt : COLORS.blue, border: `1px solid ${isFollowing ? COLORS.border : COLORS.blue}`, borderRadius: 10, padding: "9px 20px", color: isFollowing ? COLORS.muted : "#000", cursor: "pointer", fontFamily: "'Outfit',sans-serif", fontWeight: 700, fontSize: 14 }}
              >
                {isFollowing ? "Unfollow" : "+ Follow"}
              </button>
              <button
                onClick={() => onMessage(userId)}
                style={{ background: COLORS.accent + "18", border: `1px solid ${COLORS.accent}55`, borderRadius: 10, padding: "9px 20px", color: COLORS.accent, cursor: "pointer", fontFamily: "'Outfit',sans-serif", fontWeight: 700, fontSize: 14 }}
              >
                💬 Message
              </button>
            </div>
          )}
        </div>
      </Card>

      <div style={{ fontFamily: "'Syne',sans-serif", fontWeight: 700, fontSize: 16, color: COLORS.muted }}>Posts ({posts.length})</div>
      {posts.length === 0 ? (
        <Card><div style={{ textAlign: "center", color: COLORS.muted, padding: "20px 0" }}>No posts yet.</div></Card>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {posts.map((post) => (
            <PostCard
              key={post._id}
              post={post}
              currentUser={currentUser}
              onLike={() => handleLike(post._id)}
              onComment={(text) => handleComment(post._id, text)}
              onFollowToggle={onFollow}
              onViewProfile={() => {}}
              onDelete={() => {}}
              onEdit={() => {}}
            />
          ))}
        </div>
      )}
    </div>
  );
}
