import React, { useState, useEffect } from "react";
import { COLORS, ALL_BADGES, BASE_URL, CACHE_TTL } from "../../config/constants";
import Card from "../common/Card";
import Tag from "../common/Tag";
import { cacheGet, cacheSet } from "../../utils/cache";


export default function BadgesPage({ user }) {
  const earned = new Set(user.badges || []);
  const [activeAchs, setActiveAchs] = useState([]);
  const [customBadges, setCustomBadges] = useState([]);
  const [stats, setStats] = useState({});
  const [newlyEarned, setNewlyEarned] = useState([]);
  const [showNew, setShowNew] = useState(false);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    const cached = cacheGet("achievements");
    if (cached.data) {
      const d = cached.data;
      setActiveAchs(d.active || []); setCustomBadges(d.customBadges || []); setStats(d.stats || {});
      if (cached.fresh) { setChecking(false); return; }
    }
    (async () => {
      try {
        const res = await fetch(`${BASE_URL}/achievements/check`, {
          method: "POST",
          headers: { Authorization: "Bearer " + window._authToken, "Content-Type": "application/json" },
        });
        if (res.ok) {
          const d = await res.json();
          cacheSet("achievements", d, CACHE_TTL.achievements);
          setActiveAchs(d.active || []);
          setCustomBadges(d.customBadges || []);
          setStats(d.stats || {});
          if ((d.newly_awarded || []).length > 0) { setNewlyEarned(d.newly_awarded); setShowNew(true); }
        }
      } catch {}
      setChecking(false);
    })();
  }, []);

  const GOAL_LABELS = { xp: "XP", streak: "Day Streak", plans: "Study Plans", qSets: "Question Sets", summaries: "Summaries", followers: "Followers" };

  function GoalProgress({ goals, progress }) {
    if (!goals || Object.keys(goals).length === 0) return null;
    return (
      <div style={{ marginTop: 8, display: "flex", flexDirection: "column", gap: 5, textAlign: "left" }}>
        {Object.entries(goals).map(([k, target]) => {
          const current = (progress || {})[k] || 0;
          const pct = Math.min(100, Math.round((current / target) * 100));
          return (
            <div key={k}>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 10, color: COLORS.muted, marginBottom: 2 }}>
                <span>{GOAL_LABELS[k] || k}</span><span>{current}/{target}</span>
              </div>
              <div style={{ height: 4, background: COLORS.border, borderRadius: 4, overflow: "hidden" }}>
                <div style={{ height: "100%", width: `${pct}%`, background: pct >= 100 ? COLORS.accent : COLORS.gold, borderRadius: 4, transition: "width .5s" }} />
              </div>
            </div>
          );
        })}
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      {/* Newly earned toast */}
      {showNew && (
        <div style={{ position: "fixed", top: 24, right: 24, zIndex: 9999, background: COLORS.surface, border: `2px solid ${COLORS.gold}`, borderRadius: 16, padding: "18px 24px", boxShadow: "0 8px 32px rgba(0,0,0,0.6)", minWidth: 260, animation: "badgePop .5s ease both" }}>
          <div style={{ fontSize: 28, marginBottom: 6 }}>🎉</div>
          <div style={{ fontFamily: "'Syne',sans-serif", fontWeight: 800, fontSize: 15, color: COLORS.gold }}>New Achievement Unlocked!</div>
          {newlyEarned.map((a) => (
            <div key={a.id} style={{ marginTop: 8, display: "flex", gap: 8, alignItems: "center" }}>
              {a.image ? <img src={a.image} style={{ width: 28, height: 28, borderRadius: 6 }} alt={a.label} /> : <span style={{ fontSize: 22 }}>{a.icon}</span>}
              <span style={{ fontWeight: 600, fontSize: 13 }}>{a.label}</span>
            </div>
          ))}
          <button onClick={() => setShowNew(false)} style={{ marginTop: 12, width: "100%", background: COLORS.gold, border: "none", borderRadius: 8, padding: "7px 0", color: "#000", fontWeight: 700, cursor: "pointer", fontSize: 13 }}>Awesome! 🎯</button>
        </div>
      )}

      <div>
        <h2 style={{ fontFamily: "'Syne',sans-serif", fontSize: 26, fontWeight: 800 }}>Achievements</h2>
        <p style={{ color: COLORS.muted, marginTop: 4, fontSize: 14 }}>Earn badges by using ZuxterX consistently.</p>
      </div>

      {/* Standard badges */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(180px,1fr))", gap: 14 }}>
        {ALL_BADGES.map((b) => {
          const has = earned.has(b.id);
          return (
            <Card key={b.id} style={{ textAlign: "center", padding: "24px 16px", border: `1px solid ${has ? COLORS.gold + "55" : COLORS.border}`, background: has ? COLORS.gold + "0a" : COLORS.surface, opacity: has ? 1 : .45, filter: has ? "none" : "grayscale(1)", animation: has ? "badgePop .5s ease both" : "fadeUp .4s ease" }}>
              <div style={{ fontSize: 36, marginBottom: 10 }}>{b.icon}</div>
              <div style={{ fontFamily: "'Syne',sans-serif", fontWeight: 700, fontSize: 14, color: has ? COLORS.gold : COLORS.muted }}>{b.label}</div>
              <div style={{ fontSize: 12, color: COLORS.muted, marginTop: 6, lineHeight: 1.5 }}>{b.desc}</div>
              {has && <Tag color={COLORS.gold}>Earned</Tag>}
            </Card>
          );
        })}
        {customBadges.filter((b) => b && b.id).map((b) => (
          <Card key={"custom-" + b.id} style={{ textAlign: "center", padding: "24px 16px", border: `1px solid ${COLORS.gold}55`, background: COLORS.gold + "0a", animation: "badgePop .5s ease both" }}>
            {b.image ? <img src={b.image} alt={b.label} style={{ width: 48, height: 48, borderRadius: 10, objectFit: "cover", margin: "0 auto 10px", display: "block", border: `2px solid ${COLORS.gold}44` }} /> : <div style={{ fontSize: 36, marginBottom: 10 }}>{b.icon || "🏆"}</div>}
            <div style={{ fontFamily: "'Syne',sans-serif", fontWeight: 700, fontSize: 14, color: COLORS.gold }}>{b.label}</div>
            {b.desc && <div style={{ fontSize: 12, color: COLORS.muted, marginTop: 6, lineHeight: 1.5 }}>{b.desc}</div>}
            <div style={{ display: "flex", gap: 4, justifyContent: "center", flexWrap: "wrap", marginTop: 6 }}>
              {b.type === "special" && <Tag color={COLORS.gold}>⭐ Special</Tag>}
              <Tag color={COLORS.gold}>Earned ✓</Tag>
            </div>
          </Card>
        ))}
      </div>

      {/* Custom/Special Achievements */}
      {!checking && activeAchs.length > 0 && (
        <>
          <div>
            <h3 style={{ fontFamily: "'Syne',sans-serif", fontSize: 18, fontWeight: 700, color: COLORS.gold }}>🏆 Special Achievements</h3>
            <p style={{ color: COLORS.muted, fontSize: 13, marginTop: 3 }}>Awarded by the ZuxterX team. Complete the goals to unlock.</p>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(200px,1fr))", gap: 14 }}>
            {activeAchs.map((a) => {
              const hasGoals = a.goals && Object.keys(a.goals).length > 0;
              const isSpecial = a.type === "special";
              let daysLeft = null;
              if (a.expiresAt) { const diff = Math.ceil((new Date(a.expiresAt) - Date.now()) / 86400000); if (diff > 0) daysLeft = diff; }
              return (
                <Card key={a.id} style={{ textAlign: "center", padding: "22px 16px", border: `1px solid ${a.earned ? COLORS.gold + "55" : isSpecial ? COLORS.gold + "33" : COLORS.border}`, background: a.earned ? COLORS.gold + "0a" : COLORS.surface, opacity: a.earned ? 1 : 0.75, animation: a.earned ? "badgePop .5s ease both" : "fadeUp .4s ease", position: "relative" }}>
                  {isSpecial && <div style={{ position: "absolute", top: 8, right: 8, fontSize: 13 }}>⭐</div>}
                  {a.image ? <img src={a.image} alt={a.label} style={{ width: 52, height: 52, borderRadius: 12, objectFit: "cover", margin: "0 auto 10px", display: "block", border: `2px solid ${a.earned ? COLORS.gold : COLORS.border}` }} /> : <div style={{ fontSize: 36, marginBottom: 10 }}>{a.icon}</div>}
                  <div style={{ fontFamily: "'Syne',sans-serif", fontWeight: 700, fontSize: 14, color: a.earned ? COLORS.gold : COLORS.muted }}>{a.label}</div>
                  <div style={{ fontSize: 12, color: COLORS.muted, marginTop: 5, lineHeight: 1.5 }}>{a.desc}</div>
                  <div style={{ display: "flex", gap: 4, justifyContent: "center", flexWrap: "wrap", marginTop: 6 }}>
                    {isSpecial && <Tag color={COLORS.gold}>⭐ Special</Tag>}
                    {a.earned ? <Tag color={COLORS.gold}>Earned ✓</Tag> : (hasGoals ? <Tag color={COLORS.muted}>In Progress</Tag> : <Tag color={COLORS.muted}>Manual Award</Tag>)}
                    {daysLeft !== null && !a.earned && <Tag color={daysLeft <= 3 ? COLORS.danger : COLORS.muted}>⏳ {daysLeft}d left</Tag>}
                  </div>
                  {!a.earned && hasGoals && <GoalProgress goals={a.goals} progress={a.progress} />}
                </Card>
              );
            })}
          </div>
        </>
      )}

      {/* Stats summary */}
      <Card>
        <div style={{ display: "flex", gap: 32, flexWrap: "wrap" }}>
          {[{ label: "Plans", val: user.plans || 0, icon: "🗓" }, { label: "Q-Sets", val: user.qSets || 0, icon: "❓" }, { label: "Summaries", val: user.summaries || 0, icon: "📝" }, { label: "Max Streak", val: user.maxStreak || 0, icon: "🔥" }, { label: "Total XP", val: user.xp || 0, icon: "⭐" }].map((s) => (
            <div key={s.label} style={{ textAlign: "center" }}>
              <div style={{ fontSize: 22 }}>{s.icon}</div>
              <div style={{ fontFamily: "'Syne',sans-serif", fontWeight: 800, fontSize: 22, color: COLORS.accent }}>{s.val}</div>
              <div style={{ fontSize: 11, color: COLORS.muted }}>{s.label}</div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
