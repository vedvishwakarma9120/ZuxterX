import React, { useState, useEffect } from "react";
import { COLORS, BASE_URL, CACHE_TTL } from "../../config/constants";
import Card from "../common/Card";
import Btn from "../common/Btn";
import { cachedFetch, cacheDel } from "../../utils/cache";


export default function SupportPage({ user }) {
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [category, setCategory] = useState("bug");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [err, setErr] = useState("");
  const [myTickets, setMyTickets] = useState([]);

  useEffect(() => {
    if (submitted) cacheDel("myTickets");
    cachedFetch(
      "myTickets",
      `${BASE_URL}/support/my-tickets`,
      { headers: { Authorization: "Bearer " + window._authToken } },
      CACHE_TTL.myTickets,
      (d) => { if (Array.isArray(d)) setMyTickets(d); }
    );
  }, [submitted]);

  async function submitTicket() {
    if (!subject.trim() || !message.trim()) { setErr("Please fill in all fields."); return; }
    setSubmitting(true); setErr("");
    try {
      const res = await fetch(`${BASE_URL}/support/ticket`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: "Bearer " + window._authToken },
        body: JSON.stringify({ subject, message, category }),
      });
      const data = await res.json();
      if (!res.ok) { setErr(data.msg || "Error submitting ticket"); setSubmitting(false); return; }
      setSubmitted(true); setSubject(""); setMessage(""); setCategory("bug");
      setTimeout(() => setSubmitted(false), 4000);
    } catch { setErr("Server error"); }
    setSubmitting(false);
  }

  const categories = [
    { id: "bug", label: "🐛 Bug Report" },
    { id: "feature", label: "💡 Feature Request" },
    { id: "account", label: "👤 Account Issue" },
    { id: "other", label: "📌 Other" },
  ];

  const statusColor = { open: COLORS.gold, in_progress: COLORS.blue, resolved: COLORS.accent, closed: COLORS.muted };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20, maxWidth: "100%" }}>
      <div>
        <h2 style={{ fontFamily: "'Syne',sans-serif", fontSize: 26, fontWeight: 800 }}>🎫 Support</h2>
        <p style={{ color: COLORS.muted, marginTop: 4, fontSize: 14 }}>Report a bug or request a feature. We'll get back to you soon.</p>
      </div>

      <Card glow>
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div style={{ fontFamily: "'Syne',sans-serif", fontWeight: 700, fontSize: 15 }}>Submit a Ticket</div>

          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            {categories.map((c) => (
              <button key={c.id} onClick={() => setCategory(c.id)}
                style={{ padding: "7px 14px", borderRadius: 8, border: `1px solid ${category === c.id ? COLORS.pink + "77" : COLORS.border}`, background: category === c.id ? COLORS.pink + "18" : "transparent", color: category === c.id ? COLORS.pink : COLORS.muted, cursor: "pointer", fontFamily: "'Outfit',sans-serif", fontSize: 12, fontWeight: 600 }}>
                {c.label}
              </button>
            ))}
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <label style={{ fontSize: 11, color: COLORS.muted, fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase" }}>Subject</label>
            <input value={subject} onChange={(e) => setSubject(e.target.value)} placeholder="Brief summary of the issue…"
              style={{ background: COLORS.surfaceAlt, border: `1px solid ${COLORS.border}`, borderRadius: 10, padding: "11px 14px", color: COLORS.text, fontFamily: "'DM Sans',sans-serif", fontSize: 14, outline: "none" }}
              onFocus={(e) => (e.target.style.borderColor = COLORS.pink)}
              onBlur={(e) => (e.target.style.borderColor = COLORS.border)} />
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <label style={{ fontSize: 11, color: COLORS.muted, fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase" }}>Description</label>
            <textarea value={message} onChange={(e) => setMessage(e.target.value)} placeholder="Describe the issue in detail…" rows={5}
              style={{ background: COLORS.surfaceAlt, border: `1px solid ${COLORS.border}`, borderRadius: 10, padding: "11px 14px", color: COLORS.text, fontFamily: "'DM Sans',sans-serif", fontSize: 14, outline: "none", resize: "vertical" }}
              onFocus={(e) => (e.target.style.borderColor = COLORS.pink)}
              onBlur={(e) => (e.target.style.borderColor = COLORS.border)} />
          </div>

          {err && <div style={{ background: COLORS.danger + "18", border: `1px solid ${COLORS.danger}44`, borderRadius: 10, padding: "10px 14px", color: COLORS.danger, fontSize: 13 }}>⚠ {err}</div>}
          {submitted && <div style={{ background: COLORS.accent + "12", border: `1px solid ${COLORS.accent}33`, borderRadius: 10, padding: "10px 14px", color: COLORS.accent, fontSize: 13 }}>✓ Ticket submitted! We'll review it soon.</div>}

          <Btn onClick={submitTicket} disabled={submitting} style={{ background: COLORS.pink, color: "#fff" }}>
            {submitting ? "Submitting…" : "🎫 Submit Ticket"}
          </Btn>
        </div>
      </Card>

      {myTickets.length > 0 && (
        <Card>
          <div style={{ fontFamily: "'Syne',sans-serif", fontWeight: 700, fontSize: 15, marginBottom: 16 }}>Your Tickets</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {myTickets.map((t) => (
              <div key={t._id} style={{ padding: "12px 14px", background: COLORS.surfaceAlt, borderRadius: 10, border: `1px solid ${COLORS.border}` }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
                  <span style={{ fontWeight: 600, fontSize: 13 }}>{t.subject}</span>
                  <span style={{ fontSize: 11, background: (statusColor[t.status] || COLORS.muted) + "22", color: statusColor[t.status] || COLORS.muted, border: `1px solid ${(statusColor[t.status] || COLORS.muted)}44`, borderRadius: 6, padding: "2px 8px", fontWeight: 600, textTransform: "uppercase" }}>{t.status}</span>
                </div>
                <div style={{ fontSize: 12, color: COLORS.muted }}>{t.category} · {new Date(t.createdAt).toLocaleDateString()}</div>
                {t.adminReply && (
                  <div style={{ marginTop: 8, padding: "8px 10px", background: COLORS.accent + "0a", border: `1px solid ${COLORS.accent}22`, borderRadius: 8 }}>
                    <div style={{ fontSize: 11, color: COLORS.accent, fontWeight: 700, marginBottom: 2 }}>Admin Reply</div>
                    <div style={{ fontSize: 13, color: COLORS.text }}>{t.adminReply}</div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}
