import React, { useState, useEffect } from "react";
import { COLORS } from "../../config/constants";
import Avatar from "../common/Avatar";

import { BASE_URL } from "../../config/constants";

export default function PostShareModal({ post, onClose }) {
  const [inbox, setInbox] = useState([]);
  const [copied, setCopied] = useState(false);
  const [sending, setSending] = useState(false);

  useEffect(() => {
    fetch(`${BASE_URL}/msg/inbox`, {
      headers: { Authorization: "Bearer " + window._authToken },
    })
      .then((r) => r.json())
      .then((data) => { if (Array.isArray(data)) setInbox(data); })
      .catch(() => {});
  }, []);

  async function sendToUser(toId) {
    setSending(true);
    try {
      await fetch(`${BASE_URL}/msg/send`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer " + window._authToken,
        },
        body: JSON.stringify({
          toId,
          text: "Shared a post",
          type: "post_share",
          postId: post._id,
          postPreview: post.text ? post.text.substring(0, 40) + "..." : "Image post",
        }),
      });
      alert("Sent!");
      onClose();
    } catch {}
    setSending(false);
  }

  return (
    <div
      style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(0,0,0,0.6)", zIndex: 9999, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}
      onClick={onClose}
    >
      <div
        style={{ background: COLORS.surfaceAlt, border: `1px solid ${COLORS.border}`, borderRadius: 16, width: "100%", maxWidth: 360, padding: 24, paddingBottom: 16 }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
          <div style={{ fontFamily: "'Syne',sans-serif", fontWeight: 700, fontSize: 18, color: COLORS.text }}>Share Post</div>
          <button onClick={onClose} style={{ background: "none", border: "none", color: COLORS.muted, cursor: "pointer", fontSize: 20 }}>×</button>
        </div>

        <button
          onClick={() => { navigator.clipboard.writeText(window.location.origin + "/?postId=" + post._id); setCopied(true); setTimeout(() => setCopied(false), 2000); }}
          style={{ width: "100%", background: COLORS.surface, border: `1px solid ${COLORS.border}`, padding: 12, borderRadius: 10, color: COLORS.text, cursor: "pointer", fontFamily: "'Outfit',sans-serif", fontWeight: 600, display: "flex", justifyContent: "center", alignItems: "center", gap: 8 }}
        >
          {copied ? "✓ Copied!" : "🔗 Copy Link"}
        </button>

        <div style={{ marginTop: 20, marginBottom: 8, fontSize: 13, color: COLORS.muted, fontWeight: 600, textTransform: "uppercase" }}>Send to Messages</div>
        <div style={{ display: "flex", flexDirection: "column", gap: 8, maxHeight: 240, overflowY: "auto" }}>
          {inbox.length === 0 ? (
            <div style={{ color: COLORS.muted, fontSize: 13, padding: "10px 0" }}>No recent conversations. Copy the link instead.</div>
          ) : inbox.map((i) => (
            <div key={i.otherId} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", background: COLORS.surface, border: `1px solid ${COLORS.border}`, padding: "8px 12px", borderRadius: 10 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <Avatar src={i.otherAvatar} name={i.otherName} size={28} />
                <span style={{ fontSize: 13, fontWeight: 600 }}>{i.otherName}</span>
              </div>
              <button
                onClick={() => sendToUser(i.otherId)}
                disabled={sending}
                style={{ background: COLORS.blue, border: "none", color: "#000", padding: "6px 14px", borderRadius: 6, cursor: "pointer", fontSize: 12, fontWeight: 700 }}
              >
                Send
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
