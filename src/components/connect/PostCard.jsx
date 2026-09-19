import React, { useState } from "react";
import { COLORS } from "../../config/constants";
import Avatar from "../common/Avatar";
import { SpecialBadgeRow } from "../common/SpecialBadgePill";
import PostShareModal from "./PostShareModal";

import { BASE_URL } from "../../config/constants";

function timeAgo(ts) {
  const diff = Date.now() - new Date(ts).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

export default function PostCard({
  post,
  currentUser,
  onLike,
  onComment,
  onFollowToggle,
  onViewProfile,
  onDelete,
  onEdit,
}) {
  const [showComments, setShowComments] = useState(false);
  const [showShare, setShowShare] = useState(false);
  const [commentText, setCommentText] = useState("");
  const [editing, setEditing] = useState(false);
  const [editText, setEditText] = useState(post.text || "");
  const [saving, setSaving] = useState(false);

  const liked = (post.likes || []).includes(currentUser.id);
  const isOwn = post.authorId === currentUser.id;
  const isFollowing = (currentUser.following || []).includes(post.authorId);

  async function saveEdit() {
    if (!editText.trim()) return;
    setSaving(true);
    try {
      await fetch(`${BASE_URL}/connect/post/${post._id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer " + window._authToken,
        },
        body: JSON.stringify({ text: editText }),
      });
      setEditing(false);
      if (onEdit) onEdit(post._id, editText);
    } catch {}
    setSaving(false);
  }

  return (
    <div
      className="post-card"
      style={{
        background: COLORS.surface,
        border: `1px solid ${COLORS.border}`,
        borderRadius: 16,
        padding: "18px 20px",
        animation: "fadeUp .3s ease both",
      }}
    >
      {/* Post header */}
      <div style={{ display: "flex", alignItems: "flex-start", gap: 12, marginBottom: 12 }}>
        <Avatar
          src={post.authorAvatar}
          name={post.authorName}
          size={40}
          onClick={() => onViewProfile(post.authorId)}
          style={{ cursor: "pointer" }}
        />
        <div style={{ flex: 1 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
            <span
              onClick={() => onViewProfile(post.authorId)}
              style={{ fontWeight: 700, fontSize: 14, fontFamily: "'Syne',sans-serif", cursor: "pointer", color: COLORS.text }}
              onMouseOver={(e) => (e.target.style.color = COLORS.blue)}
              onMouseOut={(e) => (e.target.style.color = COLORS.text)}
            >
              {post.authorName}
            </span>
            {(post.authorSpecialBadges || []).length > 0 && (
              <SpecialBadgeRow badges={post.authorSpecialBadges} />
            )}
            <span style={{ fontSize: 11, color: COLORS.muted }}>{timeAgo(post.createdAt)}</span>
            {!isOwn && (
              <button
                className="connect-btn"
                onClick={() => onFollowToggle(post.authorId)}
                style={{
                  background: isFollowing ? COLORS.surfaceAlt : COLORS.blue + "22",
                  border: `1px solid ${isFollowing ? COLORS.border : COLORS.blue + "55"}`,
                  borderRadius: 6, padding: "2px 10px", fontSize: 11,
                  color: isFollowing ? COLORS.muted : COLORS.blue,
                  cursor: "pointer", fontFamily: "'Outfit',sans-serif", fontWeight: 600,
                }}
              >
                {isFollowing ? "Following" : "+ Follow"}
              </button>
            )}
            {isOwn && (
              <div style={{ marginLeft: "auto", display: "flex", gap: 6 }}>
                <button
                  onClick={() => { setEditing((v) => !v); setEditText(post.text || ""); }}
                  style={{ background: COLORS.surfaceAlt, border: `1px solid ${COLORS.border}`, borderRadius: 6, padding: "2px 9px", fontSize: 11, color: COLORS.muted, cursor: "pointer", fontFamily: "'Outfit',sans-serif", fontWeight: 600 }}
                >
                  ✏️ Edit
                </button>
                <button
                  onClick={() => { if (window.confirm("Delete this post?")) onDelete(post._id); }}
                  style={{ background: COLORS.danger + "18", border: `1px solid ${COLORS.danger}44`, borderRadius: 6, padding: "2px 9px", fontSize: 11, color: COLORS.danger, cursor: "pointer", fontFamily: "'Outfit',sans-serif", fontWeight: 600 }}
                >
                  🗑 Delete
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Edit mode */}
      {editing ? (
        <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 10 }}>
          <textarea
            value={editText}
            onChange={(e) => setEditText(e.target.value)}
            rows={3}
            style={{ background: COLORS.surfaceAlt, border: `1px solid ${COLORS.blue}`, borderRadius: 10, padding: "10px 14px", color: COLORS.text, fontFamily: "'DM Sans',sans-serif", fontSize: 14, outline: "none", resize: "none", width: "100%", caretColor: COLORS.text }}
          />
          <div style={{ display: "flex", gap: 8 }}>
            <button
              onClick={saveEdit}
              disabled={saving || !editText.trim()}
              style={{ background: COLORS.blue, border: "none", borderRadius: 8, padding: "7px 16px", color: "#000", cursor: "pointer", fontFamily: "'Outfit',sans-serif", fontWeight: 700, fontSize: 13 }}
            >
              {saving ? "Saving…" : "Save"}
            </button>
            <button
              onClick={() => setEditing(false)}
              style={{ background: "transparent", border: `1px solid ${COLORS.border}`, borderRadius: 8, padding: "7px 16px", color: COLORS.muted, cursor: "pointer", fontFamily: "'Outfit',sans-serif", fontSize: 13 }}
            >
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <>
          {post.text && <p style={{ fontSize: 14, lineHeight: 1.7, color: COLORS.text, marginBottom: post.image ? 12 : 0 }}>{post.text}</p>}
          {post.image && <img src={post.image} alt="post" style={{ width: "100%", maxHeight: 380, objectFit: "cover", borderRadius: 10, border: `1px solid ${COLORS.border}`, marginBottom: 4 }} />}
        </>
      )}

      {/* Actions */}
      <div style={{ display: "flex", gap: 16, marginTop: 14, paddingTop: 12, borderTop: `1px solid ${COLORS.border}` }}>
        <button
          className="like-btn"
          onClick={(e) => { e.stopPropagation(); onLike(); }}
          style={{ display: "flex", alignItems: "center", gap: 5, background: liked ? "rgba(255,80,80,0.12)" : COLORS.surfaceAlt, borderRadius: 4, padding: "3px 8px", border: `1px solid ${liked ? "rgba(255,80,80,0.4)" : COLORS.border}`, cursor: "pointer", color: liked ? "#ff5555" : COLORS.muted, fontSize: 12, fontFamily: "'Outfit',sans-serif", fontWeight: liked ? 700 : 400, transition: "all .15s" }}
        >
          <span style={{ fontSize: 14, lineHeight: 1 }}>{liked ? "❤️" : "🤍"}</span> {(post.likes || []).length}
        </button>
        <button
          onClick={() => setShowComments((v) => !v)}
          style={{ display: "flex", alignItems: "center", gap: 6, background: "transparent", border: "none", cursor: "pointer", color: showComments ? COLORS.blue : COLORS.muted, fontSize: 13, fontFamily: "'Outfit',sans-serif" }}
        >
          <span style={{ fontSize: 16 }}>💬</span> {(post.comments || []).length}
        </button>
        <button
          onClick={() => setShowShare(true)}
          style={{ display: "flex", alignItems: "center", gap: 6, background: "transparent", border: "none", cursor: "pointer", color: COLORS.blue, fontSize: 13, fontFamily: "'Outfit',sans-serif", marginLeft: "auto" }}
        >
          <span style={{ fontSize: 15 }}>↗️</span> Share
        </button>
      </div>

      {showShare && <PostShareModal post={post} onClose={() => setShowShare(false)} />}

      {/* Comments */}
      {showComments && (
        <div style={{ marginTop: 14 }}>
          {(post.comments || []).map((c, i) => (
            <div key={i} style={{ display: "flex", gap: 10, marginBottom: 10, padding: "8px 10px", background: COLORS.surfaceAlt, borderRadius: 10 }}>
              <Avatar src={c.authorAvatar} name={c.authorName} size={26} onClick={() => onViewProfile(c.authorId)} />
              <div style={{ flex: 1 }}>
                <span style={{ fontWeight: 700, fontSize: 12, color: COLORS.accent, marginRight: 6 }}>{c.authorName}</span>
                <span style={{ fontSize: 13, color: COLORS.text }}>{c.text}</span>
              </div>
            </div>
          ))}
          <div style={{ display: "flex", gap: 8, marginTop: 8, alignItems: "center" }}>
            <Avatar src={currentUser.avatar} name={currentUser.name} size={28} />
            <input
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              placeholder="Write a comment…"
              onKeyDown={(e) => { if (e.key === "Enter" && commentText.trim()) { onComment(commentText); setCommentText(""); } }}
              style={{ flex: 1, background: COLORS.surfaceAlt, border: `1px solid ${COLORS.border}`, borderRadius: 8, padding: "7px 12px", color: COLORS.text, fontFamily: "'DM Sans',sans-serif", fontSize: 13, outline: "none", caretColor: COLORS.text }}
              onFocus={(e) => (e.target.style.borderColor = COLORS.blue)}
              onBlur={(e) => (e.target.style.borderColor = COLORS.border)}
            />
            <button
              onClick={() => { if (commentText.trim()) { onComment(commentText); setCommentText(""); } }}
              style={{ background: COLORS.blue, border: "none", borderRadius: 8, padding: "7px 11px", color: "#000", cursor: "pointer", fontFamily: "'Outfit',sans-serif", fontWeight: 600, fontSize: 12, whiteSpace: "nowrap", flexShrink: 0 }}
            >
              Send
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
