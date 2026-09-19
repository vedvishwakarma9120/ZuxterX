import React, { useState, useEffect } from "react";
import { COLORS, ALL_BADGES, ROLES } from "../../config/constants";
import Avatar from "../common/Avatar";
import Card from "../common/Card";
import Btn from "../common/Btn";

import { BASE_URL } from "../../config/constants";

function BtnSpinner() {
  const [deg, setDeg] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setDeg((d) => (d + 10) % 360), 30);
    return () => clearInterval(id);
  }, []);
  return (
    <span
      style={{
        display: "inline-block",
        width: 14,
        height: 14,
        border: "2px solid rgba(0,0,0,0.2)",
        borderTop: "2px solid #000",
        borderRadius: "50%",
        transform: `rotate(${deg}deg)`,
        flexShrink: 0,
      }}
    />
  );
}

async function adminFetch(path, method = "GET", body = null) {
  const opts = {
    method,
    headers: {
      "Content-Type": "application/json",
      Authorization: "AdminBearer " + (window._adminToken || ""),
    },
  };
  if (body) opts.body = JSON.stringify(body);
  const res = await fetch(`${BASE_URL}${path}`, opts);
  return { ok: res.ok, data: await res.json() };
}

function getCss() {
  return `
    @keyframes pulse{0%,100%{opacity:1}50%{opacity:0.5}}
  `;
}

function GuestTicketReply({ ticketId, onDone }) {
  const [reply, setReply] = useState("");
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  async function send() {
    if (!reply.trim()) return;
    setSending(true);
    try {
      const res = await fetch(`${BASE_URL}/admin/ticket/${ticketId}/reply`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: "AdminBearer " + window._adminToken,
        },
        body: JSON.stringify({ reply, status: "resolved" }),
      });
      if (res.ok) {
        setSent(true);
        setTimeout(onDone, 1000);
      }
    } catch {}
    setSending(false);
  }

  if (sent)
    return (
      <div style={{ marginTop: 10, fontSize: 13, color: COLORS.accent, fontWeight: 600 }}>
        ✓ Reply sent — email dispatched to user!
      </div>
    );

  return (
    <div style={{ marginTop: 14, display: "flex", flexDirection: "column", gap: 8 }}>
      <label
        style={{
          fontSize: 11,
          color: COLORS.muted,
          fontWeight: 600,
          letterSpacing: "0.06em",
          textTransform: "uppercase",
        }}
      >
        Admin Reply{" "}
        <span style={{ color: COLORS.accent, fontWeight: 400, textTransform: "none" }}>
          (will be emailed to user)
        </span>
      </label>
      <textarea
        value={reply}
        onChange={(e) => setReply(e.target.value)}
        placeholder="Write your reply here… It will be sent to the user's email with a 'Do not reply' footer."
        rows={5}
        style={{
          width: "100%",
          background: COLORS.surfaceAlt,
          border: `1px solid ${COLORS.border}`,
          borderRadius: 10,
          padding: "12px 14px",
          color: COLORS.text,
          fontFamily: "'DM Sans',sans-serif",
          fontSize: 13,
          outline: "none",
          resize: "none",
          lineHeight: 1.7,
          boxSizing: "border-box",
          transition: "border .18s",
        }}
        onFocus={(e) => (e.target.style.borderColor = COLORS.admin)}
        onBlur={(e) => (e.target.style.borderColor = COLORS.border)}
      />
      <div style={{ display: "flex", justifyContent: "flex-end" }}>
        <button
          onClick={send}
          disabled={sending || !reply.trim()}
          style={{
            background: sending ? COLORS.admin + "55" : COLORS.admin,
            border: "none",
            borderRadius: 9,
            padding: "9px 22px",
            color: "#fff",
            cursor: sending ? "not-allowed" : "pointer",
            fontSize: 13,
            fontWeight: 700,
            fontFamily: "'Outfit',sans-serif",
            display: "flex",
            alignItems: "center",
            gap: 7,
            transition: "opacity .18s",
          }}
        >
          {sending ? (
            <>
              <BtnSpinner /> Sending…
            </>
          ) : (
            "↩ Reply & Send Email"
          )}
        </button>
      </div>
    </div>
  );
}

