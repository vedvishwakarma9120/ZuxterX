import React, { useState, useRef, useContext } from "react";
import { COLORS } from "../../config/constants";
import { ThemeContext } from "../../context/ThemeContext";
import Avatar from "../common/Avatar";
import Card from "../common/Card";
import Btn from "../common/Btn";
import FollowManageCard from "../connect/FollowManageCard";
import PostCard from "../connect/PostCard";
import { cachedFetch } from "../../utils/cache";

import { BASE_URL } from "../../config/constants";

const CACHE_TTL_POSTS = 60 * 1000;

export default function ProfilePage({ user, onUserUpdate, onBack, onLogout }) {
  const { theme, setTheme } = useContext(ThemeContext);
  const fileRef = useRef(null);
  const [currentTab, setCurrentTab] = useState("settings");
  const [posts, setPosts] = useState([]);
  const [loadingPosts, setLoadingPosts] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(null);

  const [newName, setNewName] = useState(user.name || "");
  const [newBio, setNewBio] = useState(user.bio || "");
  const [msgPrivacy, setMsgPrivacy] = useState(user.messagePrivacy || "Everyone");
  const [newPass, setNewPass] = useState("");
  const [confPass, setConfPass] = useState("");
  const [msg, setMsg] = useState("");
  const [err, setErr] = useState("");
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  React.useEffect(() => {
    if (currentTab === "posts") {
      setLoadingPosts(true);
      cachedFetch(
        `myPosts_${user.id}`,
        `${BASE_URL}/connect/user/${user.id}/posts`,
        { headers: { Authorization: "Bearer " + window._authToken } },
        CACHE_TTL_POSTS,
        (data) => { setPosts(Array.isArray(data) ? data : []); setLoadingPosts(false); }
      );
    }
  }, [currentTab, user.id]);

  async function handleDpChange(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) { setErr("Select an image file."); return; }
    if (file.size > 2 * 1024 * 1024) { setErr("Image must be under 2MB."); return; }
    setUploading(true); setErr(""); setMsg("");
    const reader = new FileReader();
    reader.onload = async (ev) => {
      try {
        const res = await fetch(`${BASE_URL}/profile/avatar`, {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: "Bearer " + window._authToken },
          body: JSON.stringify({ avatar: ev.target.result }),
        });
        const data = await res.json();
        if (!res.ok) { setErr(data.msg || "Upload failed"); setUploading(false); return; }
        onUserUpdate({ ...user, avatar: data.avatar });
        setMsg("Profile picture updated ✓");
      } catch { setErr("Server error"); }
      setUploading(false);
    };
    reader.readAsDataURL(file);
  }

  async function saveProfile() {
    setErr(""); setMsg("");
    if (newPass && newPass !== confPass) { setErr("Passwords do not match."); return; }
    if (newPass && newPass.length < 6) { setErr("Password must be at least 6 characters."); return; }
    const body = {};
    if (newName.trim() !== user.name) body.name = newName.trim();
    if (newBio.trim() !== (user.bio || "")) body.bio = newBio.trim();
    if (msgPrivacy !== (user.messagePrivacy || "Everyone")) body.messagePrivacy = msgPrivacy;
    if (newPass) body.password = newPass;
    if (!Object.keys(body).length) { setMsg("No changes to save."); return; }
    setSaving(true);
    try {
      const res = await fetch(`${BASE_URL}/profile/update`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: "Bearer " + window._authToken },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) { setErr(data.msg || "Error"); setSaving(false); return; }
      onUserUpdate({ ...user, name: data.name, email: data.email, bio: body.bio || user.bio, messagePrivacy: body.messagePrivacy || user.messagePrivacy });
      setMsg("Profile updated ✓");
      setNewPass(""); setConfPass("");
    } catch { setErr("Server error"); }
    setSaving(false);
  }

  const inputSt = { background: COLORS.surfaceAlt, border: `1px solid ${COLORS.border}`, borderRadius: 10, padding: "11px 14px", color: COLORS.text, fontFamily: "'DM Sans',sans-serif", fontSize: 14, outline: "none", transition: "border .18s", width: "100%" };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20, maxWidth: "100%" }}>
      {/* Back + title */}
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <button onClick={onBack} style={{ display: "flex", alignItems: "center", gap: 6, background: COLORS.surfaceAlt, border: `1px solid ${COLORS.border}`, borderRadius: 10, padding: "8px 14px", color: COLORS.muted, cursor: "pointer", fontFamily: "'Outfit',sans-serif", fontSize: 13, fontWeight: 500 }}
          onMouseOver={(e) => { e.currentTarget.style.borderColor = COLORS.accent + "55"; e.currentTarget.style.color = COLORS.accent; }}
          onMouseOut={(e) => { e.currentTarget.style.borderColor = COLORS.border; e.currentTarget.style.color = COLORS.muted; }}>
          ← Back
        </button>
        <div>
          <h2 style={{ fontFamily: "'Syne',sans-serif", fontSize: 26, fontWeight: 800 }}>{user.name}</h2>
          <p style={{ color: COLORS.muted, marginTop: 2, fontSize: 14 }}>Manage your account, view posts, and update your profile.</p>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: "flex", gap: 10, marginBottom: 4 }}>
        <button onClick={() => setCurrentTab("settings")} style={{ flex: 1, padding: "10px", borderRadius: 10, border: `1px solid ${currentTab === "settings" ? COLORS.blue : COLORS.border}`, background: currentTab === "settings" ? COLORS.blue + "22" : "transparent", color: currentTab === "settings" ? COLORS.blue : COLORS.muted, fontFamily: "'Outfit',sans-serif", fontWeight: 700, cursor: "pointer" }}>
          ⚙️ Settings
        </button>
        <button onClick={() => setCurrentTab("posts")} style={{ flex: 1, padding: "10px", borderRadius: 10, border: `1px solid ${currentTab === "posts" ? COLORS.accent : COLORS.border}`, background: currentTab === "posts" ? COLORS.accent + "22" : "transparent", color: currentTab === "posts" ? COLORS.accent : COLORS.muted, fontFamily: "'Outfit',sans-serif", fontWeight: 700, cursor: "pointer" }}>
          📝 My Posts
        </button>
      </div>

      {/* Posts Tab */}
      {currentTab === "posts" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {loadingPosts ? (
            <div style={{ color: COLORS.muted, padding: 40, textAlign: "center" }}>Loading your posts…</div>
          ) : posts.length === 0 ? (
            <Card><div style={{ textAlign: "center", color: COLORS.muted, padding: "30px 0" }}>You haven't made any posts yet.</div></Card>
          ) : (
            posts.map((post) => (
              <PostCard
                key={post._id}
                post={post}
                currentUser={user}
                onLike={async () => {
                  try {
                    await fetch(`${BASE_URL}/connect/post/${post._id}/like`, { method: "POST", headers: { Authorization: "Bearer " + window._authToken } });
                    setPosts((prev) => prev.map((p) => {
                      if (p._id !== post._id) return p;
                      const already = (p.likes || []).includes(user.id);
                      return { ...p, likes: already ? p.likes.filter((id) => id !== user.id) : [...(p.likes || []), user.id] };
                    }));
                  } catch {}
                }}
                onComment={async (text) => {
                  if (!text.trim()) return;
                  try {
                    const res = await fetch(`${BASE_URL}/connect/post/${post._id}/comment`, { method: "POST", headers: { "Content-Type": "application/json", Authorization: "Bearer " + window._authToken }, body: JSON.stringify({ text }) });
                    if (res.ok) { const updated = await res.json(); setPosts((prev) => prev.map((p) => p._id === post._id ? { ...p, comments: updated.comments || p.comments } : p)); }
                  } catch {}
                }}
                onFollowToggle={() => {}}
                onViewProfile={() => {}}
                onDelete={async (postId) => {
                  try { await fetch(`${BASE_URL}/connect/post/${postId}`, { method: "DELETE", headers: { Authorization: "Bearer " + window._authToken } }); setPosts((prev) => prev.filter((p) => p._id !== postId)); } catch {}
                }}
                onEdit={(postId, newText) => { setPosts((prev) => prev.map((p) => p._id === postId ? { ...p, text: newText } : p)); }}
              />
            ))
          )}
        </div>
      )}

      {/* Settings Tab */}
      {currentTab === "settings" && (
        <>
          {/* Profile card */}
          <Card>
            <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
              <div style={{ position: "relative" }}>
                <Avatar src={user.avatar} name={user.name} size={80} />
                <button onClick={() => fileRef.current?.click()} style={{ position: "absolute", bottom: -6, right: -6, width: 26, height: 26, borderRadius: "50%", background: COLORS.accent, border: "2px solid " + COLORS.surface, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", fontSize: 12 }}>✎</button>
                <input ref={fileRef} type="file" accept="image/*" style={{ display: "none" }} onChange={handleDpChange} />
              </div>
              <div>
                <div style={{ fontWeight: 700, fontSize: 18, fontFamily: "'Syne',sans-serif" }}>{user.name}</div>
                <div style={{ color: COLORS.muted, fontSize: 13, marginTop: 4 }}>{user.email}</div>
                <button onClick={() => fileRef.current?.click()} disabled={uploading} style={{ marginTop: 10, background: COLORS.accent + "18", border: `1px solid ${COLORS.accent}44`, borderRadius: 8, padding: "6px 14px", color: COLORS.accent, fontFamily: "'Outfit',sans-serif", fontWeight: 600, fontSize: 12, cursor: uploading ? "not-allowed" : "pointer", opacity: uploading ? .6 : 1 }}>
                  {uploading ? "Uploading…" : "📷 Change Photo"}
                </button>
              </div>
            </div>
          </Card>

          {/* Settings menu list */}
          <Card>
            <div style={{ fontFamily: "'Syne',sans-serif", fontWeight: 700, color: COLORS.muted, textTransform: "uppercase", letterSpacing: "0.08em", fontSize: 11, marginBottom: 14 }}>Settings</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
              {[
                { id: "account", icon: "👤", label: "Account Details", sub: "Name, bio, email" },
                { id: "password", icon: "🔑", label: "Change Password", sub: "Update your password" },
                { id: "security", icon: "🛡️", label: "Security & Privacy", sub: "Message privacy controls" },
                { id: "appearance", icon: "🎨", label: "Appearance", sub: theme === "light" ? "Light mode" : "Dark mode" },
                { id: "stats", icon: "📊", label: "Stats & Achievements", sub: `XP ${user.xp || 0} · Streak ${user.streak || 0}` },
              ].map((item) => (
                <button key={item.id} onClick={() => setDrawerOpen(item.id)}
                  style={{ display: "flex", alignItems: "center", gap: 14, width: "100%", background: "transparent", border: "none", borderRadius: 12, padding: "13px 10px", cursor: "pointer", textAlign: "left" }}
                  onMouseOver={(e) => (e.currentTarget.style.background = COLORS.surfaceAlt)}
                  onMouseOut={(e) => (e.currentTarget.style.background = "transparent")}>
                  <span style={{ fontSize: 22, width: 32, textAlign: "center" }}>{item.icon}</span>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontFamily: "'Outfit',sans-serif", fontWeight: 600, fontSize: 14, color: COLORS.text }}>{item.label}</div>
                    <div style={{ fontSize: 12, color: COLORS.muted, marginTop: 2 }}>{item.sub}</div>
                  </div>
                  <span style={{ fontSize: 16, color: COLORS.muted }}>›</span>
                </button>
              ))}
            </div>
          </Card>

          <FollowManageCard user={user} onUserUpdate={onUserUpdate} />

          <div style={{ marginTop: 10 }}>
            <Btn variant="danger" onClick={onLogout} style={{ width: "100%", padding: "14px", display: "flex", justifyContent: "center", alignItems: "center", gap: 8, fontSize: 15 }}>
              <span>⏻</span> Sign Out from ZuxterX
            </Btn>
          </div>

          {/* Side Drawer */}
          {drawerOpen && (
            <div style={{ position: "fixed", inset: 0, zIndex: 3000, display: "flex" }} onClick={() => setDrawerOpen(null)}>
              <div style={{ flex: 1, background: "rgba(0,0,0,0.55)" }} />
              <div style={{ width: "min(380px, 96vw)", background: COLORS.surface, borderLeft: `1px solid ${COLORS.border}`, height: "100%", overflowY: "auto", display: "flex", flexDirection: "column", animation: "slideInRight .25s ease" }}
                onClick={(e) => e.stopPropagation()}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "18px 20px", borderBottom: `1px solid ${COLORS.border}` }}>
                  <div style={{ fontFamily: "'Syne',sans-serif", fontWeight: 800, fontSize: 18 }}>
                    {drawerOpen === "account" && "👤 Account Details"}
                    {drawerOpen === "password" && "🔑 Change Password"}
                    {drawerOpen === "security" && "🛡️ Security & Privacy"}
                    {drawerOpen === "stats" && "📊 Stats"}
                    {drawerOpen === "appearance" && "🎨 Appearance"}
                  </div>
                  <button onClick={() => setDrawerOpen(null)} style={{ background: COLORS.surfaceAlt, border: `1px solid ${COLORS.border}`, borderRadius: 8, width: 32, height: 32, cursor: "pointer", fontSize: 16, color: COLORS.muted, display: "flex", alignItems: "center", justifyContent: "center" }}>✕</button>
                </div>

                <div style={{ padding: "20px", display: "flex", flexDirection: "column", gap: 16 }}>
                  {/* Account Details */}
                  {drawerOpen === "account" && (
                    <>
                      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                        <label style={{ fontSize: 11, color: COLORS.muted, fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase" }}>Display Name</label>
                        <input value={newName} onChange={(e) => setNewName(e.target.value)} style={inputSt} onFocus={(e) => (e.target.style.borderColor = COLORS.accent)} onBlur={(e) => (e.target.style.borderColor = COLORS.border)} />
                      </div>
                      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                        <label style={{ fontSize: 11, color: COLORS.muted, fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase" }}>Bio</label>
                        <textarea value={newBio} onChange={(e) => setNewBio(e.target.value)} rows={4} style={{ ...inputSt, resize: "none" }} onFocus={(e) => (e.target.style.borderColor = COLORS.accent)} onBlur={(e) => (e.target.style.borderColor = COLORS.border)} placeholder="Tell us about yourself..." />
                      </div>
                      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                        <label style={{ fontSize: 11, color: COLORS.muted, fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase" }}>Email (cannot change)</label>
                        <input value={user.email} readOnly style={{ ...inputSt, opacity: .5, cursor: "not-allowed" }} />
                      </div>
                      {err && <div style={{ background: COLORS.danger + "18", border: `1px solid ${COLORS.danger}44`, borderRadius: 10, padding: "10px 14px", color: COLORS.danger, fontSize: 13 }}>⚠ {err}</div>}
                      {msg && !err && <div style={{ background: COLORS.accent + "12", border: `1px solid ${COLORS.accent}33`, borderRadius: 10, padding: "10px 14px", color: COLORS.accent, fontSize: 13 }}>✓ {msg}</div>}
                      <Btn onClick={saveProfile} disabled={saving}>{saving ? "Saving…" : "💾 Save Changes"}</Btn>
                    </>
                  )}

                  {/* Change Password */}
                  {drawerOpen === "password" && (
                    <>
                      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                        <label style={{ fontSize: 11, color: COLORS.muted, fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase" }}>New Password</label>
                        <input type="password" value={newPass} onChange={(e) => setNewPass(e.target.value)} placeholder="Leave blank to keep current" style={inputSt} onFocus={(e) => (e.target.style.borderColor = COLORS.accent)} onBlur={(e) => (e.target.style.borderColor = COLORS.border)} />
                      </div>
                      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                        <label style={{ fontSize: 11, color: COLORS.muted, fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase" }}>Confirm Password</label>
                        <input type="password" value={confPass} onChange={(e) => setConfPass(e.target.value)} placeholder="Repeat new password" style={inputSt} onFocus={(e) => (e.target.style.borderColor = COLORS.accent)} onBlur={(e) => (e.target.style.borderColor = COLORS.border)} />
                      </div>
                      {err && <div style={{ background: COLORS.danger + "18", border: `1px solid ${COLORS.danger}44`, borderRadius: 10, padding: "10px 14px", color: COLORS.danger, fontSize: 13 }}>⚠ {err}</div>}
                      {msg && !err && <div style={{ background: COLORS.accent + "12", border: `1px solid ${COLORS.accent}33`, borderRadius: 10, padding: "10px 14px", color: COLORS.accent, fontSize: 13 }}>✓ {msg}</div>}
                      <Btn onClick={saveProfile} disabled={saving}>{saving ? "Saving…" : "🔒 Update Password"}</Btn>
                    </>
                  )}

                  {/* Security & Privacy */}
                  {drawerOpen === "security" && (
                    <>
                      <div style={{ background: COLORS.surfaceAlt, border: `1px solid ${COLORS.border}`, borderRadius: 14, overflow: "hidden" }}>
                        <div style={{ padding: "14px 16px", borderBottom: `1px solid ${COLORS.border}` }}>
                          <div style={{ fontWeight: 700, fontSize: 14, fontFamily: "'Syne',sans-serif", marginBottom: 4 }}>💬 Who can message me?</div>
                          <div style={{ fontSize: 12, color: COLORS.muted }}>Control who can send you direct messages</div>
                        </div>
                        {[
                          { val: "Everyone", icon: "🌍", desc: "Anyone on the platform" },
                          { val: "Followers Only", icon: "👥", desc: "Only people you follow back" },
                          { val: "No One", icon: "🔒", desc: "No one can message you" },
                        ].map((opt) => (
                          <label key={opt.val} style={{ display: "flex", alignItems: "center", gap: 14, padding: "14px 16px", cursor: "pointer", borderBottom: `1px solid ${COLORS.border}`, background: msgPrivacy === opt.val ? COLORS.accent + "0f" : "transparent" }}>
                            <input type="radio" name="msgPrivacy" value={opt.val} checked={msgPrivacy === opt.val} onChange={(e) => setMsgPrivacy(e.target.value)} style={{ accentColor: COLORS.accent, width: 16, height: 16 }} />
                            <span style={{ fontSize: 20, width: 28, textAlign: "center" }}>{opt.icon}</span>
                            <div style={{ flex: 1 }}>
                              <div style={{ fontWeight: 600, fontSize: 14, color: msgPrivacy === opt.val ? COLORS.accent : COLORS.text }}>{opt.val}</div>
                              <div style={{ fontSize: 12, color: COLORS.muted, marginTop: 2 }}>{opt.desc}</div>
                            </div>
                            {msgPrivacy === opt.val && <span style={{ fontSize: 16, color: COLORS.accent }}>✓</span>}
                          </label>
                        ))}
                        <div style={{ padding: "14px 16px" }}>
                          {err && <div style={{ background: COLORS.danger + "18", border: `1px solid ${COLORS.danger}44`, borderRadius: 10, padding: "10px 14px", color: COLORS.danger, fontSize: 13, marginBottom: 10 }}>⚠ {err}</div>}
                          {msg && !err && <div style={{ background: COLORS.accent + "12", border: `1px solid ${COLORS.accent}33`, borderRadius: 10, padding: "10px 14px", color: COLORS.accent, fontSize: 13, marginBottom: 10 }}>✓ {msg}</div>}
                          <Btn onClick={saveProfile} disabled={saving}>{saving ? "Saving…" : "💾 Save Privacy Settings"}</Btn>
                        </div>
                      </div>
                    </>
                  )}

                  {/* Stats */}
                  {drawerOpen === "stats" && (
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 16 }}>
                      {[{ label: "XP", val: user.xp || 0, icon: "⭐" }, { label: "Streak", val: user.streak || 0, icon: "🔥" }, { label: "Max Streak", val: user.maxStreak || 0, icon: "⚡" }, { label: "Badges", val: (user.badges || []).length, icon: "🏅" }, { label: "Plans", val: user.plans || 0, icon: "🗓" }].map((s) => (
                        <div key={s.label} style={{ textAlign: "center", background: COLORS.surfaceAlt, border: `1px solid ${COLORS.border}`, borderRadius: 14, padding: "20px 24px", flex: "1 1 120px" }}>
                          <div style={{ fontSize: 28 }}>{s.icon}</div>
                          <div style={{ fontFamily: "'Syne',sans-serif", fontWeight: 800, fontSize: 26, color: COLORS.accent, marginTop: 6 }}>{s.val}</div>
                          <div style={{ fontSize: 12, color: COLORS.muted, marginTop: 4 }}>{s.label}</div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Appearance */}
                  {drawerOpen === "appearance" && (
                    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                      <div style={{ background: COLORS.surfaceAlt, border: `1px solid ${COLORS.border}`, borderRadius: 14, overflow: "hidden" }}>
                        <div style={{ padding: "14px 16px", borderBottom: `1px solid ${COLORS.border}` }}>
                          <div style={{ fontWeight: 700, fontSize: 14, fontFamily: "'Syne',sans-serif", marginBottom: 4 }}>🌗 Theme Mode</div>
                          <div style={{ fontSize: 12, color: COLORS.muted }}>Choose your preferred appearance.</div>
                        </div>
                        {[
                          { val: "light", icon: "☀️", label: "Light Mode", desc: "Clean, bright interface" },
                          { val: "dark", icon: "🌙", label: "Dark Mode", desc: "Easy on the eyes" },
                        ].map((opt) => (
                          <button key={opt.val} onClick={() => setTheme(opt.val)}
                            style={{ display: "flex", alignItems: "center", gap: 14, padding: "16px 16px", cursor: "pointer", background: theme === opt.val ? COLORS.accent + "0f" : "transparent", width: "100%", border: "none", borderBottom: `1px solid ${COLORS.border}`, textAlign: "left" }}
                            onMouseOver={(e) => (e.currentTarget.style.background = COLORS.accent + "12")}
                            onMouseOut={(e) => (e.currentTarget.style.background = theme === opt.val ? COLORS.accent + "0f" : "transparent")}>
                            <span style={{ fontSize: 24, width: 32, textAlign: "center" }}>{opt.icon}</span>
                            <div style={{ flex: 1 }}>
                              <div style={{ fontWeight: 600, fontSize: 14, color: theme === opt.val ? COLORS.accent : COLORS.text, fontFamily: "'Outfit',sans-serif" }}>{opt.label}</div>
                              <div style={{ fontSize: 12, color: COLORS.muted, marginTop: 2 }}>{opt.desc}</div>
                            </div>
                            <div style={{ width: 44, height: 24, borderRadius: 12, background: theme === opt.val ? COLORS.accent : COLORS.border, position: "relative", transition: "background .25s", flexShrink: 0 }}>
                              <div style={{ width: 18, height: 18, borderRadius: "50%", background: theme === opt.val ? (theme === "dark" ? "#000" : "#fff") : COLORS.muted, position: "absolute", top: 3, left: theme === opt.val ? 23 : 3, transition: "left .25s, background .25s", boxShadow: "0 1px 3px rgba(0,0,0,0.3)" }} />
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
