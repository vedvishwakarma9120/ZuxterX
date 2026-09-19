import React, { useState, useEffect, useRef } from "react";
import { COLORS } from "../../config/constants";
import Avatar from "../common/Avatar";

import { BASE_URL } from "../../config/constants";

export default function MessagingPage({ user, openWithId = null, onBack }) {
  const [inbox, setInbox] = useState([]);
  const [activeChat, setActiveChat] = useState(null);
  const [messages, setMessages] = useState([]);
  const [msgText, setMsgText] = useState("");
  const [sending, setSending] = useState(false);
  const [loadingMsgs, setLoadingMsgs] = useState(false);
  const [searchUser, setSearchUser] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [openMsgMenu, setOpenMsgMenu] = useState(null);
  const bottomRef = useRef(null);
  const pollRef = useRef(null);

  // Close menus on outside click
  useEffect(() => {
    const handler = () => setOpenMsgMenu(null);
    document.addEventListener("click", handler);
    return () => document.removeEventListener("click", handler);
  }, []);

  const authHdr = { Authorization: "Bearer " + window._authToken };

  async function deleteConversation(otherId) {
    await fetch(`${BASE_URL}/msg/conversation/${otherId}`, { method: "DELETE", headers: authHdr });
    setActiveChat(null);
    setMessages([]);
    loadInbox();
  }

  async function deleteMessage(msgId) {
    try {
      await fetch(`${BASE_URL}/msg/delete/${msgId}`, { method: "DELETE", headers: authHdr });
      if (activeChat) {
        const res = await fetch(`${BASE_URL}/msg/conversation/${activeChat.otherId}`, { headers: authHdr });
        if (res.ok) setMessages(await res.json());
      }
    } catch {
      setMessages((prev) => prev.filter((m) => m._id !== msgId));
    }
    setOpenMsgMenu(null);
  }

  async function unsendMessage(msgId) {
    await fetch(`${BASE_URL}/msg/unsend/${msgId}`, { method: "DELETE", headers: authHdr });
    setMessages((prev) => prev.filter((m) => m._id !== msgId));
    setOpenMsgMenu(null);
  }

  async function loadInbox() {
    try {
      const res = await fetch(`${BASE_URL}/msg/inbox`, { headers: { Authorization: "Bearer " + window._authToken } });
      if (res.ok) setInbox(await res.json());
    } catch {}
  }

  async function openChat(otherId, otherName, otherAvatar) {
    setActiveChat({ otherId, otherName: otherName || "", otherAvatar });
    setLoadingMsgs(true);
    try {
      if (!otherName) {
        const userRes = await fetch(`${BASE_URL}/connect/user/${otherId}`, { headers: { Authorization: "Bearer " + window._authToken } });
        if (userRes.ok) {
          const userData = await userRes.json();
          setActiveChat({ otherId, otherName: userData.name || "User", otherAvatar: userData.avatar });
        }
      }
      const res = await fetch(`${BASE_URL}/msg/conversation/${otherId}`, { headers: { Authorization: "Bearer " + window._authToken } });
      if (res.ok) setMessages(await res.json());
    } catch {}
    setLoadingMsgs(false);
  }

  async function sendMsg() {
    if (!msgText.trim() || !activeChat) return;
    setSending(true);
    const text = msgText;
    setMsgText("");

    // Optimistic update
    const tempMsg = {
      _id: "temp_" + Date.now(),
      fromId: user.id,
      toId: activeChat.otherId,
      fromName: user.name,
      fromAvatar: user.avatar,
      text,
      type: "text",
      seen: false,
      createdAt: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, tempMsg]);

    try {
      await fetch(`${BASE_URL}/msg/send`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: "Bearer " + window._authToken },
        body: JSON.stringify({ toId: activeChat.otherId, text }),
      });
      const res = await fetch(`${BASE_URL}/msg/conversation/${activeChat.otherId}`, { headers: { Authorization: "Bearer " + window._authToken } });
      if (res.ok) setMessages(await res.json());
      loadInbox();
    } catch {}
    setSending(false);
  }

  useEffect(() => { loadInbox(); }, []);

  // Poll for new messages every 4s when chat is open
  useEffect(() => {
    if (!activeChat) return;
    if (pollRef.current) clearInterval(pollRef.current);
    pollRef.current = setInterval(async () => {
      try {
        const res = await fetch(`${BASE_URL}/msg/conversation/${activeChat.otherId}`, { headers: { Authorization: "Bearer " + window._authToken } });
        if (res.ok) { const data = await res.json(); setMessages(data); }
      } catch {}
    }, 4000);
    return () => clearInterval(pollRef.current);
  }, [activeChat]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    if (openWithId) openChat(openWithId, "", null);
  }, [openWithId]);

  function timeAgo(ts) {
    if (!ts) return "";
    const diff = Date.now() - new Date(ts).getTime();
    const m = Math.floor(diff / 60000);
    if (m < 1) return "just now";
    if (m < 60) return `${m}m`;
    const h = Math.floor(m / 60);
    if (h < 24) return `${h}h`;
    return new Date(ts).toLocaleDateString();
  }

  async function searchUsers(q) {
    if (!q.trim()) { setSearchResults([]); return; }
    try {
      const res = await fetch(`${BASE_URL}/connect/search?q=${encodeURIComponent(q)}`, { headers: { Authorization: "Bearer " + window._authToken } });
      if (res.ok) setSearchResults(await res.json());
    } catch {}
  }

  const isMobile = window.innerWidth <= 640;
  const showList = !isMobile || !activeChat;
  const showChat = !isMobile || !!activeChat;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      {onBack && (
        <button
          onClick={onBack}
          style={{ alignSelf: "flex-start", display: "flex", alignItems: "center", gap: 6, background: COLORS.surfaceAlt, border: `1px solid ${COLORS.border}`, borderRadius: 10, padding: "8px 14px", color: COLORS.muted, cursor: "pointer", fontFamily: "'Outfit',sans-serif", fontSize: 13, fontWeight: 500 }}
          onMouseOver={(e) => { e.currentTarget.style.borderColor = COLORS.accent + "55"; e.currentTarget.style.color = COLORS.accent; }}
          onMouseOut={(e) => { e.currentTarget.style.borderColor = COLORS.border; e.currentTarget.style.color = COLORS.muted; }}
        >
          ← Back to Profile
        </button>
      )}

      <div style={{ display: "flex", height: onBack ? "calc(100vh - 100px)" : "calc(100vh - 48px)", maxHeight: 700, background: COLORS.surface, borderRadius: 16, border: `1px solid ${COLORS.border}`, overflow: "hidden" }}>

        {/* LEFT — Inbox list */}
        {showList && (
          <div style={{ width: isMobile ? "100%" : 280, borderRight: isMobile ? "none" : `1px solid ${COLORS.border}`, display: "flex", flexDirection: "column" }}>
            <div style={{ padding: "16px 14px", borderBottom: `1px solid ${COLORS.border}` }}>
              <div style={{ fontFamily: "'Syne',sans-serif", fontWeight: 800, fontSize: 17, marginBottom: 10 }}>💬 Messages</div>
              <input
                value={searchUser}
                onChange={(e) => { setSearchUser(e.target.value); searchUsers(e.target.value); }}
                placeholder="Search conversations…"
                style={{ width: "100%", background: COLORS.surfaceAlt, border: `1px solid ${COLORS.border}`, borderRadius: 9, padding: "8px 12px", color: COLORS.text, fontSize: 13, outline: "none" }}
                onFocus={(e) => (e.target.style.borderColor = COLORS.accent)}
                onBlur={(e) => (e.target.style.borderColor = COLORS.border)}
              />
            </div>

            <div style={{ flex: 1, overflowY: "auto" }}>
              {searchUser.trim() ? (
                <>
                  {searchResults.length === 0 ? (
                    <div style={{ padding: 24, textAlign: "center", color: COLORS.muted, fontSize: 13 }}>No users found.</div>
                  ) : (
                    searchResults.map((u) => (
                      <div key={u.id} onClick={() => { openChat(u.id, u.name, u.avatar); setSearchUser(""); setSearchResults([]); }}
                        style={{ display: "flex", gap: 12, padding: "12px 14px", cursor: "pointer", borderBottom: `1px solid ${COLORS.border}` }}
                        onMouseOver={(e) => (e.currentTarget.style.background = COLORS.surfaceAlt)}
                        onMouseOut={(e) => (e.currentTarget.style.background = "transparent")}
                      >
                        <Avatar src={u.avatar} name={u.name} size={36} />
                        <div style={{ flex: 1, display: "flex", alignItems: "center" }}>
                          <span style={{ fontWeight: 600, fontSize: 13, color: COLORS.text }}>{u.name}</span>
                        </div>
                      </div>
                    ))
                  )}
                </>
              ) : (
                <>
                  {inbox.length === 0 && (
                    <div style={{ padding: 24, textAlign: "center", color: COLORS.muted, fontSize: 13 }}>
                      No conversations yet.<br />Follow someone and start chatting!
                    </div>
                  )}
                  {inbox.map((thread) => {
                    const threadMenuKey = `thread:${thread.otherId}`;
                    return (
                      <div key={thread.otherId} style={{ position: "relative", borderBottom: `1px solid ${COLORS.border}` }}>
                        <div
                          onClick={() => openChat(thread.otherId, thread.otherName, thread.otherAvatar)}
                          style={{ display: "flex", gap: 12, padding: "12px 14px", cursor: "pointer", background: activeChat?.otherId === thread.otherId ? COLORS.accent + "12" : "transparent", borderLeft: activeChat?.otherId === thread.otherId ? `3px solid ${COLORS.accent}` : "3px solid transparent", alignItems: "center" }}
                          onMouseOver={(e) => (e.currentTarget.style.background = COLORS.surfaceAlt)}
                          onMouseOut={(e) => (e.currentTarget.style.background = activeChat?.otherId === thread.otherId ? COLORS.accent + "12" : "transparent")}
                        >
                          <div style={{ position: "relative", flexShrink: 0 }}>
                            <Avatar src={thread.otherAvatar} name={thread.otherName} size={42} />
                            {thread.unread > 0 && (
                              <div style={{ position: "absolute", top: -3, right: -3, background: COLORS.accent, color: "#000", borderRadius: "50%", width: 18, height: 18, fontSize: 10, fontWeight: 800, display: "flex", alignItems: "center", justifyContent: "center" }}>{thread.unread}</div>
                            )}
                          </div>
                          <div style={{ flex: 1, overflow: "hidden" }}>
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                              <span style={{ fontWeight: thread.unread > 0 ? 700 : 500, fontSize: 13, color: thread.unread > 0 ? COLORS.text : COLORS.muted }}>{thread.otherName}</span>
                              <span style={{ fontSize: 10, color: COLORS.muted }}>{timeAgo(thread.lastTime)}</span>
                            </div>
                            <div style={{ fontSize: 12, color: COLORS.muted, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", marginTop: 2 }}>
                              {thread.isMine ? "You: " : ""}{thread.lastText}
                            </div>
                          </div>
                          {/* 3-dot menu for thread */}
                          <div style={{ position: "relative", flexShrink: 0 }} onClick={(e) => e.stopPropagation()}>
                            <button
                              onClick={() => setOpenMsgMenu((v) => v === threadMenuKey ? null : threadMenuKey)}
                              style={{ background: "none", border: "none", color: COLORS.muted, cursor: "pointer", fontSize: 16, padding: "4px 6px", borderRadius: 6, lineHeight: 1, opacity: 0.7 }}
                              title="Delete chat"
                            >⋮</button>
                            {openMsgMenu === threadMenuKey && (
                              <div style={{ position: "absolute", right: 0, top: "110%", background: COLORS.surface, border: `1px solid ${COLORS.border}`, borderRadius: 10, minWidth: 190, zIndex: 200, boxShadow: "0 8px 24px rgba(0,0,0,0.5)", overflow: "hidden" }}>
                                <button
                                  onClick={() => { setOpenMsgMenu(null); if (window.confirm("Yeh chat sirf aapke liye delete hogi. Dusre user ko abhi bhi dikhegi.")) deleteConversation(thread.otherId); }}
                                  style={{ width: "100%", padding: "11px 16px", background: "none", border: "none", color: COLORS.danger, cursor: "pointer", textAlign: "left", fontSize: 13, fontFamily: "'DM Sans',sans-serif", fontWeight: 600, display: "flex", alignItems: "center", gap: 8 }}
                                  onMouseOver={(e) => (e.currentTarget.style.background = COLORS.danger + "15")}
                                  onMouseOut={(e) => (e.currentTarget.style.background = "none")}
                                >🗑 Delete Chat</button>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </>
              )}
            </div>
          </div>
        )}

        {/* RIGHT — Chat window */}
        {showChat && (
          activeChat ? (
            <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
              {/* Chat header */}
              <div style={{ padding: "12px 16px", borderBottom: `1px solid ${COLORS.border}`, display: "flex", alignItems: "center", gap: 12 }}>
                {isMobile && (
                  <button onClick={() => setActiveChat(null)} style={{ background: "none", border: "none", color: COLORS.accent, cursor: "pointer", fontSize: 18, padding: "0 4px" }}>←</button>
                )}
                <Avatar src={activeChat.otherAvatar} name={activeChat.otherName} size={36} />
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 700, fontSize: 14, fontFamily: "'Syne',sans-serif" }}>{activeChat.otherName || "Loading…"}</div>
                  <div style={{ fontSize: 11, color: COLORS.accent }}>🔒 End-to-end encrypted</div>
                </div>
                {/* 3-dot header menu */}
                <div style={{ position: "relative" }} onClick={(e) => e.stopPropagation()}>
                  <button
                    onClick={() => setOpenMsgMenu((v) => v === "header" ? null : "header")}
                    style={{ background: "none", border: "none", color: COLORS.muted, cursor: "pointer", fontSize: 20, padding: "4px 8px", borderRadius: 8, lineHeight: 1 }}
                    title="More options"
                  >⋮</button>
                  {openMsgMenu === "header" && (
                    <div style={{ position: "absolute", right: 0, top: "110%", background: COLORS.surface, border: `1px solid ${COLORS.border}`, borderRadius: 10, minWidth: 180, zIndex: 99, boxShadow: "0 8px 24px rgba(0,0,0,0.4)", overflow: "hidden" }}>
                      <button
                        onClick={() => { if (window.confirm("Yeh chat sirf aapke liye delete hogi. Dusre user ko abhi bhi dikhegi.")) { deleteConversation(activeChat.otherId); setOpenMsgMenu(null); } }}
                        style={{ width: "100%", padding: "11px 16px", background: "none", border: "none", color: COLORS.danger, cursor: "pointer", textAlign: "left", fontSize: 13, fontFamily: "'DM Sans',sans-serif", fontWeight: 600, display: "flex", alignItems: "center", gap: 8 }}
                        onMouseOver={(e) => (e.currentTarget.style.background = COLORS.danger + "15")}
                        onMouseOut={(e) => (e.currentTarget.style.background = "none")}
                      >🗑 Delete Chat (my side only)</button>
                    </div>
                  )}
                </div>
              </div>

              {/* Messages area */}
              <div style={{ flex: 1, overflowY: "auto", padding: "16px", display: "flex", flexDirection: "column", gap: 8 }}>
                {loadingMsgs ? (
                  <div style={{ textAlign: "center", color: COLORS.muted, padding: "40px 0" }}>Loading…</div>
                ) : messages.length === 0 ? (
                  <div style={{ textAlign: "center", color: COLORS.muted, padding: "40px 0", fontSize: 13 }}>No messages yet. Say hi! 👋</div>
                ) : (
                  <>
                    <div style={{ marginTop: "auto" }} />
                    {messages.map((m) => {
                      const isMe = m.fromId === user.id;
                      const menuKey = `msg:${m._id}`;
                      return (
                        <div key={m._id}
                          style={{ display: "flex", justifyContent: isMe ? "flex-end" : "flex-start", gap: 8, alignItems: "flex-end", position: "relative" }}
                          onMouseLeave={() => setOpenMsgMenu((v) => v === menuKey ? null : v)}
                        >
                          {!isMe && <Avatar src={m.fromAvatar} name={m.fromName} size={28} />}
                          <div style={{ maxWidth: "70%", display: "flex", flexDirection: "column", alignItems: isMe ? "flex-end" : "flex-start", gap: 2 }}>
                            <div style={{ background: isMe ? COLORS.accent : COLORS.surfaceAlt, color: isMe ? "#000" : COLORS.text, borderRadius: isMe ? "16px 16px 4px 16px" : "16px 16px 16px 4px", padding: "9px 14px", fontSize: 14, lineHeight: 1.5, fontFamily: "'DM Sans',sans-serif", wordBreak: "break-word" }}>
                              {m.type === "post_share" ? (
                                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                                  <div style={{ fontWeight: 600, fontSize: 12, opacity: 0.8 }}>Shared a post</div>
                                  {m.text && <div>{m.text}</div>}
                                  <div style={{ background: isMe ? "rgba(0,0,0,0.1)" : "rgba(255,255,255,0.05)", border: isMe ? "1px solid rgba(0,0,0,0.1)" : `1px solid ${COLORS.border}`, borderRadius: 8, padding: 10, cursor: "pointer", fontSize: 13 }}>
                                    <div style={{ fontStyle: "italic", opacity: 0.9 }}>{m.postPreview || "View post..."}</div>
                                    <div style={{ fontSize: 11, marginTop: 6, fontWeight: 700, textTransform: "uppercase" }}>Click to view post</div>
                                  </div>
                                </div>
                              ) : m.text}
                            </div>
                            <div style={{ fontSize: 10, color: COLORS.muted, display: "flex", alignItems: "center", gap: 4 }}>
                              {timeAgo(m.createdAt)}
                              {isMe && <span style={{ color: m.seen ? COLORS.blue : COLORS.muted }}>{m.seen ? "✓✓" : "✓"}</span>}
                            </div>
                          </div>
                          {/* 3-dot menu button */}
                          <div style={{ position: "relative", alignSelf: "center", flexShrink: 0 }} onClick={(e) => e.stopPropagation()}>
                            <button
                              onClick={() => setOpenMsgMenu((v) => v === menuKey ? null : menuKey)}
                              style={{ background: "none", border: "none", color: COLORS.muted, cursor: "pointer", fontSize: 16, padding: "2px 5px", borderRadius: 6, opacity: 0.6, lineHeight: 1 }}
                              title="Message options"
                            >⋮</button>
                            {openMsgMenu === menuKey && (
                              <div style={{ position: "absolute", [isMe ? "right" : "left"]: 0, top: "110%", background: COLORS.surface, border: `1px solid ${COLORS.border}`, borderRadius: 10, minWidth: 170, zIndex: 99, boxShadow: "0 8px 24px rgba(0,0,0,0.4)", overflow: "hidden" }}>
                                {isMe && (
                                  <button
                                    onClick={() => { if (window.confirm("Unsend this message? It will be removed for everyone.")) unsendMessage(m._id); }}
                                    style={{ width: "100%", padding: "10px 14px", background: "none", border: "none", color: COLORS.danger, cursor: "pointer", textAlign: "left", fontSize: 13, fontFamily: "'DM Sans',sans-serif", fontWeight: 600, display: "flex", alignItems: "center", gap: 8, borderBottom: `1px solid ${COLORS.border}` }}
                                    onMouseOver={(e) => (e.currentTarget.style.background = COLORS.danger + "15")}
                                    onMouseOut={(e) => (e.currentTarget.style.background = "none")}
                                  >↩ Unsend (everyone)</button>
                                )}
                                <button
                                  onClick={() => deleteMessage(m._id)}
                                  style={{ width: "100%", padding: "10px 14px", background: "none", border: "none", color: COLORS.muted, cursor: "pointer", textAlign: "left", fontSize: 13, fontFamily: "'DM Sans',sans-serif", fontWeight: 500, display: "flex", alignItems: "center", gap: 8 }}
                                  onMouseOver={(e) => (e.currentTarget.style.background = COLORS.surfaceAlt)}
                                  onMouseOut={(e) => (e.currentTarget.style.background = "none")}
                                >🗑 Delete (my side only)</button>
                              </div>
                            )}
                          </div>
                          {isMe && <Avatar src={user.avatar} name={user.name} size={28} />}
                        </div>
                      );
                    })}
                    <div ref={bottomRef} />
                  </>
                )}
              </div>

              {/* Input */}
              <div style={{ padding: "12px 16px", borderTop: `1px solid ${COLORS.border}`, display: "flex", gap: 10, alignItems: "flex-end" }}>
                <textarea
                  value={msgText}
                  onChange={(e) => setMsgText(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMsg(); } }}
                  placeholder="Message… (Enter to send)"
                  rows={1}
                  style={{ flex: 1, background: COLORS.surfaceAlt, border: `1px solid ${COLORS.border}`, borderRadius: 20, padding: "10px 16px", color: COLORS.text, fontSize: 14, outline: "none", resize: "none", fontFamily: "'DM Sans',sans-serif", lineHeight: 1.5, maxHeight: 100, overflowY: "auto" }}
                  onFocus={(e) => (e.target.style.borderColor = COLORS.accent)}
                  onBlur={(e) => (e.target.style.borderColor = COLORS.border)}
                />
                <button
                  onClick={sendMsg}
                  disabled={sending || !msgText.trim()}
                  style={{ width: 42, height: 42, borderRadius: "50%", background: msgText.trim() ? COLORS.accent : COLORS.surfaceAlt, border: "none", cursor: msgText.trim() ? "pointer" : "not-allowed", fontSize: 18, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, transition: "all .2s" }}
                >
                  {sending ? "…" : "➤"}
                </button>
              </div>
            </div>
          ) : (
            <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", gap: 12, color: COLORS.muted }}>
              <div style={{ fontSize: 48 }}>💬</div>
              <div style={{ fontFamily: "'Syne',sans-serif", fontSize: 18, fontWeight: 700 }}>Your Messages</div>
              <div style={{ fontSize: 13 }}>Select a conversation to start chatting</div>
            </div>
          )
        )}
      </div>
    </div>
  );
}