function TicketCard({ ticket, onReply, onDelete }) {
  const [replyText, setReplyText] = useState("");
  const [open, setOpen] = useState(false);
  const [sending, setSending] = useState(false);
  const statusColor = {
    open: COLORS.gold,
    in_progress: COLORS.blue,
    resolved: COLORS.accent,
    closed: COLORS.muted,
  };

  async function handleSend() {
    if (!replyText.trim()) return;
    setSending(true);
    await onReply(ticket._id, replyText);
    setReplyText("");
    setOpen(false);
    setSending(false);
  }

  return (
    <div
      style={{
        background: COLORS.surface,
        border: `1px solid ${ticket.status === "open" ? COLORS.gold + "33" : COLORS.border}`,
        borderRadius: 14,
        padding: "16px 18px",
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          marginBottom: 8,
        }}
      >
        <div>
          <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 4 }}>{ticket.subject}</div>
          <div style={{ fontSize: 12, color: COLORS.muted }}>
            {ticket.userName} · {ticket.userEmail} · {ticket.category} ·{" "}
            {new Date(ticket.createdAt).toLocaleString()}
          </div>
        </div>
        <div
          style={{
            display: "flex",
            gap: 8,
            alignItems: "center",
            flexShrink: 0,
            marginLeft: 10,
          }}
        >
          <span
            style={{
              fontSize: 11,
              background: (statusColor[ticket.status] || COLORS.muted) + "22",
              color: statusColor[ticket.status] || COLORS.muted,
              border: `1px solid ${statusColor[ticket.status] || COLORS.muted}44`,
              borderRadius: 6,
              padding: "3px 10px",
              fontWeight: 600,
              textTransform: "uppercase",
            }}
          >
            {ticket.status}
          </span>
          <button
            onClick={() => onDelete(ticket._id)}
            style={{
              background: COLORS.danger + "18",
              border: `1px solid ${COLORS.danger}44`,
              borderRadius: 6,
              padding: "3px 9px",
              color: COLORS.danger,
              cursor: "pointer",
              fontSize: 11,
              fontFamily: "'Outfit',sans-serif",
              fontWeight: 600,
            }}
          >
            🗑 Delete
          </button>
        </div>
      </div>
      <div
        style={{
          fontSize: 13,
          color: COLORS.text,
          lineHeight: 1.6,
          padding: "10px 12px",
          background: COLORS.surfaceAlt,
          borderRadius: 8,
          marginBottom: 10,
        }}
      >
        {ticket.message}
      </div>
      {ticket.adminReply && (
        <div
          style={{
            padding: "10px 12px",
            background: COLORS.accent + "0a",
            border: `1px solid ${COLORS.accent}22`,
            borderRadius: 8,
            marginBottom: 10,
          }}
        >
          <div style={{ fontSize: 11, color: COLORS.accent, fontWeight: 700, marginBottom: 2 }}>
            Your Reply
          </div>
          <div style={{ fontSize: 13 }}>{ticket.adminReply}</div>
        </div>
      )}
      {ticket.status !== "resolved" && (
        <div>
          <button
            onClick={() => setOpen((v) => !v)}
            style={{
              background: COLORS.admin + "18",
              border: `1px solid ${COLORS.admin}44`,
              borderRadius: 8,
              padding: "6px 14px",
              color: COLORS.admin,
              cursor: "pointer",
              fontSize: 12,
              fontFamily: "'Outfit',sans-serif",
              fontWeight: 600,
            }}
          >
            {open ? "Cancel" : "Reply & Resolve"}
          </button>
          {open && (
            <div style={{ display: "flex", gap: 8, marginTop: 10, alignItems: "center" }}>
              <input
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSend()}
                placeholder="Type your reply…"
                style={{
                  flex: 1,
                  background: COLORS.surfaceAlt,
                  border: `1px solid ${COLORS.border}`,
                  borderRadius: 8,
                  padding: "8px 12px",
                  color: COLORS.text,
                  fontFamily: "'DM Sans',sans-serif",
                  fontSize: 13,
                  outline: "none",
                  caretColor: COLORS.text,
                }}
              />
              <button
                onClick={handleSend}
                disabled={sending || !replyText.trim()}
                style={{
                  background: sending ? COLORS.admin + "55" : COLORS.admin,
                  border: "none",
                  borderRadius: 8,
                  padding: "7px 12px",
                  color: "#fff",
                  cursor: sending ? "not-allowed" : "pointer",
                  fontFamily: "'Outfit',sans-serif",
                  fontWeight: 700,
                  fontSize: 12,
                  display: "flex",
                  alignItems: "center",
                  gap: 5,
                  flexShrink: 0,
                  whiteSpace: "nowrap",
                  width: "auto",
                }}
              >
                {sending ? (
                  <>
                    <BtnSpinner /> Sending…
                  </>
                ) : (
                  "Send"
                )}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function AdminPanel({ adminEmail, onLogout }) {
  const [tab, setTab] = useState("users");
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState(null);
  const [msg, setMsg] = useState("");
  const [err, setErr] = useState("");
  const [editName, setEditName] = useState("");
  const [editEmail, setEditEmail] = useState("");
  const [editXp, setEditXp] = useState("");
  const [editStreak, setEditStreak] = useState("");
  const [badgeInput, setBadgeInput] = useState("first_plan");
  const [banDuration, setBanDuration] = useState("");
  const [showBanConfirm, setShowBanConfirm] = useState(false);
  const [loadingAction, setLoadingAction] = useState(null);
  const [tickets, setTickets] = useState([]);
  const [guestTickets, setGuestTickets] = useState([]);
  const [customAchievements, setCustomAchievements] = useState([]);
  const [connectPosts, setConnectPosts] = useState([]);
  const [onlineUsers, setOnlineUsers] = useState([]);

  const [achLabel, setAchLabel] = useState("");
  const [achDesc, setAchDesc] = useState("");
  const [achIcon, setAchIcon] = useState("🏆");
  const [achImage, setAchImage] = useState("");
  const [achType, setAchType] = useState("normal");
  const [achDuration, setAchDuration] = useState("");
  const [achPriority, setAchPriority] = useState("");
  const [achSaving, setAchSaving] = useState(false);
  const [achMsg, setAchMsg] = useState("");
  const [achGoals, setAchGoals] = useState({
    xp: "",
    streak: "",
    plans: "",
    qSets: "",
    summaries: "",
    followers: "",
  });

  const setGoal = (k, v) => setAchGoals((g) => ({ ...g, [k]: v }));

  async function loadUsers() {
    setLoading(true);
    const { ok, data } = await adminFetch("/admin/users");
    if (ok) setUsers(data);
    setLoading(false);
  }

  async function loadTickets() {
    const { ok, data } = await adminFetch("/admin/tickets");
    if (ok) setTickets(data);
  }

  async function loadGuestTickets() {
    const { ok, data } = await adminFetch("/admin/guest-tickets");
    if (ok) setGuestTickets(data);
  }

  async function loadCustomAchievements() {
    const { ok, data } = await adminFetch("/admin/achievements");
    if (ok) setCustomAchievements(data);
  }

  async function loadConnectPosts() {
    const { ok, data } = await adminFetch("/admin/connect-posts");
    if (ok) setConnectPosts(data);
  }

  async function loadOnline() {
    const { ok, data } = await adminFetch("/admin/online-users");
    if (ok) setOnlineUsers(data);
  }

  useEffect(() => {
    loadUsers();
    loadTickets();
    loadGuestTickets();
    loadCustomAchievements();
    loadConnectPosts();
    loadOnline();
    const interval = setInterval(loadOnline, 15000);
    return () => clearInterval(interval);
  }, []);

  function selectUser(u) {
    setSelected(u);
    setMsg("");
    setErr("");
    setEditName(u.name);
    setEditEmail(u.email);
    setEditXp(String(u.xp));
    setEditStreak(String(u.streak));
    setShowBanConfirm(false);
  }

  async function action(path, method = "POST", body = null, actionName = "generic") {
    setLoadingAction(actionName);
    setMsg("");
    setErr("");
    const { ok, data } = await adminFetch(path, method, body);
    if (ok) {
      setMsg(data.msg || "Done");
      loadUsers();
      if (selected) setSelected((prev) => ({ ...prev, ...(data.user || {}) }));
    } else setErr(data.msg || "Error");
    setLoadingAction(null);
  }

  async function replyTicket(ticketId, reply) {
    const { ok } = await adminFetch(`/admin/ticket/${ticketId}/reply`, "POST", {
      reply,
      status: "resolved",
    });
    if (ok) {
      loadTickets();
    }
  }

  async function deleteTicket(ticketId) {
    if (!window.confirm("Delete this ticket? This cannot be undone.")) return;
    const { ok } = await adminFetch(`/admin/ticket/${ticketId}`, "DELETE");
    if (ok) {
      loadTickets();
      loadGuestTickets();
    }
  }

  async function deleteComment(postId, commentIdx) {
    const { ok } = await adminFetch(`/admin/connect-post/${postId}/comment/${commentIdx}`, "DELETE");
    if (ok) loadConnectPosts();
  }

  async function deletePost(postId) {
    const { ok } = await adminFetch(`/admin/connect-post/${postId}`, "DELETE");
    if (ok) loadConnectPosts();
  }

  const filtered = users.filter(
    (u) =>
      u.name.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase())
  );
  const panelInput = {
    background: COLORS.surfaceAlt,
    border: `1px solid ${COLORS.border}`,
    borderRadius: 8,
    padding: "8px 12px",
    color: COLORS.text,
    fontFamily: "'DM Sans',sans-serif",
    fontSize: 13,
    outline: "none",
    width: "100%",
  };

  const tabs = [
    { id: "users", label: `👥 Users (${users.length})` },
    { id: "online", label: `🟢 Online (${onlineUsers.length})` },
    { id: "tickets", label: `🎫 Tickets (${tickets.filter((t) => t.status === "open").length} open)` },
    {
      id: "unauthorized",
      label: `🔒 Unauthorized (${guestTickets.filter((t) => t.status === "open").length} open)`,
    },
    { id: "achievements", label: `🏆 Achievements (${customAchievements.length})` },
    { id: "connect", label: `🌐 Posts (${connectPosts.length})` },
  ];

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: COLORS.bg }}>
      <style>{getCss()}</style>

      {/* LEFT — user list */}
      <div
        style={{
          width: 280,
          background: COLORS.surface,
          borderRight: `1px solid ${COLORS.border}`,
          display: "flex",
          flexDirection: "column",
          height: "100vh",
          position: "sticky",
          top: 0,
        }}
      >
        <div style={{ padding: "20px 16px", borderBottom: `1px solid ${COLORS.border}` }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
            <h2 style={{ fontFamily: "'Syne',sans-serif", fontWeight: 800, fontSize: 18 }}>
              🛡 Admin <span style={{ color: COLORS.admin }}>Panel</span>
            </h2>
            <button
              onClick={onLogout}
              style={{
                background: COLORS.danger + "22",
                border: `1px solid ${COLORS.danger}44`,
                borderRadius: 8,
                padding: "5px 10px",
                color: COLORS.danger,
                cursor: "pointer",
                fontSize: 12,
                fontFamily: "'Outfit',sans-serif",
              }}
            >
              Exit
            </button>
          </div>
          <div style={{ fontSize: 11, color: COLORS.muted, marginBottom: 12 }}>
            Logged in as <span style={{ color: COLORS.admin }}>{adminEmail}</span>
          </div>

          {/* Tab buttons */}
          <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            {tabs.map((t) => (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                style={{
                  padding: "8px 10px",
                  borderRadius: 8,
                  border: `1px solid ${tab === t.id ? COLORS.admin + "55" : COLORS.border}`,
                  background: tab === t.id ? COLORS.admin + "18" : "transparent",
                  color: tab === t.id ? COLORS.admin : COLORS.muted,
                  cursor: "pointer",
                  fontFamily: "'Outfit',sans-serif",
                  fontSize: 12,
                  fontWeight: 600,
                  textAlign: "left",
                }}
              >
                {t.label}
              </button>
            ))}
          </div>

          {tab === "users" && (
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search users…"
              style={{ ...panelInput, width: "100%", boxSizing: "border-box", marginTop: 10 }}
            />
          )}
        </div>

        <div style={{ flex: 1, overflowY: "auto" }}>
          {tab === "users" &&
            (loading ? (
              <div style={{ padding: 20, color: COLORS.muted, textAlign: "center" }}>Loading…</div>
            ) : (
              filtered.map((u) => (
                <div
                  key={u.id}
                  onClick={() => selectUser(u)}
                  style={{
                    padding: "12px 16px",
                    cursor: "pointer",
                    borderBottom: `1px solid ${COLORS.border}`,
                    background: selected?.id === u.id ? COLORS.admin + "15" : "transparent",
                    transition: "background .15s",
                    borderLeft: selected?.id === u.id ? `3px solid ${COLORS.admin}` : "3px solid transparent",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <Avatar src={u.avatar} name={u.name} size={30} />
                    <div style={{ overflow: "hidden", flex: 1 }}>
                      <div
                        style={{
                          fontSize: 13,
                          fontWeight: 600,
                          color: u.banned ? COLORS.danger : COLORS.text,
                          whiteSpace: "nowrap",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                        }}
                      >
                        {u.name}{" "}
                        {u.banned && <span style={{ fontSize: 10, color: COLORS.danger }}>BANNED</span>}
                      </div>
                      <div style={{ fontSize: 11, color: COLORS.muted }}>{u.email}</div>
                      {/* Role pills in list */}
                      {(u.roles || []).length > 0 && (
                        <div style={{ display: "flex", gap: 4, marginTop: 3, flexWrap: "wrap" }}>
                          {(u.roles || []).slice(0, 2).map((rId) => {
                            const role = ROLES.find((r) => r.id === rId);
                            if (!role) return null;
                            return (
                              <span
                                key={rId}
                                style={{
                                  fontSize: 9,
                                  background: role.color + "22",
                                  color: role.color,
                                  border: `1px solid ${role.color}44`,
                                  borderRadius: 4,
                                  padding: "1px 5px",
                                  fontWeight: 700,
                                }}
                              >
                                {role.icon} {role.label}
                              </span>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  </div>
                  <div style={{ fontSize: 10, color: COLORS.muted, marginTop: 4, display: "flex", gap: 8 }}>
                    <span>⭐ {u.xp}</span>
                    <span>🔥 {u.streak}</span>
                    <span>🏅 {(u.badges || []).length}</span>
                  </div>
                </div>
              ))
            ))}

          {tab === "online" && (
            <div style={{ padding: 16 }}>
              <div
                style={{
                  fontSize: 11,
                  color: COLORS.muted,
                  marginBottom: 12,
                  textTransform: "uppercase",
                  fontWeight: 600,
                }}
              >
                Active in last 5 min
              </div>
              {onlineUsers.length === 0 ? (
                <div style={{ color: COLORS.muted, textAlign: "center", padding: "20px 0" }}>
                  No active users right now
                </div>
              ) : (
                onlineUsers.map((u) => (
                  <div
                    key={u.id}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 10,
                      padding: "10px 0",
                      borderBottom: `1px solid ${COLORS.border}`,
                    }}
                  >
                    <div style={{ position: "relative" }}>
                      <Avatar src={u.avatar} name={u.name} size={32} />
                      <div
                        style={{
                          position: "absolute",
                          bottom: -2,
                          right: -2,
                          width: 10,
                          height: 10,
                          borderRadius: "50%",
                          background: COLORS.accent,
                          border: `2px solid ${COLORS.surface}`,
                        }}
                      />
                    </div>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 600 }}>{u.name}</div>
                      <div style={{ fontSize: 11, color: COLORS.muted }}>{u.email}</div>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </div>

      {/* RIGHT — content area */}
      <div style={{ flex: 1, padding: "24px", overflowY: "auto" }}>
        {/* USERS TAB */}
        {tab === "users" && !selected && (
          <div style={{ color: COLORS.muted, textAlign: "center", paddingTop: 80 }}>
            <div style={{ fontSize: 40, marginBottom: 16 }}>👈</div>
            <div>Select a user from the left panel to manage them</div>
            <div style={{ marginTop: 8, fontSize: 13 }}>{users.length} total users</div>
          </div>
        )}

        {tab === "users" && selected && (
          <div style={{ maxWidth: "100%", display: "flex", flexDirection: "column", gap: 20 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
              <Avatar src={selected.avatar} name={selected.name} size={56} />
              <div>
                <div style={{ fontFamily: "'Syne',sans-serif", fontWeight: 800, fontSize: 20 }}>
                  {selected.name}
                </div>
                <div style={{ color: COLORS.muted, fontSize: 13 }}>{selected.email}</div>
                <div style={{ display: "flex", gap: 8, marginTop: 6 }}>
                  {(selected.badges || []).map((b) => {
                    const badge = ALL_BADGES.find((x) => x.id === b);
                    return badge ? (
                      <span key={b} title={badge.label} style={{ fontSize: 18 }}>
                        {badge.icon}
                      </span>
                    ) : null;
                  })}
                </div>
              </div>
            </div>

            {msg && (
              <div
                style={{
                  background: COLORS.accent + "18",
                  border: `1px solid ${COLORS.accent}44`,
                  borderRadius: 10,
                  padding: "10px 14px",
                  color: COLORS.accent,
                  fontSize: 13,
                }}
              >
                ✓ {msg}
              </div>
            )}
            {err && (
              <div
                style={{
                  background: COLORS.danger + "18",
                  border: `1px solid ${COLORS.danger}44`,
                  borderRadius: 10,
                  padding: "10px 14px",
                  color: COLORS.danger,
                  fontSize: 13,
                }}
              >
                ⚠ {err}
              </div>
            )}

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                <label
                  style={{
                    fontSize: 11,
                    color: COLORS.muted,
                    fontWeight: 600,
                    letterSpacing: "0.06em",
                    textTransform: "uppercase",
                  }}
                >
                  Name
                </label>
                <input value={editName} onChange={(e) => setEditName(e.target.value)} style={panelInput} />
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                <label
                  style={{
                    fontSize: 11,
                    color: COLORS.muted,
                    fontWeight: 600,
                    letterSpacing: "0.06em",
                    textTransform: "uppercase",
                  }}
                >
                  Email
                </label>
                <input value={editEmail} onChange={(e) => setEditEmail(e.target.value)} style={panelInput} />
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                <label
                  style={{
                    fontSize: 11,
                    color: COLORS.muted,
                    fontWeight: 600,
                    letterSpacing: "0.06em",
                    textTransform: "uppercase",
                  }}
                >
                  XP
                </label>
                <input
                  value={editXp}
                  onChange={(e) => setEditXp(e.target.value)}
                  type="number"
                  style={panelInput}
                />
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                <label
                  style={{
                    fontSize: 11,
                    color: COLORS.muted,
                    fontWeight: 600,
                    letterSpacing: "0.06em",
                    textTransform: "uppercase",
                  }}
                >
                  Streak
                </label>
                <input
                  value={editStreak}
                  onChange={(e) => setEditStreak(e.target.value)}
                  type="number"
                  style={panelInput}
                />
              </div>
            </div>
            <Btn
              disabled={loadingAction === "save"}
              variant="admin"
              onClick={() =>
                action(
                  `/admin/user/${selected.id}/update`,
                  "POST",
                  { name: editName, email: editEmail, xp: parseInt(editXp), streak: parseInt(editStreak) },
                  "save"
                )
              }
            >
              {loadingAction === "save" ? (
                <>
                  <BtnSpinner /> Saving…
                </>
              ) : (
                "💾 Save Changes"
              )}
            </Btn>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 10 }}>
              <Btn
                disabled={loadingAction === "resetStreak"}
                variant="ghost"
                style={{ fontSize: 12, padding: "8px 10px" }}
                onClick={() => action(`/admin/user/${selected.id}/reset-streak`, "POST", null, "resetStreak")}
              >
                {loadingAction === "resetStreak" ? <BtnSpinner /> : "Reset Streak"}
              </Btn>
              <Btn
                disabled={loadingAction === "resetXp"}
                variant="ghost"
                style={{ fontSize: 12, padding: "8px 10px" }}
                onClick={() => action(`/admin/user/${selected.id}/reset-xp`, "POST", null, "resetXp")}
              >
                {loadingAction === "resetXp" ? <BtnSpinner /> : "Reset XP"}
              </Btn>
              <Btn
                disabled={loadingAction === "resetAll"}
                variant="ghost"
                style={{ fontSize: 12, padding: "8px 10px" }}
                onClick={() => action(`/admin/user/${selected.id}/reset-all`, "POST", null, "resetAll")}
              >
                {loadingAction === "resetAll" ? <BtnSpinner /> : "Reset All"}
              </Btn>
            </div>

            <div style={{ display: "flex", gap: 10, alignItems: "flex-end" }}>
              <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 6 }}>
                <label
                  style={{
                    fontSize: 11,
                    color: COLORS.muted,
                    fontWeight: 600,
                    letterSpacing: "0.06em",
                    textTransform: "uppercase",
                  }}
                >
                  Badge ID
                </label>
                <select
                  value={badgeInput}
                  onChange={(e) => setBadgeInput(e.target.value)}
                  style={{ ...panelInput, cursor: "pointer" }}
                >
                  {ALL_BADGES.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.icon} {b.label}
                    </option>
                  ))}
                </select>
              </div>
              <Btn
                disabled={loadingAction === "give"}
                variant="admin"
                style={{ fontSize: 12, padding: "9px 14px", display: "flex", gap: 5 }}
                onClick={() =>
                  action(`/admin/user/${selected.id}/give-badge`, "POST", { badge_id: badgeInput }, "give")
                }
              >
                {loadingAction === "give" ? <BtnSpinner /> : "Give"}
              </Btn>
              <Btn
                disabled={loadingAction === "remove"}
                variant="danger"
                style={{ fontSize: 12, padding: "9px 14px", display: "flex", gap: 5 }}
                onClick={() =>
                  action(
                    `/admin/user/${selected.id}/remove-badge`,
                    "POST",
                    { badge_id: badgeInput },
                    "remove"
                  )
                }
              >
                {loadingAction === "remove" ? <BtnSpinner /> : "Remove"}
              </Btn>
            </div>

            {showBanConfirm && !selected.banned ? (
              <div
                style={{
                  display: "flex",
                  gap: 10,
                  alignItems: "flex-end",
                  background: COLORS.danger + "11",
                  padding: 10,
                  borderRadius: 10,
                  border: `1px solid ${COLORS.danger}33`,
                }}
              >
                <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 6 }}>
                  <label
                    style={{
                      fontSize: 11,
                      color: COLORS.danger,
                      fontWeight: 700,
                      letterSpacing: "0.06em",
                      textTransform: "uppercase",
                    }}
                  >
                    Ban Duration (Days)
                  </label>
                  <input
                    value={banDuration}
                    onChange={(e) => setBanDuration(e.target.value)}
                    type="number"
                    placeholder="7"
                    style={{ ...panelInput, borderColor: COLORS.danger + "55" }}
                  />
                </div>
                <Btn
                  disabled={loadingAction === "ban"}
                  variant="danger"
                  onClick={() => {
                    action(
                      `/admin/user/${selected.id}/ban`,
                      "POST",
                      { banned: true, duration_seconds: (parseFloat(banDuration) || 7) * 86400 },
                      "ban"
                    );
                    setShowBanConfirm(false);
                  }}
                  style={{ flex: 1, fontSize: 12, padding: "9px 12px" }}
                >
                  {loadingAction === "ban" ? (
                    <>
                      <BtnSpinner /> Processing…
                    </>
                  ) : (
                    "Confirm Ban"
                  )}
                </Btn>
                <div
                  onClick={() => setShowBanConfirm(false)}
                  style={{
                    padding: "9px 12px",
                    color: COLORS.muted,
                    cursor: "pointer",
                    fontSize: 12,
                    fontWeight: 700,
                    fontFamily: "'Outfit',sans-serif",
                  }}
                >
                  Cancel
                </div>
              </div>
            ) : (
              <div style={{ display: "flex", gap: 10 }}>
                <Btn
                  disabled={loadingAction === "ban"}
                  variant={selected.banned ? "ghost" : "danger"}
                  onClick={() => {
                    if (selected.banned) {
                      action(`/admin/user/${selected.id}/ban`, "POST", { banned: false }, "ban");
                    } else {
                      setShowBanConfirm(true);
                      setBanDuration("");
                    }
                  }}
                  style={{ flex: 1 }}
                >
                  {loadingAction === "ban" ? (
                    <>
                      <BtnSpinner /> Processing…
                    </>
                  ) : selected.banned ? (
                    "✅ Unban User"
                  ) : (
                    "🚫 Ban User"
                  )}
                </Btn>
                <Btn
                  disabled={loadingAction === "delete"}
                  variant="danger"
                  onClick={() => {
                    if (window.confirm(`Delete ${selected.name}?`))
                      action(`/admin/user/${selected.id}/delete`, "DELETE", null, "delete");
                  }}
                  style={{ flex: 1 }}
                >
                  {loadingAction === "delete" ? (
                    <>
                      <BtnSpinner /> Deleting…
                    </>
                  ) : (
                    "🗑 Delete User"
                  )}
                </Btn>
              </div>
            )}

            {/* Discord-style Roles */}
            <div style={{ borderTop: `1px solid ${COLORS.border}`, paddingTop: 16 }}>
              <div
                style={{
                  fontFamily: "'Syne',sans-serif",
                  fontWeight: 700,
                  fontSize: 14,
                  marginBottom: 12,
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                }}
              >
                <span>🎭</span> Roles
                <span style={{ fontSize: 11, color: COLORS.muted, fontWeight: 400 }}>— Like Discord</span>
              </div>
              {/* Current roles */}
              <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 12 }}>
                {(selected.roles || []).length === 0 ? (
                  <span style={{ fontSize: 12, color: COLORS.muted }}>No roles assigned</span>
                ) : (
                  (selected.roles || []).map((rId) => {
                    const role = ROLES.find((r) => r.id === rId);
                    if (!role) return null;
                    return (
                      <span
                        key={rId}
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: 5,
                          background: role.color + "22",
                          border: `1px solid ${role.color}55`,
                          borderRadius: 8,
                          padding: "4px 10px",
                          fontSize: 12,
                          color: role.color,
                          fontWeight: 600,
                        }}
                      >
                        {role.icon} {role.label}
                        <button
                          onClick={() =>
                            action(`/admin/user/${selected.id}/update`, "POST", {
                              roles: (selected.roles || []).filter((r) => r !== rId),
                            })
                          }
                          style={{
                            background: "none",
                            border: "none",
                            color: role.color + "99",
                            cursor: "pointer",
                            fontSize: 14,
                            padding: 0,
                            lineHeight: 1,
                            marginLeft: 2,
                          }}
                        >
                          ×
                        </button>
                      </span>
                    );
                  })
                )}
              </div>
              {/* Add role buttons */}
              <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                {ROLES.filter((r) => !(selected.roles || []).includes(r.id)).map((role) => (
                  <button
                    key={role.id}
                    title={role.desc}
                    onClick={() =>
                      action(`/admin/user/${selected.id}/update`, "POST", {
                        roles: [...(selected.roles || []), role.id],
                      })
                    }
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 5,
                      background: COLORS.surfaceAlt,
                      border: `1px solid ${COLORS.border}`,
                      borderRadius: 8,
                      padding: "5px 12px",
                      fontSize: 12,
                      color: COLORS.muted,
                      cursor: "pointer",
                      fontFamily: "'Outfit',sans-serif",
                      fontWeight: 500,
                      transition: "all .15s",
                    }}
                    onMouseOver={(e) => {
                      e.currentTarget.style.borderColor = role.color + "66";
                      e.currentTarget.style.color = role.color;
                      e.currentTarget.style.background = role.color + "15";
                    }}
                    onMouseOut={(e) => {
                      e.currentTarget.style.borderColor = COLORS.border;
                      e.currentTarget.style.color = COLORS.muted;
                      e.currentTarget.style.background = COLORS.surfaceAlt;
                    }}
                  >
                    + {role.icon} {role.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* TICKETS TAB */}
        {tab === "tickets" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <h3 style={{ fontFamily: "'Syne',sans-serif", fontWeight: 800, fontSize: 20 }}>Support Tickets</h3>
            {tickets.length === 0 ? (
              <Card>
                <div style={{ color: COLORS.muted, textAlign: "center", padding: "30px 0" }}>
                  No tickets yet.
                </div>
              </Card>
            ) : (
              tickets.map((t) => (
                <TicketCard key={t._id} ticket={t} onReply={replyTicket} onDelete={deleteTicket} />
              ))
            )}
          </div>
        )}

        {/* UNAUTHORIZED / GUEST TICKETS TAB */}
        {tab === "unauthorized" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <div>
              <h3
                style={{
                  fontFamily: "'Syne',sans-serif",
                  fontWeight: 800,
                  fontSize: 20,
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                }}
              >
                🔒 Unauthorized Support Tickets
                {guestTickets.filter((t) => t.status === "open").length > 0 && (
                  <span
                    style={{
                      background: COLORS.danger + "22",
                      color: COLORS.danger,
                      border: `1px solid ${COLORS.danger}44`,
                      borderRadius: 8,
                      padding: "2px 10px",
                      fontSize: 13,
                      fontWeight: 700,
                    }}
                  >
                    {guestTickets.filter((t) => t.status === "open").length} open
                  </span>
                )}
              </h3>
              <p style={{ color: COLORS.muted, fontSize: 13, marginTop: 4 }}>
                These tickets come from users who couldn't log in and requested help from the sign-in screen.
              </p>
            </div>
            {guestTickets.length === 0 ? (
              <Card>
                <div style={{ textAlign: "center", color: COLORS.muted, padding: "40px 0" }}>
                  <div style={{ fontSize: 40, marginBottom: 12 }}>✅</div>
                  <div>No unauthorized support tickets. All good!</div>
                </div>
              </Card>
            ) : (
              guestTickets.map((t) => (
                <Card key={t._id}>
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "flex-start",
                      marginBottom: 12,
                      flexWrap: "wrap",
                      gap: 8,
                    }}
                  >
                    <div>
                      <div style={{ fontFamily: "'Syne',sans-serif", fontWeight: 700, fontSize: 15 }}>
                        {t.subject}
                      </div>
                      <div style={{ fontSize: 12, color: COLORS.muted, marginTop: 3 }}>
                        👤 {t.userName} &nbsp;·&nbsp; 📬 {t.userEmail} &nbsp;·&nbsp;{" "}
                        {t.createdAt ? new Date(t.createdAt).toLocaleString() : ""}
                      </div>
                    </div>
                    <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                      <span
                        style={{
                          fontSize: 11,
                          padding: "3px 9px",
                          borderRadius: 6,
                          border: `1px solid ${t.status === "open" ? COLORS.danger + "55" : COLORS.accent + "44"}`,
                          background: t.status === "open" ? COLORS.danger + "15" : COLORS.accent + "12",
                          color: t.status === "open" ? COLORS.danger : COLORS.accent,
                          fontWeight: 700,
                          textTransform: "uppercase",
                        }}
                      >
                        {t.status}
                      </span>
                      <button
                        onClick={() => deleteTicket(t._id)}
                        style={{
                          background: COLORS.danger + "18",
                          border: `1px solid ${COLORS.danger}33`,
                          borderRadius: 7,
                          padding: "4px 10px",
                          color: COLORS.danger,
                          cursor: "pointer",
                          fontSize: 11,
                        }}
                      >
                        🗑 Delete
                      </button>
                    </div>
                  </div>
                  <div
                    style={{
                      background: COLORS.surfaceAlt,
                      border: `1px solid ${COLORS.border}`,
                      borderRadius: 10,
                      padding: "12px 14px",
                      fontSize: 13,
                      color: COLORS.text,
                      lineHeight: 1.6,
                      marginBottom: t.adminReply ? 12 : 0,
                    }}
                  >
                    {t.message}
                  </div>
                  {t.adminReply && (
                    <div
                      style={{
                        marginTop: 10,
                        background: COLORS.accent + "0a",
                        border: `1px solid ${COLORS.accent}22`,
                        borderRadius: 10,
                        padding: "10px 14px",
                        fontSize: 13,
                        color: COLORS.accent,
                      }}
                    >
                      <strong>Admin reply:</strong> {t.adminReply}
                    </div>
                  )}
                  {!t.adminReply && (
                    <GuestTicketReply
                      ticketId={t._id}
                      onDone={() => {
                        loadGuestTickets();
                      }}
                    />
                  )}
                </Card>
              ))
            )}
          </div>
        )}

        {/* ACHIEVEMENTS TAB */}
        {tab === "achievements" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
            <h3 style={{ fontFamily: "'Syne',sans-serif", fontWeight: 800, fontSize: 20 }}>
              🏆 Custom Achievements
            </h3>

            {/* CREATE FORM */}
            <Card style={{ border: `1px solid ${COLORS.gold}33` }}>
              <div
                style={{
                  fontFamily: "'Syne',sans-serif",
                  fontWeight: 700,
                  fontSize: 15,
                  marginBottom: 16,
                  color: COLORS.gold,
                }}
              >
                + Add New Achievement
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  <label style={{ fontSize: 11, color: COLORS.muted, fontWeight: 600, textTransform: "uppercase" }}>
                    Achievement Name *
                  </label>
                  <input
                    value={achLabel}
                    onChange={(e) => setAchLabel(e.target.value)}
                    placeholder="e.g. Community Star"
                    style={panelInput}
                  />
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  <label style={{ fontSize: 11, color: COLORS.muted, fontWeight: 600, textTransform: "uppercase" }}>
                    Icon (Emoji)
                  </label>
                  <input
                    value={achIcon}
                    onChange={(e) => setAchIcon(e.target.value)}
                    placeholder="🏆"
                    maxLength={4}
                    style={{ ...panelInput, fontSize: 22, textAlign: "center", width: 70 }}
                  />
                </div>
              </div>
              {/* Type toggle + Duration + Priority */}
              <div style={{ marginTop: 16, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  <label style={{ fontSize: 11, color: COLORS.muted, fontWeight: 600, textTransform: "uppercase" }}>
                    Achievement Type
                  </label>
                  <div style={{ display: "flex", borderRadius: 8, overflow: "hidden", border: `1px solid ${COLORS.border}` }}>
                    {["normal", "special"].map((t) => (
                      <button
                        key={t}
                        onClick={() => setAchType(t)}
                        style={{
                          flex: 1,
                          padding: "9px 0",
                          border: "none",
                          background:
                            achType === t ? (t === "special" ? COLORS.gold : COLORS.accent) : "transparent",
                          color: achType === t ? "#000" : COLORS.muted,
                          fontWeight: 700,
                          fontSize: 12,
                          cursor: "pointer",
                          fontFamily: "'Outfit',sans-serif",
                          textTransform: "capitalize",
                          transition: "all .18s",
                        }}
                      >
                        {t === "special" ? "⭐ Special" : "🏅 Normal"}
                      </button>
                    ))}
                  </div>
                  {achType === "special" && (
                    <div
                      style={{
                        fontSize: 11,
                        color: COLORS.gold,
                        background: COLORS.gold + "12",
                        borderRadius: 7,
                        padding: "6px 10px",
                      }}
                    >
                      ⭐ Profile card mein naam ke niche dikhega. Sabse zyada priority wala badge dikhega.
                    </div>
                  )}
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  <label style={{ fontSize: 11, color: COLORS.muted, fontWeight: 600, textTransform: "uppercase" }}>
                    Duration (Days)
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={achDuration}
                    onChange={(e) => setAchDuration(e.target.value)}
                    placeholder="0 = Never expires"
                    style={{ ...panelInput, padding: "9px 12px" }}
                  />
                  <div style={{ fontSize: 11, color: COLORS.muted }}>Leave blank or 0 for permanent.</div>
                </div>
              </div>
              {/* Priority — only for special achievements */}
              {achType === "special" && (
                <div style={{ marginTop: 12, display: "flex", flexDirection: "column", gap: 6 }}>
                  <label style={{ fontSize: 11, color: COLORS.gold, fontWeight: 700, textTransform: "uppercase" }}>
                    ⭐ Priority (Profile Card)
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={achPriority}
                    onChange={(e) => setAchPriority(e.target.value)}
                    placeholder="e.g. 10 (higher = shown first)"
                    style={{ ...panelInput, padding: "9px 12px", borderColor: COLORS.gold + "55" }}
                  />
                  <div style={{ fontSize: 11, color: COLORS.muted }}>
                    Agar kisi user ke paas multiple special badges hain, sabse zyada priority wala profile card
                    mein dikhega.
                  </div>
                </div>
              )}
              <div style={{ marginTop: 16, display: "flex", flexDirection: "column", gap: 6 }}>
                <label
                  style={{
                    fontSize: 11,
                    color: COLORS.gold,
                    fontWeight: 700,
                    textTransform: "uppercase",
                    letterSpacing: "0.06em",
                  }}
                >
                  🎯 Auto-Award Goals{" "}
                  <span style={{ color: COLORS.muted, fontWeight: 400, textTransform: "none" }}>
                    (leave blank = no requirement)
                  </span>
                </label>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(140px,1fr))", gap: 8 }}>
                  {[
                    { key: "xp", label: "Min XP", placeholder: "e.g. 100" },
                    { key: "streak", label: "Day Streak", placeholder: "e.g. 7" },
                    { key: "plans", label: "Study Plans", placeholder: "e.g. 5" },
                    { key: "qSets", label: "Question Sets", placeholder: "e.g. 10" },
                    { key: "summaries", label: "Summaries", placeholder: "e.g. 3" },
                    { key: "followers", label: "Followers", placeholder: "e.g. 20" },
                  ].map((g) => (
                    <div key={g.key} style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                      <label
                        style={{
                          fontSize: 10,
                          color: COLORS.muted,
                          fontWeight: 600,
                          textTransform: "uppercase",
                        }}
                      >
                        {g.label}
                      </label>
                      <input
                        type="number"
                        min="0"
                        value={achGoals[g.key]}
                        onChange={(e) => setGoal(g.key, e.target.value)}
                        placeholder={g.placeholder}
                        style={{ ...panelInput, padding: "7px 10px" }}
                      />
                    </div>
                  ))}
                </div>
                <div style={{ fontSize: 11, color: COLORS.muted, marginTop: 2 }}>
                  Users are auto-awarded when they meet ALL filled-in goals. Leave all blank = admin must grant
                  manually.
                </div>
              </div>
              <div style={{ marginTop: 12, display: "flex", flexDirection: "column", gap: 6 }}>
                <label style={{ fontSize: 11, color: COLORS.muted, fontWeight: 600, textTransform: "uppercase" }}>
                  Description
                </label>
                <input
                  value={achDesc}
                  onChange={(e) => setAchDesc(e.target.value)}
                  placeholder="What does this achievement represent?"
                  style={panelInput}
                />
              </div>
              <div style={{ marginTop: 12, display: "flex", flexDirection: "column", gap: 6 }}>
                <label style={{ fontSize: 11, color: COLORS.muted, fontWeight: 600, textTransform: "uppercase" }}>
                  Custom Image (optional — replaces emoji)
                </label>
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <label
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 8,
                      background: COLORS.surfaceAlt,
                      border: `1px solid ${COLORS.border}`,
                      borderRadius: 8,
                      padding: "8px 14px",
                      cursor: "pointer",
                      fontSize: 13,
                      color: COLORS.muted,
                      fontWeight: 500,
                    }}
                  >
                    🖼️ Choose Image
                    <input
                      type="file"
                      accept="image/*"
                      style={{ display: "none" }}
                      onChange={(e) => {
                        const file = e.target.files[0];
                        if (!file) return;
                        const reader = new FileReader();
                        reader.onload = (ev) => setAchImage(ev.target.result);
                        reader.readAsDataURL(file);
                      }}
                    />
                  </label>
                  {achImage ? (
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <img
                        src={achImage}
                        alt="preview"
                        style={{
                          width: 48,
                          height: 48,
                          borderRadius: 10,
                          objectFit: "cover",
                          border: `1px solid ${COLORS.border}`,
                        }}
                      />
                      <button
                        onClick={() => setAchImage("")}
                        style={{ background: "none", border: "none", color: COLORS.danger, cursor: "pointer", fontSize: 12 }}
                      >
                        Remove
                      </button>
                    </div>
                  ) : (
                    <span style={{ fontSize: 12, color: COLORS.muted }}>
                      No image selected — emoji will be used
                    </span>
                  )}
                </div>
              </div>
              {achMsg && (
                <div
                  style={{
                    marginTop: 10,
                    fontSize: 13,
                    color: achMsg.includes("Error") ? COLORS.danger : COLORS.accent,
                    fontWeight: 600,
                  }}
                >
                  {achMsg}
                </div>
              )}
              <div style={{ marginTop: 16, display: "flex", justifyContent: "flex-end" }}>
                <button
                  disabled={achSaving || !achLabel.trim()}
                  onClick={async () => {
                    setAchSaving(true);
                    setAchMsg("");
                    const { ok, data } = await adminFetch("/admin/achievements", "POST", {
                      label: achLabel,
                      desc: achDesc,
                      icon: achIcon || "🏆",
                      image: achImage,
                      goals: achGoals,
                      type: achType,
                      durationDays: achDuration || 0,
                      priority: achPriority || 0,
                    });
                    if (ok) {
                      setAchLabel("");
                      setAchDesc("");
                      setAchIcon("🏆");
                      setAchImage("");
                      setAchGoals({ xp: "", streak: "", plans: "", qSets: "", summaries: "", followers: "" });
                      setAchType("normal");
                      setAchDuration("");
                      setAchPriority("");
                      setAchMsg("✓ Achievement created!");
                      loadCustomAchievements();
                      setTimeout(() => setAchMsg(""), 2500);
                    } else {
                      setAchMsg("Error: " + (data?.msg || "Failed"));
                    }
                    setAchSaving(false);
                  }}
                  style={{
                    background: achSaving || !achLabel.trim() ? COLORS.gold + "44" : COLORS.gold,
                    border: "none",
                    borderRadius: 9,
                    padding: "10px 24px",
                    color: "#000",
                    fontWeight: 700,
                    fontSize: 13,
                    cursor: achSaving || !achLabel.trim() ? "not-allowed" : "pointer",
                    fontFamily: "'Outfit',sans-serif",
                    display: "flex",
                    alignItems: "center",
                    gap: 7,
                  }}
                >
                  {achSaving ? (
                    <>
                      <BtnSpinner /> Saving…
                    </>
                  ) : (
                    "🏆 Create Achievement"
                  )}
                </button>
              </div>
            </Card>

            {/* LIST */}
            {customAchievements.length === 0 ? (
              <Card>
                <div style={{ color: COLORS.muted, textAlign: "center", padding: "32px 0", fontSize: 13 }}>
                  No custom achievements yet. Create your first one above! 🏆
                </div>
              </Card>
            ) : (
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fill, minmax(200px,1fr))",
                  gap: 14,
                }}
              >
                {customAchievements.map((a) => (
                  <Card
                    key={a.id}
                    style={{
                      textAlign: "center",
                      padding: "20px 14px",
                      position: "relative",
                      border: `1px solid ${COLORS.gold}33`,
                    }}
                  >
                    <button
                      onClick={async () => {
                        if (window.confirm("Delete this achievement?")) {
                          await adminFetch(`/admin/achievements/${a.id}`, "DELETE");
                          loadCustomAchievements();
                        }
                      }}
                      style={{
                        position: "absolute",
                        top: 8,
                        right: 8,
                        background: COLORS.danger + "18",
                        border: `1px solid ${COLORS.danger}33`,
                        borderRadius: 6,
                        padding: "3px 8px",
                        color: COLORS.danger,
                        cursor: "pointer",
                        fontSize: 11,
                        fontWeight: 600,
                      }}
                    >
                      🗑
                    </button>
                    {a.image ? (
                      <img
                        src={a.image}
                        alt={a.label}
                        style={{
                          width: 56,
                          height: 56,
                          borderRadius: 12,
                          objectFit: "cover",
                          margin: "0 auto 10px",
                          display: "block",
                          border: `2px solid ${COLORS.gold}44`,
                        }}
                      />
                    ) : (
                      <div style={{ fontSize: 40, marginBottom: 10 }}>{a.icon}</div>
                    )}
                    <div style={{ fontFamily: "'Syne',sans-serif", fontWeight: 700, fontSize: 14, color: COLORS.gold }}>
                      {a.label}
                    </div>
                    <div style={{ fontSize: 12, color: COLORS.muted, marginTop: 6, lineHeight: 1.5 }}>
                      {a.desc}
                    </div>
                    <div style={{ fontSize: 10, color: COLORS.muted, marginTop: 8 }}>
                      {a.createdAt ? new Date(a.createdAt).toLocaleDateString() : ""}
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </div>
        )}

        {/* CONNECT POSTS TAB */}
        {tab === "connect" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <h3 style={{ fontFamily: "'Syne',sans-serif", fontWeight: 800, fontSize: 20 }}>
              ZuxterConnect Posts
            </h3>
            {connectPosts.length === 0 ? (
              <Card>
                <div style={{ color: COLORS.muted, textAlign: "center", padding: "30px 0" }}>
                  No posts yet.
                </div>
              </Card>
            ) : (
              connectPosts.map((p) => (
                <div
                  key={p._id}
                  style={{
                    background: COLORS.surface,
                    border: `1px solid ${COLORS.border}`,
                    borderRadius: 14,
                    padding: "16px 18px",
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                    <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                      <Avatar src={p.authorAvatar} name={p.authorName} size={34} />
                      <div>
                        <div style={{ fontWeight: 700, fontSize: 13 }}>{p.authorName}</div>
                        <div style={{ fontSize: 11, color: COLORS.muted }}>
                          {p.authorEmail} · {new Date(p.createdAt).toLocaleString()}
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={() => {
                        if (window.confirm("Delete this post?")) deletePost(p._id);
                      }}
                      style={{
                        background: COLORS.danger + "18",
                        border: `1px solid ${COLORS.danger}44`,
                        borderRadius: 7,
                        padding: "4px 10px",
                        color: COLORS.danger,
                        cursor: "pointer",
                        fontSize: 12,
                        fontFamily: "'Outfit',sans-serif",
                      }}
                    >
                      Delete
                    </button>
                  </div>
                  {p.text && (
                    <p style={{ fontSize: 13, color: COLORS.text, marginTop: 10, lineHeight: 1.6 }}>
                      {p.text}
                    </p>
                  )}
                  {p.image && (
                    <img
                      src={p.image}
                      alt=""
                      style={{ maxHeight: 200, width: "100%", objectFit: "cover", borderRadius: 8, marginTop: 8 }}
                    />
                  )}
                  <div style={{ fontSize: 11, color: COLORS.muted, marginTop: 8 }}>
                    ❤️ {(p.likes || []).length} · 💬 {(p.comments || []).length}
                  </div>
                  {(p.comments || []).length > 0 && (
                    <div style={{ marginTop: 10, borderTop: `1px solid ${COLORS.border}`, paddingTop: 8 }}>
                      <div style={{ fontSize: 11, color: COLORS.muted, fontWeight: 600, marginBottom: 6 }}>
                        Comments
                      </div>
                      {(p.comments || []).map((c, ci) => (
                        <div
                          key={ci}
                          style={{
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "flex-start",
                            padding: "5px 8px",
                            background: COLORS.surfaceAlt,
                            borderRadius: 7,
                            marginBottom: 4,
                          }}
                        >
                          <div>
                            <span
                              style={{
                                fontWeight: 700,
                                fontSize: 11,
                                color: COLORS.accent,
                                marginRight: 6,
                              }}
                            >
                              {c.authorName}
                            </span>
                            <span style={{ fontSize: 12, color: COLORS.text }}>{c.text}</span>
                          </div>
                          <button
                            onClick={() => {
                              if (window.confirm("Delete this comment?")) deleteComment(p._id, ci);
                            }}
                            style={{
                              background: COLORS.danger + "18",
                              border: `1px solid ${COLORS.danger}44`,
                              borderRadius: 5,
                              padding: "2px 7px",
                              color: COLORS.danger,
                              cursor: "pointer",
                              fontSize: 10,
                              fontFamily: "'Outfit',sans-serif",
                              flexShrink: 0,
                              marginLeft: 8,
                            }}
                          >
                            ×
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        )}

        {/* ONLINE TAB */}
        {tab === "online" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <h3 style={{ fontFamily: "'Syne',sans-serif", fontWeight: 800, fontSize: 20 }}>Online Users</h3>
              <button
                onClick={loadOnline}
                style={{
                  background: COLORS.accent + "18",
                  border: `1px solid ${COLORS.accent}44`,
                  borderRadius: 8,
                  padding: "5px 12px",
                  color: COLORS.accent,
                  cursor: "pointer",
                  fontSize: 12,
                  fontFamily: "'Outfit',sans-serif",
                }}
              >
                ↻ Refresh
              </button>
            </div>
            <div style={{ color: COLORS.muted, fontSize: 13 }}>
              Users active in the last 5 minutes:{" "}
              <span style={{ color: COLORS.accent, fontWeight: 700 }}>{onlineUsers.length}</span>
            </div>
            {onlineUsers.length === 0 ? (
              <Card>
                <div style={{ color: COLORS.muted, textAlign: "center", padding: "30px 0" }}>
                  No users currently active.
                </div>
              </Card>
            ) : (
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fill,minmax(200px,1fr))",
                  gap: 12,
                }}
              >
                {onlineUsers.map((u) => (
                  <div
                    key={u.id}
                    style={{
                      background: COLORS.surface,
                      border: `1px solid ${COLORS.accent}22`,
                      borderRadius: 12,
                      padding: "14px 16px",
                      display: "flex",
                      alignItems: "center",
                      gap: 12,
                    }}
                  >
                    <div style={{ position: "relative" }}>
                      <Avatar src={u.avatar} name={u.name} size={38} />
                      <div
                        style={{
                          position: "absolute",
                          bottom: -2,
                          right: -2,
                          width: 11,
                          height: 11,
                          borderRadius: "50%",
                          background: COLORS.accent,
                          border: `2px solid ${COLORS.surface}`,
                          animation: "pulse 2s infinite",
                        }}
                      />
                    </div>
                    <div style={{ overflow: "hidden" }}>
                      <div
                        style={{
                          fontWeight: 600,
                          fontSize: 13,
                          whiteSpace: "nowrap",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                        }}
                      >
                        {u.name}
                      </div>
                      <div style={{ fontSize: 11, color: COLORS.muted }}>⭐ {u.xp} XP</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
