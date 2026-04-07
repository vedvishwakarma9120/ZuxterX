import "./App.css";
import { useState, useEffect, useRef } from "react";
import html2pdf from "html2pdf.js/dist/html2pdf.bundle";

const BASE_URL =
  window.location.hostname === "localhost"
    ? "http://localhost:5000"
    : "https://zuxter-backend.onrender.com";

import carBg from "./assets/car.jpg";
import Spline from '@splinetool/react-spline';

const FONTS = `@import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700&family=Syne:wght@400;600;700;800&family=DM+Sans:ital,wght@0,300;0,400;0,500;1,300&family=Outfit:wght@300;400;500;600;700&display=swap');`;

const COLORS = {
  bg: "#030303", surface: "rgba(15, 15, 15, 0.85)", surfaceAlt: "rgba(25, 25, 25, 0.75)",
  border: "rgba(255, 255, 255, 0.15)", accent: "#ffffff", accentDim: "rgba(255, 255, 255, 0.1)",
  accentHover: "#f0f0f0", gold: "#e0e0e0", blue: "#ffffff",
  pink: "#cccccc", text: "#f5f5f5", muted: "#888888", danger: "#ff5555",
  admin: "#e2e2e2",
};

const ROLES = [
  { id: "owner", label: "Owner", color: "#ff6b35", icon: "👑", desc: "Full control" },
  { id: "moderator", label: "Moderator", color: "#a855f7", icon: "🛡️", desc: "Manage content" },
  { id: "helper", label: "Helper", color: "#4cc9f0", icon: "🤝", desc: "Support team" },
  { id: "premium", label: "Premium", color: "#ffd166", icon: "⭐", desc: "Premium member" },
  { id: "verified", label: "Verified", color: "#00e5a0", icon: "✅", desc: "Verified user" },
  { id: "member", label: "Member", color: "#6b7585", icon: "👤", desc: "Regular member" },
];

const css = `
  ${FONTS}
  *,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
  html{-webkit-text-size-adjust:100%}
  body{background:transparent !important;color:${COLORS.text};font-family:'Outfit',sans-serif;min-height:100vh;letter-spacing:0.01em;overflow-x:hidden}
  ::-webkit-scrollbar{width:5px}
  ::-webkit-scrollbar-track{background:${COLORS.bg}}
  ::-webkit-scrollbar-thumb{background:${COLORS.accent}66;border-radius:10px}
  @keyframes fadeUp{from{opacity:0;transform:translateY(18px)}to{opacity:1;transform:none}}
  @keyframes badgePop{0%{transform:scale(0) rotate(-15deg)}70%{transform:scale(1.2) rotate(4deg)}100%{transform:scale(1) rotate(0deg)}}
  @keyframes pulse{0%,100%{opacity:1}50%{opacity:0.5}}
  @keyframes slideUp{from{opacity:0;transform:translateY(20px)}to{opacity:1;transform:none}}
  @keyframes neonPulse{0%,100%{box-shadow:0 0 10px ${COLORS.accentDim};}50%{box-shadow:0 0 20px ${COLORS.accent}44, 0 0 30px ${COLORS.accent}22;}}
  img{max-width:100%;height:auto}
  textarea,input,select{font-family:'Outfit',sans-serif}
  .main-container{display:flex;min-height:100vh}
  .nav-btn{transition:all 0.2s ease;font-family:'Outfit',sans-serif;}
  .nav-btn:hover{background:${COLORS.accent}18 !important;color:${COLORS.accent} !important;transform:translateX(3px)}
  .post-card{transition:all 0.2s ease;}
  .post-card:hover{border-color:${COLORS.accent}44 !important;}
  .like-btn{transition:all 0.15s ease;}
  .like-btn:hover{transform:scale(1.1);}
  .connect-btn{transition:all 0.2s ease;}
  .connect-btn:hover{filter:brightness(1.15);}
  /* Mobile */
  .sidebar-wrap{display:flex;flex-direction:column;width:220px;min-height:100vh}
  .auth-container {
  display: none; /* Hidden to show only spline animation */
  align-items: center;
  justify-content: center;
  width: 100%;
  min-height: 100vh;
}

.auth-right {
  width: 420px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 24px;
}
  .mobile-topbar{display:none;position:fixed;top:0;left:0;right:0;z-index:200;background:${COLORS.surface};border-bottom:1px solid ${COLORS.border};padding:10px 16px;align-items:center;justify-content:space-between;height:56px}
  .mobile-bottomnav{display:none;position:fixed;bottom:0;left:0;right:0;z-index:200;background:${COLORS.surface};border-top:1px solid ${COLORS.border};padding:6px 0 10px;align-items:center;justify-content:space-around}
  .main-scroll{flex:1;overflow-y:auto;padding:24px}
  @media(max-width:900px){
    .sidebar-wrap{width:180px !important}
  }
  @media(max-width:640px){
    .sidebar-wrap{display:none !important}
    .auth-container{justify-content:center;}
    .auth-right{width:100% !important;margin-right:0 !important;min-height:100vh;background:rgba(5,8,15,0.9) !important;}
    .mobile-topbar{display:flex !important}
    .mobile-bottomnav{display:flex !important}
    .main-scroll{padding:12px !important;padding-top:68px !important;padding-bottom:80px !important}
    .grid-2col{grid-template-columns:1fr !important}
    .grid-auto{grid-template-columns:repeat(2,1fr) !important}
    .admin-wrap{flex-direction:column !important}
    .admin-sidebar-panel{width:100% !important;height:auto !important;position:relative !important;border-right:none !important;border-bottom:1px solid ${COLORS.border} !important}
    .admin-tabs-list{flex-direction:row !important;flex-wrap:wrap !important}
    .admin-tabs-list button{flex:1;min-width:70px;font-size:11px !important}
    .badge-toast{bottom:90px !important;right:12px !important;max-width:calc(100vw - 24px)}
    .connect-header{flex-direction:column !important;gap:8px !important}
    .post-actions{flex-wrap:wrap}
    .hide-mob{display:none !important}
  }
`;

function clearSession() { window._authToken = null; window._adminToken = null; }

const ALL_BADGES = [
  { id: "first_plan", icon: "🎯", label: "First Plan", desc: "Generated your first study plan" },
  { id: "streak3", icon: "🔥", label: "On Fire", desc: "3-day streak achieved" },
  { id: "streak7", icon: "⚡", label: "Lightning", desc: "7-day streak achieved" },
  { id: "ten_q", icon: "🧠", label: "Quizzed", desc: "Generated 10+ question sets" },
  { id: "explorer", icon: "🧭", label: "Explorer", desc: "Tried all 3 AI features" },
  { id: "top3", icon: "🏆", label: "Top 3", desc: "Reached top 3 on leaderboard" },
];

async function callAI(userMsg) {
  const res = await fetch(`${BASE_URL}/api/ai`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "Authorization": "Bearer " + (window._authToken || "") },
    body: JSON.stringify({ prompt: userMsg }),
  });
  const data = await res.json();
  return data.response;
}

async function recordActivity(feature) {
  const res = await fetch(`${BASE_URL}/activity`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "Authorization": "Bearer " + (window._authToken || "") },
    body: JSON.stringify({ feature }),
  });
  if (!res.ok) return null;
  return await res.json();
}

async function adminFetch(path, method = "GET", body = null) {
  const opts = {
    method,
    headers: { "Content-Type": "application/json", "Authorization": "AdminBearer " + (window._adminToken || "") },
  };
  if (body) opts.body = JSON.stringify(body);
  const res = await fetch(`${BASE_URL}${path}`, opts);
  return { ok: res.ok, data: await res.json() };
}

// ─── SMALL UI COMPONENTS ──────────────────────────────────────────────────────

function Spinner() {
  const [deg, setDeg] = useState(0);
  useEffect(() => { const id = setInterval(() => setDeg(d => (d + 10) % 360), 30); return () => clearInterval(id); }, []);
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10, color: COLORS.accent, fontSize: 14 }}>
      <div style={{ width: 18, height: 18, border: `2px solid ${COLORS.accentDim}`, borderTop: `2px solid ${COLORS.accent}`, borderRadius: "50%", transform: `rotate(${deg}deg)` }} />
      Generating with AI…
    </div>
  );
}

function BtnSpinner() {
  const [deg, setDeg] = useState(0);
  useEffect(() => { const id = setInterval(() => setDeg(d => (d + 10) % 360), 30); return () => clearInterval(id); }, []);
  return <span style={{ display: "inline-block", width: 14, height: 14, border: "2px solid rgba(0,0,0,0.2)", borderTop: "2px solid #000", borderRadius: "50%", transform: `rotate(${deg}deg)`, flexShrink: 0 }} />;
}

function Tag({ children, color = COLORS.accent }) {
  return <span style={{ background: color + "22", color, border: `1px solid ${color}44`, borderRadius: 6, padding: "2px 10px", fontSize: 11, fontWeight: 600, letterSpacing: ".05em", textTransform: "uppercase" }}>{children}</span>;
}

function Card({ children, style = {}, glow = false }) {
  return <div style={{ background: COLORS.surface, backdropFilter: "blur(16px)", border: `1px solid ${COLORS.border}`, borderRadius: 16, padding: "22px 24px", boxShadow: glow ? `0 0 24px ${COLORS.accent}44` : `inset 0 0 10px rgba(0,255,255,0.02)`, animation: glow ? "fadeUp .4s ease both, neonPulse 3s infinite" : "fadeUp .4s ease both", transition: "all .3s ease", ...style }} onMouseOver={e => e.currentTarget.style.boxShadow = `0 0 20px ${COLORS.accentDim}, inset 0 0 15px ${COLORS.accentDim}`} onMouseOut={e => e.currentTarget.style.boxShadow = glow ? `0 0 24px ${COLORS.accent}44` : `inset 0 0 10px rgba(0,255,255,0.02)`}>{children}</div>;
}

function Btn({ children, onClick, variant = "primary", disabled = false, style = {} }) {
  const base = { border: "none", borderRadius: 10, padding: "10px 22px", fontFamily: "'Space Grotesk',sans-serif", fontWeight: 700, fontSize: 14, cursor: disabled ? "not-allowed" : "pointer", transition: "all .2s", opacity: disabled ? .5 : 1, textShadow: "0 0 3px rgba(255,255,255,0.3)", ...style };
  const variants = { primary: { background: COLORS.accent, color: "#000", boxShadow: `0 0 15px ${COLORS.accent}88` }, ghost: { background: "transparent", color: COLORS.accent, border: `1px solid ${COLORS.accent}`, boxShadow: `0 0 10px ${COLORS.accentDim}, inset 0 0 10px ${COLORS.accentDim}` }, danger: { background: COLORS.danger + "22", color: COLORS.danger, border: `1px solid ${COLORS.danger}44`, boxShadow: `0 0 10px ${COLORS.danger}44` }, admin: { background: COLORS.admin + "22", color: COLORS.admin, border: `1px solid ${COLORS.admin}44`, boxShadow: `0 0 10px ${COLORS.admin}44` } };
  return <button style={{ ...base, ...variants[variant] }} onClick={onClick} disabled={disabled} onMouseOver={e => !disabled && (e.currentTarget.style.filter = "brightness(1.2)")} onMouseOut={e => e.currentTarget.style.filter = "brightness(1)"}>{children}</button>;
}

function Avatar({ src, name, size = 34, onClick, style = {} }) {
  if (src) return <img src={src} alt="avatar" onClick={onClick} style={{ width: size, height: size, borderRadius: size > 50 ? 16 : 10, objectFit: "cover", flexShrink: 0, border: `2px solid ${COLORS.accent}55`, cursor: onClick ? "pointer" : "default", ...style }} />;
  return <div onClick={onClick} style={{ width: size, height: size, borderRadius: size > 50 ? 16 : 10, background: `linear-gradient(135deg,${COLORS.accent}44,${COLORS.blue}33)`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: size * 0.44, fontWeight: 700, color: COLORS.accent, fontFamily: "'Syne',sans-serif", flexShrink: 0, border: `2px solid ${COLORS.accent}33`, cursor: onClick ? "pointer" : "default", ...style }}>{name ? name[0].toUpperCase() : "?"}</div>;
}

function SyllabusInput({ value, onChange }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
      <label style={{ fontSize: 12, color: COLORS.muted, fontWeight: 500, letterSpacing: ".05em", textTransform: "uppercase" }}>Syllabus / Topic</label>
      <textarea value={value} onChange={e => onChange(e.target.value)} placeholder="Paste your syllabus or topic here…" rows={5}
        style={{ background: COLORS.surfaceAlt, border: `1px solid ${COLORS.border}`, borderRadius: 10, padding: "11px 14px", color: COLORS.text, fontFamily: "'DM Sans',sans-serif", fontSize: 14, outline: "none", resize: "vertical", transition: "border .18s" }}
        onFocus={e => e.target.style.borderColor = COLORS.accent} onBlur={e => e.target.style.borderColor = COLORS.border} />
    </div>
  );
}

// ─── AUTH SCREEN ──────────────────────────────────────────────────────────────

function AuthScreen({ onLogin, onAdminLogin }) {
  const [mode, setMode] = useState("login");
  const [signupStep, setSignupStep] = useState("form");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [pass, setPass] = useState("");
  const [otp, setOtp] = useState("");
  const [err, setErr] = useState("");
  const [info, setInfo] = useState("");
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);

  function switchMode(m) { setMode(m); setErr(""); setInfo(""); setSignupStep("form"); setOtp(""); }

  async function doLogin() {
    setErr(""); setInfo("");
    if (!email || !pass) { setErr("Please fill all fields."); return; }
    setLoading(true);
    try {
      const res = await fetch(`${BASE_URL}/login`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email, password: pass }) });
      const data = await res.json();
      if (!res.ok) { setErr(data.msg || "Error"); setLoading(false); return; }
      window._authToken = data.token;
      onLogin(data);
    } catch { setErr("Server error"); }
    setLoading(false);
  }

  async function doSendOtp() {
    setErr(""); setInfo("");
    if (!name || !email || !pass) { setErr("Please fill all fields."); return; }
    if (pass.length < 6) { setErr("Password must be at least 6 characters."); return; }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { setErr("Please enter a valid email address."); return; }
    setLoading(true);
    try {
      const res = await fetch(`${BASE_URL}/send-otp`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name, email }) });
      const data = await res.json();
      if (!res.ok) { setErr(data.msg || "Error"); setLoading(false); return; }
      setInfo(`OTP sent to ${email}`);
      setSignupStep("otp");
    } catch { setErr("Server error"); }
    setLoading(false);
  }

  async function doVerifyOtp() {
    setErr(""); setInfo("");
    if (!otp) { setErr("Please enter the OTP."); return; }
    setLoading(true);
    try {
      const res = await fetch(`${BASE_URL}/verify-otp`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name, email, password: pass, otp }) });
      const data = await res.json();
      if (!res.ok) { setErr(data.msg || "Error"); setLoading(false); return; }
      setInfo("Account created! Please sign in.");
      switchMode("login");
    } catch { setErr("Server error"); }
    setLoading(false);
  }

  async function doAdminLogin() {
    setErr(""); setInfo("");
    if (!email || !pass) { setErr("Please fill all fields."); return; }
    setLoading(true);
    try {
      const res = await fetch(`${BASE_URL}/admin/login`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email, password: pass }) });
      const data = await res.json();
      if (!res.ok) { setErr(data.msg || "Not authorized"); setLoading(false); return; }
      window._adminToken = data.adminToken;
      onAdminLogin({ email: data.email });
    } catch { setErr("Server error"); }
    setLoading(false);
  }

  async function doSendForgotOtp() {
    setErr(""); setInfo("");
    if (!email) { setErr("Please enter your email."); return; }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { setErr("Please enter a valid email address."); return; }
    setLoading(true);
    try {
      const res = await fetch(`${BASE_URL}/forgot-password-otp`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email }) });
      const data = await res.json();
      if (!res.ok) { setErr(data.msg || "Error"); setLoading(false); return; }
      setInfo(data.msg || `OTP sent to ${email}`);
      setSignupStep("otp");
    } catch { setErr("Server error"); }
    setLoading(false);
  }

  async function doResetPassword() {
    setErr(""); setInfo("");
    if (!otp || !pass) { setErr("Please enter the OTP and new password."); return; }
    if (pass.length < 6) { setErr("Password must be at least 6 characters."); return; }
    setLoading(true);
    try {
      const res = await fetch(`${BASE_URL}/reset-password`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email, otp, password: pass }) });
      const data = await res.json();
      if (!res.ok) { setErr(data.msg || "Error"); setLoading(false); return; }
      setInfo(data.msg || "Password reset successfully!");
      switchMode("login");
    } catch { setErr("Server error"); }
    setLoading(false);
  }

  function submit() {
    if (mode === "admin") { doAdminLogin(); return; }
    if (mode === "login") { doLogin(); return; }
    if (mode === "forgot") {
      if (signupStep === "form") { doSendForgotOtp(); return; }
      doResetPassword(); return;
    }
    if (signupStep === "form") { doSendOtp(); return; }
    doVerifyOtp();
  }

  const inputStyle = { background: "rgba(0,0,0,0.2)", border: `1px solid rgba(255,255,255,0.08)`, borderRadius: 12, padding: "14px 16px", color: COLORS.text, fontFamily: "'Outfit',sans-serif", fontSize: 14, outline: "none", transition: "all 0.3s", width: "100%" };
  const iFocus = e => { e.target.style.borderColor = mode === "admin" ? COLORS.admin : COLORS.accent; e.target.style.boxShadow = `0 0 0 4px ${mode === "admin" ? COLORS.admin : COLORS.accent}15`; };
  const iBlur = e => { e.target.style.borderColor = "rgba(255,255,255,0.08)"; e.target.style.boxShadow = "none"; };
  const accentColor = mode === "admin" ? COLORS.admin : COLORS.accent;

  if (!showForm) {
    return (
      <button
        onClick={() => setShowForm(true)}
        style={{
          position: "fixed", top: 32, right: 32, zIndex: 100,
          background: "rgba(5,8,15,0.6)",
          border: `1px solid ${COLORS.accent}66`,
          color: COLORS.accent,
          padding: "5px 14px",
          borderRadius: "10px",
          fontFamily: "'Syne', sans-serif",
          fontWeight: 700,
          fontSize: 13,
          width: "fit-content",
          cursor: "pointer",
          animation: "neonPulse 3s infinite",
          backdropFilter: "blur(12px)",
          transition: "all 0.3s ease"
        }}
        onMouseOver={e => { e.currentTarget.style.transform = "scale(1.05)"; e.currentTarget.style.filter = "brightness(1.2)"; }}
        onMouseOut={e => { e.currentTarget.style.transform = "scale(1)"; e.currentTarget.style.filter = "brightness(1)"; }}
      >
        Sign In ➔
      </button>
    );
  }

  return (
    <div className="auth-container" style={{ position: "fixed", inset: 0, zIndex: 100, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(5,8,15,0.7)", animation: "fadeUp 0.3s ease" }}>
      {/* CENTRALLY ALIGNED FORM */}
      <div className="auth-right">
        <div style={{ width: "100%", maxWidth: "420px", animation: "fadeUp .5s ease both" }}>
          <div style={{ textAlign: "center", marginBottom: 40 }}>
            <div style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", width: 64, height: 64, borderRadius: 20, background: `linear-gradient(135deg,${accentColor}22,${accentColor}08)`, border: `1px solid ${accentColor}44`, fontSize: 30, marginBottom: 16 }}>
              {mode === "admin" ? "🛡️" : "📚"}
            </div>
            <h1 style={{ fontFamily: "'Syne',sans-serif", fontSize: 44, fontWeight: 800, letterSpacing: "-1.5px", lineHeight: 1, marginBottom: 12, color: "#fff", textShadow: `0 0 40px ${accentColor}44` }}>
              Zuxter<span style={{ color: accentColor, textShadow: `0 0 20px ${accentColor}` }}>X</span>
            </h1>
            <p style={{ color: COLORS.muted, fontSize: 11, letterSpacing: "0.1em", textTransform: "uppercase", fontWeight: 600, marginBottom: 6 }}>
              {mode === "admin" ? "⚡ Admin Control Panel" : "AI-Powered Study Platform"}
            </p>
            {mode !== "admin" && <p style={{ color: "rgba(224,247,250,0.32)", fontSize: 12, fontFamily: "'DM Sans',sans-serif", fontStyle: "italic" }}>Study smarter. Streak longer. Rise higher.</p>}
          </div>

          <div style={{ position: "relative", background: "rgba(5,8,15,0.45)", border: `1px solid ${mode === "admin" ? COLORS.admin + "66" : COLORS.accent + "55"}`, borderRadius: 24, padding: "34px", backdropFilter: "blur(40px) saturate(150%)", boxShadow: `0 24px 60px rgba(0,0,0,0.8), inset 0 0 20px ${mode === "admin" ? COLORS.admin + "22" : COLORS.accent + "22"}` }}>
            <button onClick={() => setShowForm(false)} style={{ position: "absolute", top: 6, left: "50%", transform: "translateX(-50%)", background: "transparent", border: "none", color: "rgba(255,255,255,0.4)", cursor: "pointer", fontSize: 22, zIndex: 10, transition: "all 0.2s" }} onMouseOver={e => { e.currentTarget.style.color = "#fff"; e.currentTarget.style.transform = "translateX(-50%) scale(1.1)"; }} onMouseOut={e => { e.currentTarget.style.color = "rgba(255,255,255,0.4)"; e.currentTarget.style.transform = "translateX(-50%) scale(1)"; }}>✕</button>
            <div style={{ display: "flex", gap: 6, marginBottom: 32, background: "rgba(0,0,0,0.4)", borderRadius: 14, padding: 6, border: `1px solid ${COLORS.border}` }}>
              {["login", "signup", "admin"].map(m => (
                <button key={m} onClick={() => switchMode(m)} style={{
                  flex: 1, padding: "10px 0", borderRadius: 10, border: "none", cursor: "pointer",
                  fontFamily: "'Outfit',sans-serif", fontWeight: 700, fontSize: 13, letterSpacing: "0.03em", transition: "all 0.3s",
                  background: mode === m ? (m === "admin" ? COLORS.admin + "33" : COLORS.accent + "33") : "transparent",
                  color: mode === m ? (m === "admin" ? COLORS.admin : COLORS.accent) : COLORS.muted,
                  boxShadow: mode === m ? `inset 0 0 10px ${m === "admin" ? COLORS.admin : COLORS.accent}22` : "none",
                  border: `1px solid ${mode === m ? (m === "admin" ? COLORS.admin + "66" : COLORS.accent + "66") : "transparent"}`
                }}>
                  {m === "login" ? "Sign In" : m === "signup" ? "Sign Up" : "Admin"}
                </button>
              ))}
            </div>

            {(mode === "signup" || mode === "forgot") && (
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 20 }}>
                {["Details", "Verify OTP"].map((step, i) => {
                  const cur = signupStep === "form" ? 1 : 2;
                  const active = i + 1 === cur; const done = i + 1 < cur;
                  return (
                    <div key={step} style={{ display: "flex", alignItems: "center", gap: 8, flex: i < 1 ? 1 : "unset" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                        <div style={{ width: 22, height: 22, borderRadius: "50%", fontSize: 11, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center", background: done ? COLORS.accent : active ? COLORS.accent + "22" : COLORS.surfaceAlt, border: `1.5px solid ${done || active ? COLORS.accent : COLORS.border}`, color: done ? "#000" : active ? COLORS.accent : COLORS.muted }}>{done ? "✓" : i + 1}</div>
                        <span style={{ fontSize: 12, color: active ? COLORS.accent : COLORS.muted, fontWeight: active ? 600 : 400 }}>{step}</span>
                      </div>
                      {i < 1 && <div style={{ flex: 1, height: 1, background: done ? COLORS.accent + "44" : COLORS.border, margin: "0 4px" }} />}
                    </div>
                  );
                })}
              </div>
            )}

            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              {mode === "signup" && signupStep === "form" && (
                <input value={name} onChange={e => setName(e.target.value)} placeholder="Full name" style={inputStyle} onFocus={iFocus} onBlur={iBlur} />
              )}
              {(mode === "login" || mode === "admin" || signupStep === "form") && (
                <input value={email} onChange={e => setEmail(e.target.value)} placeholder="Email address" type="email" style={inputStyle} onFocus={iFocus} onBlur={iBlur}
                  onKeyDown={e => e.key === "Enter" && submit()} />
              )}
              {(mode === "login" || mode === "admin" || (mode === "signup" && signupStep === "form") || (mode === "forgot" && signupStep === "otp")) && (
                <input value={pass} onChange={e => setPass(e.target.value)} placeholder={mode === "forgot" ? "New Password" : "Password"} type="password" style={inputStyle} onFocus={iFocus} onBlur={iBlur}
                  onKeyDown={e => e.key === "Enter" && submit()} />
              )}
              {(mode === "signup" || mode === "forgot") && signupStep === "otp" && (
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  <p style={{ fontSize: 13, color: COLORS.muted }}>Enter the 6-digit code sent to <span style={{ color: COLORS.accent }}>{email}</span></p>
                  <input value={otp} onChange={e => setOtp(e.target.value)} placeholder="000000" maxLength={6}
                    style={{ ...inputStyle, fontSize: 24, letterSpacing: "0.4em", textAlign: "center", fontFamily: "'Syne',sans-serif", fontWeight: 700 }}
                    onFocus={iFocus} onBlur={iBlur} onKeyDown={e => e.key === "Enter" && submit()} />
                </div>
              )}

              {mode === "login" && (
                <div style={{ textAlign: "right", marginTop: -6 }}>
                  <button onClick={() => switchMode("forgot")} style={{ background: "transparent", border: "none", color: COLORS.muted, fontSize: 13, cursor: "pointer", textDecoration: "underline" }}>Forgot Password?</button>
                </div>
              )}

              {err && <div style={{ background: COLORS.danger + "18", border: `1px solid ${COLORS.danger}44`, borderRadius: 10, padding: "10px 14px", color: COLORS.danger, fontSize: 13 }}>⚠ {err}</div>}
              {info && <div style={{ background: COLORS.accent + "12", border: `1px solid ${COLORS.accent}33`, borderRadius: 10, padding: "10px 14px", color: COLORS.accent, fontSize: 13 }}>✓ {info}</div>}

              <button onClick={submit} disabled={loading}
                style={{ width: "100%", padding: "14px", borderRadius: 12, border: "none", cursor: loading ? "not-allowed" : "pointer", fontFamily: "'Outfit',sans-serif", fontWeight: 800, fontSize: 15, transition: "all 0.2s", opacity: loading ? .7 : 1, background: `linear-gradient(135deg,${accentColor},${accentColor}cc)`, color: "#000", boxShadow: `0 4px 20px ${accentColor}55`, display: "flex", alignItems: "center", justifyContent: "center", gap: 10, marginTop: 4 }}>
                {loading ? <><BtnSpinner /><span>Please wait…</span></> : mode === "login" ? "Sign In  ➔" : mode === "signup" ? (signupStep === "form" ? "Send OTP  ➔" : "Create Account  ➔") : mode === "forgot" ? (signupStep === "form" ? "Send Reset OTP  ➔" : "Reset Password  ➔") : "Access Admin  ➔"}
              </button>

              {(mode === "signup" || mode === "forgot") && signupStep === "otp" && (
                <button onClick={() => { setSignupStep("form"); setOtp(""); setErr(""); setInfo(""); }} style={{ background: "transparent", border: "none", color: COLORS.muted, fontSize: 13, cursor: "pointer", textDecoration: "underline" }}>← Change email or resend OTP</button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── SIDEBAR ──────────────────────────────────────────────────────────────────

function Sidebar({ active, setActive, user, onLogout, onAvatarClick }) {
  const nav = [
    { id: "planner", icon: "🗓", label: "Study Planner" },
    { id: "questions", icon: "❓", label: "Questions" },
    { id: "summary", icon: "📝", label: "AI Summary" },
    { id: "connect", icon: "🌐", label: "ZuxterConnect" },
    { id: "badges", icon: "🏅", label: "Achievements" },
    { id: "leaderboard", icon: "🏆", label: "Leaderboard" },
  ];

  return (
    <div className="sidebar-wrap" style={{ background: COLORS.surface, borderRight: `1px solid ${COLORS.border}`, display: "flex", flexDirection: "column", padding: "20px 12px", height: "100vh", position: "sticky", top: 0, overflowY: "auto" }}>
      <div style={{ padding: "0 4px", marginBottom: 24 }}>
        <h2 style={{ fontFamily: "'Syne',sans-serif", fontWeight: 800, fontSize: 22, letterSpacing: "-0.5px" }}>
          Zuxter<span style={{ color: COLORS.accent, textShadow: `0 0 12px ${COLORS.accent}88` }}>X</span>
        </h2>
        <div style={{ fontSize: 11, color: COLORS.muted, marginTop: 2 }}>AI Study Platform</div>
      </div>

      <div onClick={onAvatarClick} title="Click to view profile"
        style={{ display: "flex", alignItems: "center", gap: 10, background: active === "profile" ? COLORS.accent + "12" : COLORS.surfaceAlt, borderRadius: 12, padding: "10px 12px", marginBottom: 28, border: `1px solid ${active === "profile" ? COLORS.accent + "44" : COLORS.border}`, cursor: "pointer", transition: "all .2s" }}>
        <Avatar src={user.avatar} name={user.name} size={36} />
        <div style={{ overflow: "hidden", flex: 1 }}>
          <div style={{ fontWeight: 600, fontSize: 13, fontFamily: "'Outfit',sans-serif", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{user.name}</div>
          <div style={{ fontSize: 10, color: COLORS.accent, marginTop: 1, fontWeight: 500 }}>
            ⭐ {user.xp || 0} XP · 🔥 {user.streak || 0} streak
          </div>
        </div>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 4, flex: 1 }}>
        {nav.map(item => {
          const isActive = active === item.id;
          return (
            <button key={item.id} onClick={() => setActive(item.id)} className="nav-btn"
              style={{ padding: "10px 14px", border: "none", borderRadius: 11, cursor: "pointer", background: isActive ? `linear-gradient(135deg,${COLORS.accent}22,${COLORS.accent}0a)` : "transparent", color: isActive ? COLORS.accent : COLORS.muted, fontFamily: "'Outfit',sans-serif", fontWeight: isActive ? 600 : 400, fontSize: 14, textAlign: "left", borderLeft: isActive ? `3px solid ${COLORS.accent}` : "3px solid transparent", display: "flex", alignItems: "center", gap: 10 }}>
              <span style={{ fontSize: 16 }}>{item.icon}</span>{item.label}
            </button>
          );
        })}
      </div>

      {/* Support Ticket button at bottom */}
      <button onClick={() => setActive("support")} className="nav-btn"
        style={{ padding: "10px 14px", border: `1px solid ${active === "support" ? COLORS.pink + "55" : COLORS.border}`, borderRadius: 11, cursor: "pointer", background: active === "support" ? COLORS.pink + "15" : "transparent", color: active === "support" ? COLORS.pink : COLORS.muted, fontFamily: "'Outfit',sans-serif", fontWeight: active === "support" ? 600 : 400, fontSize: 13, textAlign: "left", display: "flex", alignItems: "center", gap: 10, marginTop: 8, transition: "all 0.2s" }}>
        <span style={{ fontSize: 16 }}>🎫</span> Support
      </button>

      <button onClick={onLogout} style={{ marginTop: 8, padding: "10px 14px", border: `1px solid ${COLORS.danger}33`, borderRadius: 11, background: COLORS.danger + "12", color: COLORS.danger, cursor: "pointer", fontFamily: "'Outfit',sans-serif", fontWeight: 600, fontSize: 13, display: "flex", alignItems: "center", gap: 8, transition: "all 0.2s" }}
        onMouseOver={e => e.currentTarget.style.background = COLORS.danger + "25"} onMouseOut={e => e.currentTarget.style.background = COLORS.danger + "12"}>
        <span>⏻</span> Sign Out
      </button>
    </div>
  );
}

// ─── FOLLOW MANAGE CARD ───────────────────────────────────────────────────────

function FollowManageCard({ user, onUserUpdate }) {
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
    // To remove a follower, target unfollows us — we call unfollow as the target
    // We can't do that directly, but we can ask user to block then unblock
    // Alternative: just show info that they can ask the user to unfollow
    // Better UX: We'll use a soft approach - just refresh followers list info
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

// ─── PROFILE PAGE ─────────────────────────────────────────────────────────────

function ProfilePage({ user, onUserUpdate, onBack }) {
  const fileRef = useRef(null);
  const [newName, setNewName] = useState(user.name || "");
  const [newPass, setNewPass] = useState("");
  const [confPass, setConfPass] = useState("");
  const [msg, setMsg] = useState("");
  const [err, setErr] = useState("");
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  async function handleDpChange(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) { setErr("Select an image file."); return; }
    if (file.size > 2 * 1024 * 1024) { setErr("Image must be under 2MB."); return; }
    setUploading(true); setErr(""); setMsg("");
    const reader = new FileReader();
    reader.onload = async ev => {
      try {
        const res = await fetch(`${BASE_URL}/profile/avatar`, { method: "POST", headers: { "Content-Type": "application/json", "Authorization": "Bearer " + window._authToken }, body: JSON.stringify({ avatar: ev.target.result }) });
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
    if (newPass) body.password = newPass;
    if (!Object.keys(body).length) { setMsg("No changes to save."); return; }
    setSaving(true);
    try {
      const res = await fetch(`${BASE_URL}/profile/update`, { method: "POST", headers: { "Content-Type": "application/json", "Authorization": "Bearer " + window._authToken }, body: JSON.stringify(body) });
      const data = await res.json();
      if (!res.ok) { setErr(data.msg || "Error"); setSaving(false); return; }
      onUserUpdate({ ...user, name: data.name, email: data.email });
      setMsg("Profile updated ✓");
      setNewPass(""); setConfPass("");
    } catch { setErr("Server error"); }
    setSaving(false);
  }

  const inputSt = { background: COLORS.surfaceAlt, border: `1px solid ${COLORS.border}`, borderRadius: 10, padding: "11px 14px", color: COLORS.text, fontFamily: "'DM Sans',sans-serif", fontSize: 14, outline: "none", transition: "border .18s", width: "100%" };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20, maxWidth: "100%" }}>
      {/* Back button */}
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <button onClick={onBack} style={{ display: "flex", alignItems: "center", gap: 6, background: COLORS.surfaceAlt, border: `1px solid ${COLORS.border}`, borderRadius: 10, padding: "8px 14px", color: COLORS.muted, cursor: "pointer", fontFamily: "'Outfit',sans-serif", fontSize: 13, fontWeight: 500, transition: "all .18s" }}
          onMouseOver={e => { e.currentTarget.style.borderColor = COLORS.accent + "55"; e.currentTarget.style.color = COLORS.accent; }}
          onMouseOut={e => { e.currentTarget.style.borderColor = COLORS.border; e.currentTarget.style.color = COLORS.muted; }}>
          ← Back
        </button>
        <div>
          <h2 style={{ fontFamily: "'Syne',sans-serif", fontSize: 26, fontWeight: 800 }}>My Profile</h2>
          <p style={{ color: COLORS.muted, marginTop: 2, fontSize: 14 }}>Manage your account and profile picture.</p>
        </div>
      </div>

      <Card>
        <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
          <div style={{ position: "relative" }}>
            <Avatar src={user.avatar} name={user.name} size={80} />
            <button onClick={() => fileRef.current?.click()} style={{ position: "absolute", bottom: -6, right: -6, width: 26, height: 26, borderRadius: "50%", background: COLORS.accent, border: "2px solid " + COLORS.surface, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", fontSize: 12 }}>✎</button>
            <input ref={fileRef} type="file" accept="image/*" style={{ display: "none" }} onChange={handleDpChange} />
          </div>
          <div>
            <div style={{ fontWeight: 700, fontSize: 18, fontFamily: "'Syne',sans-serif" }}>{user.name}</div>
            <div style={{ color: COLORS.muted, fontSize: 13, marginTop: 3 }}>{user.email}</div>
            <button onClick={() => fileRef.current?.click()} disabled={uploading} style={{ marginTop: 10, background: COLORS.accent + "18", border: `1px solid ${COLORS.accent}44`, borderRadius: 8, padding: "6px 14px", color: COLORS.accent, fontFamily: "'Outfit',sans-serif", fontWeight: 600, fontSize: 12, cursor: uploading ? "not-allowed" : "pointer", opacity: uploading ? .6 : 1 }}>
              {uploading ? "Uploading…" : "📷 Change Photo"}
            </button>
          </div>
        </div>
      </Card>

      <Card>
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div style={{ fontFamily: "'Syne',sans-serif", fontWeight: 700, fontSize: 15, marginBottom: 4 }}>Account Details</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <label style={{ fontSize: 11, color: COLORS.muted, fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase" }}>Display Name</label>
            <input value={newName} onChange={e => setNewName(e.target.value)} style={inputSt} onFocus={e => e.target.style.borderColor = COLORS.accent} onBlur={e => e.target.style.borderColor = COLORS.border} />
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <label style={{ fontSize: 11, color: COLORS.muted, fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase" }}>Email (cannot change)</label>
            <input value={user.email} readOnly style={{ ...inputSt, opacity: .5, cursor: "not-allowed" }} />
          </div>
          <div style={{ borderTop: `1px solid ${COLORS.border}`, paddingTop: 16 }}>
            <div style={{ fontFamily: "'Syne',sans-serif", fontWeight: 700, fontSize: 14, marginBottom: 12 }}>Change Password</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                <label style={{ fontSize: 11, color: COLORS.muted, fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase" }}>New Password</label>
                <input type="password" value={newPass} onChange={e => setNewPass(e.target.value)} placeholder="Leave blank to keep current" style={inputSt} onFocus={e => e.target.style.borderColor = COLORS.accent} onBlur={e => e.target.style.borderColor = COLORS.border} />
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                <label style={{ fontSize: 11, color: COLORS.muted, fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase" }}>Confirm Password</label>
                <input type="password" value={confPass} onChange={e => setConfPass(e.target.value)} placeholder="Repeat new password" style={inputSt} onFocus={e => e.target.style.borderColor = COLORS.accent} onBlur={e => e.target.style.borderColor = COLORS.border} />
              </div>
            </div>
          </div>
          {err && <div style={{ background: COLORS.danger + "18", border: `1px solid ${COLORS.danger}44`, borderRadius: 10, padding: "10px 14px", color: COLORS.danger, fontSize: 13 }}>⚠ {err}</div>}
          {msg && !err && <div style={{ background: COLORS.accent + "12", border: `1px solid ${COLORS.accent}33`, borderRadius: 10, padding: "10px 14px", color: COLORS.accent, fontSize: 13 }}>✓ {msg}</div>}
          <Btn onClick={saveProfile} disabled={saving}>{saving ? "Saving…" : "💾 Save Changes"}</Btn>
        </div>
      </Card>

      <Card>
        <div style={{ fontFamily: "'Syne',sans-serif", fontWeight: 700, fontSize: 15, marginBottom: 16 }}>Your Stats</div>
        <div style={{ display: "flex", gap: 24, flexWrap: "wrap" }}>
          {[{ label: "XP", val: user.xp || 0, icon: "⭐" }, { label: "Streak", val: user.streak || 0, icon: "🔥" }, { label: "Max Streak", val: user.maxStreak || 0, icon: "⚡" }, { label: "Badges", val: (user.badges || []).length, icon: "🏅" }, { label: "Plans", val: user.plans || 0, icon: "🗓" }].map(s => (
            <div key={s.label} style={{ textAlign: "center", minWidth: 60 }}>
              <div style={{ fontSize: 22 }}>{s.icon}</div>
              <div style={{ fontFamily: "'Syne',sans-serif", fontWeight: 800, fontSize: 22, color: COLORS.accent }}>{s.val}</div>
              <div style={{ fontSize: 11, color: COLORS.muted }}>{s.label}</div>
            </div>
          ))}
        </div>
      </Card>

      {/* Followers / Following Management */}
      <FollowManageCard user={user} onUserUpdate={onUserUpdate} />
    </div>
  );
}

// ─── ZUXTER CONNECT ───────────────────────────────────────────────────────────

function ZuxterConnect({ user, onUserUpdate }) {
  const [posts, setPosts] = useState([]);
  const [loadingPosts, setLoadingPosts] = useState(true);
  const [postText, setPostText] = useState("");
  const [postImg, setPostImg] = useState(null);
  const [posting, setPosting] = useState(false);
  const [postErr, setPostErr] = useState("");
  const [viewProfile, setViewProfile] = useState(null); // userId to view
  const fileRef = useRef(null);

  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [currentTab, setCurrentTab] = useState("feed"); // "feed" | "post"

  useEffect(() => {
    if (!searchQuery.trim()) { setSearchResults([]); return; }
    const id = setTimeout(async () => {
      setIsSearching(true);
      try {
        const res = await fetch(`${BASE_URL}/connect/search?q=${encodeURIComponent(searchQuery)}`, { headers: { "Authorization": "Bearer " + window._authToken } });
        if (res.ok) setSearchResults(await res.json());
      } catch { }
      setIsSearching(false);
    }, 300);
    return () => clearTimeout(id);
  }, [searchQuery]);

  async function loadPosts() {
    try {
      const res = await fetch(`${BASE_URL}/connect/posts`, { headers: { "Authorization": "Bearer " + window._authToken } });
      const data = await res.json();
      if (res.ok) setPosts(data);
    } catch { }
    setLoadingPosts(false);
  }

  useEffect(() => { loadPosts(); }, []);

  async function submitPost() {
    if (!postText.trim() && !postImg) return;
    setPosting(true); setPostErr("");
    try {
      const res = await fetch(`${BASE_URL}/connect/post`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "Authorization": "Bearer " + window._authToken },
        body: JSON.stringify({ text: postText, image: postImg }),
      });
      const data = await res.json();
      if (!res.ok) { setPostErr(data.msg || "Error posting"); setPosting(false); return; }
      setPostText(""); setPostImg(null);
      await loadPosts();
      setCurrentTab("feed");
    } catch { setPostErr("Server error"); }
    setPosting(false);
  }

  async function toggleLike(postId) {
    try {
      await fetch(`${BASE_URL}/connect/post/${postId}/like`, {
        method: "POST", headers: { "Authorization": "Bearer " + window._authToken }
      });
      await loadPosts();
    } catch { }
  }

  async function addComment(postId, text) {
    if (!text.trim()) return;
    try {
      await fetch(`${BASE_URL}/connect/post/${postId}/comment`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "Authorization": "Bearer " + window._authToken },
        body: JSON.stringify({ text }),
      });
      await loadPosts();
    } catch { }
  }

  async function toggleFollow(targetId) {
    try {
      const res = await fetch(`${BASE_URL}/connect/follow/${targetId}`, {
        method: "POST", headers: { "Authorization": "Bearer " + window._authToken }
      });
      const data = await res.json();
      if (res.ok) onUserUpdate({ ...user, following: data.following, followers: data.followers });
    } catch { }
  }

  async function deletePost(postId) {
    try {
      await fetch(`${BASE_URL}/connect/post/${postId}`, {
        method: "DELETE", headers: { "Authorization": "Bearer " + window._authToken }
      });
      await loadPosts();
    } catch { }
  }

  async function editPost(postId, newText) {
    // optimistic update
    setPosts(prev => prev.map(p => p._id === postId ? { ...p, text: newText } : p));
  }

  function handleImagePick(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) { setPostErr("Only image files allowed."); return; }
    if (file.size > 2 * 1024 * 1024) { setPostErr("Image must be under 2MB."); return; }
    setPostErr("");
    const reader = new FileReader();
    reader.onload = ev => setPostImg(ev.target.result);
    reader.readAsDataURL(file);
  }

  const [msgTarget, setMsgTarget] = useState(null);
  if (msgTarget) {
    return <MessagingPage user={user} openWithId={msgTarget} onBack={() => setMsgTarget(null)} />;
  }
  if (viewProfile) {
    return <UserProfileView userId={viewProfile} currentUser={user} onBack={() => setViewProfile(null)} onFollow={toggleFollow} onMessage={id => setMsgTarget(id)} />;
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20, maxWidth: "100%" }}>
      {/* Header */}
      <div className="connect-header" style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div>
          <h2 style={{ fontFamily: "'Syne',sans-serif", fontSize: 26, fontWeight: 800 }}>
            Zuxter<span style={{ color: COLORS.blue }}>Connect</span>
          </h2>
          <p style={{ color: COLORS.muted, marginTop: 4, fontSize: 14 }}>Connect with fellow students. Share ideas, progress & more.</p>
        </div>
        <div style={{ textAlign: "right" }}>
          <div style={{ fontSize: 13, color: COLORS.muted }}>
            <span style={{ color: COLORS.accent, fontWeight: 700 }}>{(user.followers || []).length}</span> followers ·{" "}
            <span style={{ color: COLORS.accent, fontWeight: 700 }}>{(user.following || []).length}</span> following
          </div>
        </div>
      </div>

      {/* Search Bar */}
      <div style={{ position: "relative", zIndex: 10 }}>
        <input
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          placeholder="Search people by name..."
          style={{ width: "100%", background: COLORS.surfaceAlt, border: `1px solid ${COLORS.border}`, borderRadius: 10, padding: "12px 16px", color: COLORS.text, fontFamily: "'DM Sans',sans-serif", fontSize: 14, outline: "none", boxSizing: "border-box", transition: "border .2s" }}
          onFocus={e => e.target.style.borderColor = COLORS.blue}
          onBlur={e => e.target.style.borderColor = COLORS.border}
        />
        {searchQuery.trim() && (
          <div style={{ position: "absolute", top: "100%", left: 0, right: 0, background: COLORS.surface, border: `1px solid ${COLORS.border}`, borderRadius: 10, marginTop: 6, maxHeight: 300, overflowY: "auto", boxShadow: "0 8px 32px rgba(0,0,0,0.5)" }}>
            {isSearching ? (
              <div style={{ padding: 16, textAlign: "center", color: COLORS.muted }}>Searching...</div>
            ) : searchResults.length === 0 ? (
              <div style={{ padding: 16, textAlign: "center", color: COLORS.muted }}>No users found.</div>
            ) : (
              searchResults.map(u => (
                <div key={u.id} onClick={() => { setViewProfile(u.id); setSearchQuery(""); }} style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 16px", borderBottom: `1px solid ${COLORS.border}`, cursor: "pointer", transition: "background .15s" }} onMouseOver={e => e.currentTarget.style.background = COLORS.surfaceAlt} onMouseOut={e => e.currentTarget.style.background = "transparent"}>
                  <Avatar src={u.avatar} name={u.name} size={32} />
                  <div style={{ flex: 1, fontWeight: 600, fontSize: 13, color: COLORS.text }}>{u.name}</div>
                  <div style={{ fontSize: 11, color: COLORS.muted }}>⭐ {u.xp || 0} XP</div>
                </div>
              ))
            )}
          </div>
        )}
      </div>

      {/* Tabs */}
      <div style={{ display: "flex", gap: 10, marginBottom: 4 }}>
        <button onClick={() => setCurrentTab("feed")} style={{ flex: 1, padding: "10px", borderRadius: 10, border: `1px solid ${currentTab === "feed" ? COLORS.blue : COLORS.border}`, background: currentTab === "feed" ? COLORS.blue + "22" : "transparent", color: currentTab === "feed" ? COLORS.blue : COLORS.muted, fontFamily: "'Outfit',sans-serif", fontWeight: 700, cursor: "pointer", transition: "all .2s" }}>
          📰 Feed
        </button>
        <button onClick={() => setCurrentTab("post")} style={{ flex: 1, padding: "10px", borderRadius: 10, border: `1px solid ${currentTab === "post" ? COLORS.accent : COLORS.border}`, background: currentTab === "post" ? COLORS.accent + "22" : "transparent", color: currentTab === "post" ? COLORS.accent : COLORS.muted, fontFamily: "'Outfit',sans-serif", fontWeight: 700, cursor: "pointer", transition: "all .2s" }}>
          ✨ Create Post
        </button>
      </div>

      {currentTab === "post" && (
        <Card glow>
          <div style={{ display: "flex", gap: 14 }}>
            <Avatar src={user.avatar} name={user.name} size={42} />
            <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 10 }}>
              <textarea
                value={postText}
                onChange={e => setPostText(e.target.value)}
                placeholder="Share something with the community…"
                rows={3}
                style={{ background: COLORS.surfaceAlt, border: `1px solid ${COLORS.border}`, borderRadius: 10, padding: "11px 14px", color: COLORS.text, fontFamily: "'DM Sans',sans-serif", fontSize: 14, outline: "none", resize: "none", transition: "border .18s", width: "100%" }}
                onFocus={e => e.target.style.borderColor = COLORS.blue}
                onBlur={e => e.target.style.borderColor = COLORS.border}
              />
              {postImg && (
                <div style={{ position: "relative", display: "inline-block" }}>
                  <img src={postImg} alt="preview" style={{ maxHeight: 160, borderRadius: 10, border: `1px solid ${COLORS.border}` }} />
                  <button onClick={() => setPostImg(null)} style={{ position: "absolute", top: 6, right: 6, background: COLORS.danger, border: "none", borderRadius: "50%", width: 22, height: 22, color: "#fff", cursor: "pointer", fontSize: 12, display: "flex", alignItems: "center", justifyContent: "center" }}>×</button>
                </div>
              )}
              {postErr && <div style={{ color: COLORS.danger, fontSize: 13 }}>⚠ {postErr}</div>}
              <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                <input ref={fileRef} type="file" accept="image/*" style={{ display: "none" }} onChange={handleImagePick} />
                <button onClick={() => fileRef.current?.click()} style={{ background: COLORS.surfaceAlt, border: `1px solid ${COLORS.border}`, borderRadius: 8, padding: "7px 14px", color: COLORS.muted, cursor: "pointer", fontSize: 13, fontFamily: "'Outfit',sans-serif", display: "flex", alignItems: "center", gap: 6 }}>
                  📷 Photo
                </button>
                <Btn onClick={submitPost} disabled={posting || (!postText.trim() && !postImg)} style={{ background: COLORS.blue, color: "#000", padding: "8px 20px" }}>
                  {posting ? "Posting…" : "Post"}
                </Btn>
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* Posts feed */}
      {currentTab === "feed" && (
        <>
          {loadingPosts ? (
            <div style={{ textAlign: "center", color: COLORS.muted, padding: "40px 0" }}>Loading posts…</div>
          ) : posts.length === 0 ? (
            <Card><div style={{ textAlign: "center", color: COLORS.muted, padding: "30px 0" }}>No posts yet. Be the first to post! 🚀</div></Card>
          ) : (
            posts.map(post => (
              <PostCard key={post._id} post={post} currentUser={user} onLike={() => toggleLike(post._id)} onComment={text => addComment(post._id, text)} onFollowToggle={toggleFollow} onViewProfile={id => setViewProfile(id)} onDelete={deletePost} onEdit={editPost} />
            ))
          )}
        </>
      )}
    </div>
  );
}

function PostCard({ post, currentUser, onLike, onComment, onFollowToggle, onViewProfile, onDelete, onEdit }) {
  const [showComments, setShowComments] = useState(false);
  const [commentText, setCommentText] = useState("");
  const [editing, setEditing] = useState(false);
  const [editText, setEditText] = useState(post.text || "");
  const [saving, setSaving] = useState(false);
  const liked = (post.likes || []).includes(currentUser.id);
  const isOwn = post.authorId === currentUser.id;
  const isFollowing = (currentUser.following || []).includes(post.authorId);

  function timeAgo(ts) {
    const diff = Date.now() - new Date(ts).getTime();
    const m = Math.floor(diff / 60000);
    if (m < 1) return "just now";
    if (m < 60) return `${m}m ago`;
    const h = Math.floor(m / 60);
    if (h < 24) return `${h}h ago`;
    return `${Math.floor(h / 24)}d ago`;
  }

  async function saveEdit() {
    if (!editText.trim()) return;
    setSaving(true);
    try {
      await fetch(`${BASE_URL}/connect/post/${post._id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", "Authorization": "Bearer " + window._authToken },
        body: JSON.stringify({ text: editText }),
      });
      setEditing(false);
      if (onEdit) onEdit(post._id, editText);
    } catch { }
    setSaving(false);
  }

  return (
    <div className="post-card" style={{ background: COLORS.surface, border: `1px solid ${COLORS.border}`, borderRadius: 16, padding: "18px 20px", animation: "fadeUp .3s ease both" }}>
      <div style={{ display: "flex", alignItems: "flex-start", gap: 12, marginBottom: 12 }}>
        <Avatar src={post.authorAvatar} name={post.authorName} size={40} onClick={() => onViewProfile(post.authorId)} style={{ cursor: "pointer" }} />
        <div style={{ flex: 1 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
            <span onClick={() => onViewProfile(post.authorId)} style={{ fontWeight: 700, fontSize: 14, fontFamily: "'Syne',sans-serif", cursor: "pointer", color: COLORS.text }}
              onMouseOver={e => e.target.style.color = COLORS.blue} onMouseOut={e => e.target.style.color = COLORS.text}>{post.authorName}</span>
            <span style={{ fontSize: 11, color: COLORS.muted }}>{timeAgo(post.createdAt)}</span>
            {!isOwn && (
              <button className="connect-btn" onClick={() => onFollowToggle(post.authorId)}
                style={{ background: isFollowing ? COLORS.surfaceAlt : COLORS.blue + "22", border: `1px solid ${isFollowing ? COLORS.border : COLORS.blue + "55"}`, borderRadius: 6, padding: "2px 10px", fontSize: 11, color: isFollowing ? COLORS.muted : COLORS.blue, cursor: "pointer", fontFamily: "'Outfit',sans-serif", fontWeight: 600 }}>
                {isFollowing ? "Following" : "+ Follow"}
              </button>
            )}
            {/* Bug 3 fix: own post edit/delete buttons */}
            {isOwn && (
              <div style={{ marginLeft: "auto", display: "flex", gap: 6 }}>
                <button onClick={() => { setEditing(v => !v); setEditText(post.text || ""); }}
                  style={{ background: COLORS.surfaceAlt, border: `1px solid ${COLORS.border}`, borderRadius: 6, padding: "2px 9px", fontSize: 11, color: COLORS.muted, cursor: "pointer", fontFamily: "'Outfit',sans-serif", fontWeight: 600 }}>
                  ✏️ Edit
                </button>
                <button onClick={() => { if (window.confirm("Delete this post?")) onDelete(post._id); }}
                  style={{ background: COLORS.danger + "18", border: `1px solid ${COLORS.danger}44`, borderRadius: 6, padding: "2px 9px", fontSize: 11, color: COLORS.danger, cursor: "pointer", fontFamily: "'Outfit',sans-serif", fontWeight: 600 }}>
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
          <textarea value={editText} onChange={e => setEditText(e.target.value)} rows={3}
            style={{ background: COLORS.surfaceAlt, border: `1px solid ${COLORS.blue}`, borderRadius: 10, padding: "10px 14px", color: COLORS.text, fontFamily: "'DM Sans',sans-serif", fontSize: 14, outline: "none", resize: "none", width: "100%", caretColor: COLORS.text }} />
          <div style={{ display: "flex", gap: 8 }}>
            <button onClick={saveEdit} disabled={saving || !editText.trim()}
              style={{ background: COLORS.blue, border: "none", borderRadius: 8, padding: "7px 16px", color: "#000", cursor: "pointer", fontFamily: "'Outfit',sans-serif", fontWeight: 700, fontSize: 13 }}>
              {saving ? "Saving…" : "Save"}
            </button>
            <button onClick={() => setEditing(false)}
              style={{ background: "transparent", border: `1px solid ${COLORS.border}`, borderRadius: 8, padding: "7px 16px", color: COLORS.muted, cursor: "pointer", fontFamily: "'Outfit',sans-serif", fontSize: 13 }}>
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

      <div style={{ display: "flex", gap: 16, marginTop: 14, paddingTop: 12, borderTop: `1px solid ${COLORS.border}` }}>
        <button className="like-btn" onClick={onLike}
          style={{ display: "flex", alignItems: "center", gap: 6, background: "transparent", border: "none", cursor: "pointer", color: liked ? COLORS.pink : COLORS.muted, fontSize: 13, fontFamily: "'Outfit',sans-serif", fontWeight: liked ? 600 : 400 }}>
          <span style={{ fontSize: 16 }}>{liked ? "❤️" : "🤍"}</span> {(post.likes || []).length}
        </button>
        <button onClick={() => setShowComments(v => !v)}
          style={{ display: "flex", alignItems: "center", gap: 6, background: "transparent", border: "none", cursor: "pointer", color: showComments ? COLORS.blue : COLORS.muted, fontSize: 13, fontFamily: "'Outfit',sans-serif" }}>
          <span style={{ fontSize: 16 }}>💬</span> {(post.comments || []).length}
        </button>
      </div>

      {showComments && (
        <div style={{ marginTop: 14 }}>
          {(post.comments || []).map((c, i) => (
            <div key={i} style={{ display: "flex", gap: 10, marginBottom: 10, padding: "8px 10px", background: COLORS.surfaceAlt, borderRadius: 10 }}>
              <Avatar src={c.authorAvatar} name={c.authorName} size={26} onClick={() => onViewProfile(c.authorId)} />
              <div style={{ flex: 1 }}>
                <span style={{ fontWeight: 700, fontSize: 12, color: COLORS.accent, marginRight: 6 }}>{c.authorName}</span>
                <span style={{ fontSize: 13, color: COLORS.text }}>{c.text}</span>
              </div>
              {/* Bug 6 fix: admin can delete comments — handled via admin panel delete post covers comments too */}
            </div>
          ))}
          <div style={{ display: "flex", gap: 8, marginTop: 8, alignItems: "center" }}>
            <Avatar src={currentUser.avatar} name={currentUser.name} size={28} />
            <input
              value={commentText}
              onChange={e => setCommentText(e.target.value)}
              placeholder="Write a comment…"
              onKeyDown={e => { if (e.key === "Enter" && commentText.trim()) { onComment(commentText); setCommentText(""); } }}
              style={{ flex: 1, background: COLORS.surfaceAlt, border: `1px solid ${COLORS.border}`, borderRadius: 8, padding: "7px 12px", color: COLORS.text, fontFamily: "'DM Sans',sans-serif", fontSize: 13, outline: "none", caretColor: COLORS.text }}
              onFocus={e => e.target.style.borderColor = COLORS.blue}
              onBlur={e => e.target.style.borderColor = COLORS.border}
            />
            <button onClick={() => { if (commentText.trim()) { onComment(commentText); setCommentText(""); } }}
              style={{ background: COLORS.blue, border: "none", borderRadius: 8, padding: "7px 11px", color: "#000", cursor: "pointer", fontFamily: "'Outfit',sans-serif", fontWeight: 600, fontSize: 12, whiteSpace: "nowrap", flexShrink: 0, width: "auto" }}>
              Send
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function UserProfileView({ userId, currentUser, onBack, onFollow, onMessage }) {
  const [profile, setProfile] = useState(null);
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const [pRes, postsRes] = await Promise.all([
          fetch(`${BASE_URL}/connect/user/${userId}`, { headers: { "Authorization": "Bearer " + window._authToken } }),
          fetch(`${BASE_URL}/connect/user/${userId}/posts`, { headers: { "Authorization": "Bearer " + window._authToken } }),
        ]);
        if (pRes.ok) setProfile(await pRes.json());
        if (postsRes.ok) setPosts(await postsRes.json());
      } catch { }
      setLoading(false);
    }
    load();
  }, [userId]);

  if (loading) return <div style={{ color: COLORS.muted, padding: 40, textAlign: "center" }}>Loading profile…</div>;
  if (!profile) return <div style={{ color: COLORS.danger, padding: 40 }}>User not found.</div>;

  const isFollowing = (currentUser.following || []).includes(userId);
  const isOwn = userId === currentUser.id;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20, maxWidth: "100%" }}>
      <button onClick={onBack} style={{ alignSelf: "flex-start", display: "flex", alignItems: "center", gap: 6, background: COLORS.surfaceAlt, border: `1px solid ${COLORS.border}`, borderRadius: 10, padding: "8px 14px", color: COLORS.muted, cursor: "pointer", fontFamily: "'Outfit',sans-serif", fontSize: 13, fontWeight: 500 }}>
        ← Back to Feed
      </button>

      <Card>
        <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
          <Avatar src={profile.avatar} name={profile.name} size={80} />
          <div style={{ flex: 1 }}>
            <div style={{ fontFamily: "'Syne',sans-serif", fontWeight: 800, fontSize: 22 }}>{profile.name}</div>
            <div style={{ color: COLORS.muted, fontSize: 13, marginTop: 3 }}>{profile.email}</div>
            <div style={{ display: "flex", gap: 20, marginTop: 10 }}>
              <div style={{ textAlign: "center" }}>
                <div style={{ fontWeight: 800, fontSize: 18, color: COLORS.accent, fontFamily: "'Syne',sans-serif" }}>{(profile.followers || []).length}</div>
                <div style={{ fontSize: 11, color: COLORS.muted }}>Followers</div>
              </div>
              <div style={{ textAlign: "center" }}>
                <div style={{ fontWeight: 800, fontSize: 18, color: COLORS.accent, fontFamily: "'Syne',sans-serif" }}>{(profile.following || []).length}</div>
                <div style={{ fontSize: 11, color: COLORS.muted }}>Following</div>
              </div>
              <div style={{ textAlign: "center" }}>
                <div style={{ fontWeight: 800, fontSize: 18, color: COLORS.gold, fontFamily: "'Syne',sans-serif" }}>{profile.xp || 0}</div>
                <div style={{ fontSize: 11, color: COLORS.muted }}>XP</div>
              </div>
            </div>
          </div>
          {!isOwn && (
            <div style={{ display: "flex", gap: 8, flexDirection: "column" }}>
              <button className="connect-btn" onClick={() => onFollow(userId)}
                style={{ background: isFollowing ? COLORS.surfaceAlt : COLORS.blue, border: `1px solid ${isFollowing ? COLORS.border : COLORS.blue}`, borderRadius: 10, padding: "9px 20px", color: isFollowing ? COLORS.muted : "#000", cursor: "pointer", fontFamily: "'Outfit',sans-serif", fontWeight: 700, fontSize: 14 }}>
                {isFollowing ? "Unfollow" : "+ Follow"}
              </button>
              <button onClick={() => onMessage(userId)}
                style={{ background: COLORS.accent + "18", border: `1px solid ${COLORS.accent}55`, borderRadius: 10, padding: "9px 20px", color: COLORS.accent, cursor: "pointer", fontFamily: "'Outfit',sans-serif", fontWeight: 700, fontSize: 14 }}>
                💬 Message
              </button>
            </div>
          )}
        </div>
      </Card>

      <div style={{ fontFamily: "'Syne',sans-serif", fontWeight: 700, fontSize: 16, color: COLORS.muted }}>Posts ({posts.length})</div>
      {posts.length === 0 ? (
        <Card><div style={{ textAlign: "center", color: COLORS.muted, padding: "20px 0" }}>No posts yet.</div></Card>
      ) : posts.map(post => (
        <div key={post._id} style={{ background: COLORS.surface, border: `1px solid ${COLORS.border}`, borderRadius: 14, padding: "16px 18px" }}>
          {post.text && <p style={{ fontSize: 14, lineHeight: 1.7 }}>{post.text}</p>}
          {post.image && <img src={post.image} alt="" style={{ width: "100%", maxHeight: 300, objectFit: "cover", borderRadius: 10, marginTop: 10 }} />}
          <div style={{ display: "flex", gap: 16, marginTop: 10, color: COLORS.muted, fontSize: 12 }}>
            <span>❤️ {(post.likes || []).length}</span>
            <span>💬 {(post.comments || []).length}</span>
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── SUPPORT TICKET PAGE ──────────────────────────────────────────────────────

function SupportPage({ user }) {
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [category, setCategory] = useState("bug");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [err, setErr] = useState("");
  const [myTickets, setMyTickets] = useState([]);

  useEffect(() => {
    fetch(`${BASE_URL}/support/my-tickets`, { headers: { "Authorization": "Bearer " + window._authToken } })
      .then(r => r.json()).then(d => { if (Array.isArray(d)) setMyTickets(d); }).catch(() => { });
  }, [submitted]);

  async function submitTicket() {
    if (!subject.trim() || !message.trim()) { setErr("Please fill in all fields."); return; }
    setSubmitting(true); setErr("");
    try {
      const res = await fetch(`${BASE_URL}/support/ticket`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "Authorization": "Bearer " + window._authToken },
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
            {categories.map(c => (
              <button key={c.id} onClick={() => setCategory(c.id)}
                style={{ padding: "7px 14px", borderRadius: 8, border: `1px solid ${category === c.id ? COLORS.pink + "77" : COLORS.border}`, background: category === c.id ? COLORS.pink + "18" : "transparent", color: category === c.id ? COLORS.pink : COLORS.muted, cursor: "pointer", fontFamily: "'Outfit',sans-serif", fontSize: 12, fontWeight: 600, transition: "all .15s" }}>
                {c.label}
              </button>
            ))}
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <label style={{ fontSize: 11, color: COLORS.muted, fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase" }}>Subject</label>
            <input value={subject} onChange={e => setSubject(e.target.value)} placeholder="Brief summary of the issue…"
              style={{ background: COLORS.surfaceAlt, border: `1px solid ${COLORS.border}`, borderRadius: 10, padding: "11px 14px", color: COLORS.text, fontFamily: "'DM Sans',sans-serif", fontSize: 14, outline: "none" }}
              onFocus={e => e.target.style.borderColor = COLORS.pink} onBlur={e => e.target.style.borderColor = COLORS.border} />
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <label style={{ fontSize: 11, color: COLORS.muted, fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase" }}>Description</label>
            <textarea value={message} onChange={e => setMessage(e.target.value)} placeholder="Describe the issue in detail…" rows={5}
              style={{ background: COLORS.surfaceAlt, border: `1px solid ${COLORS.border}`, borderRadius: 10, padding: "11px 14px", color: COLORS.text, fontFamily: "'DM Sans',sans-serif", fontSize: 14, outline: "none", resize: "vertical" }}
              onFocus={e => e.target.style.borderColor = COLORS.pink} onBlur={e => e.target.style.borderColor = COLORS.border} />
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
            {myTickets.map(t => (
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

// ─── ADMIN PANEL ──────────────────────────────────────────────────────────────

function AdminPanel({ adminEmail, onLogout }) {
  const [tab, setTab] = useState("users"); // "users" | "tickets" | "connect" | "online"
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
  const [tickets, setTickets] = useState([]);
  const [connectPosts, setConnectPosts] = useState([]);
  const [onlineUsers, setOnlineUsers] = useState([]);

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
    loadConnectPosts();
    loadOnline();
    const interval = setInterval(loadOnline, 15000); // refresh online every 15s
    return () => clearInterval(interval);
  }, []);

  function selectUser(u) {
    setSelected(u); setMsg(""); setErr("");
    setEditName(u.name); setEditEmail(u.email);
    setEditXp(String(u.xp)); setEditStreak(String(u.streak));
  }

  async function action(path, method = "POST", body = null) {
    setMsg(""); setErr("");
    const { ok, data } = await adminFetch(path, method, body);
    if (ok) { setMsg(data.msg || "Done"); loadUsers(); if (selected) setSelected(prev => ({ ...prev, ...(data.user || {}) })); }
    else setErr(data.msg || "Error");
  }

  async function replyTicket(ticketId, reply) {
    const { ok, data } = await adminFetch(`/admin/ticket/${ticketId}/reply`, "POST", { reply, status: "resolved" });
    if (ok) { loadTickets(); }
  }

  async function deleteTicket(ticketId) {
    const { ok } = await adminFetch(`/admin/ticket/${ticketId}`, "DELETE");
    if (ok) loadTickets();
  }

  async function deleteComment(postId, commentIdx) {
    const { ok } = await adminFetch(`/admin/connect-post/${postId}/comment/${commentIdx}`, "DELETE");
    if (ok) loadConnectPosts();
  }

  async function deletePost(postId) {
    const { ok } = await adminFetch(`/admin/connect-post/${postId}`, "DELETE");
    if (ok) loadConnectPosts();
  }

  const filtered = users.filter(u => u.name.toLowerCase().includes(search.toLowerCase()) || u.email.toLowerCase().includes(search.toLowerCase()));
  const panelInput = { background: COLORS.surfaceAlt, border: `1px solid ${COLORS.border}`, borderRadius: 8, padding: "8px 12px", color: COLORS.text, fontFamily: "'DM Sans',sans-serif", fontSize: 13, outline: "none", width: "100%" };

  const tabs = [
    { id: "users", label: `👥 Users (${users.length})` },
    { id: "online", label: `🟢 Online (${onlineUsers.length})` },
    { id: "tickets", label: `🎫 Tickets (${tickets.filter(t => t.status === "open").length} open)` },
    { id: "connect", label: `🌐 Posts (${connectPosts.length})` },
  ];

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: COLORS.bg }}>
      <style>{css}</style>

      {/* LEFT — user list */}
      <div style={{ width: 280, background: COLORS.surface, borderRight: `1px solid ${COLORS.border}`, display: "flex", flexDirection: "column", height: "100vh", position: "sticky", top: 0 }}>
        <div style={{ padding: "20px 16px", borderBottom: `1px solid ${COLORS.border}` }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
            <h2 style={{ fontFamily: "'Syne',sans-serif", fontWeight: 800, fontSize: 18 }}>
              🛡 Admin <span style={{ color: COLORS.admin }}>Panel</span>
            </h2>
            <button onClick={onLogout} style={{ background: COLORS.danger + "22", border: `1px solid ${COLORS.danger}44`, borderRadius: 8, padding: "5px 10px", color: COLORS.danger, cursor: "pointer", fontSize: 12, fontFamily: "'Outfit',sans-serif" }}>Exit</button>
          </div>
          <div style={{ fontSize: 11, color: COLORS.muted, marginBottom: 12 }}>Logged in as <span style={{ color: COLORS.admin }}>{adminEmail}</span></div>

          {/* Tab buttons */}
          <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            {tabs.map(t => (
              <button key={t.id} onClick={() => setTab(t.id)}
                style={{ padding: "8px 10px", borderRadius: 8, border: `1px solid ${tab === t.id ? COLORS.admin + "55" : COLORS.border}`, background: tab === t.id ? COLORS.admin + "18" : "transparent", color: tab === t.id ? COLORS.admin : COLORS.muted, cursor: "pointer", fontFamily: "'Outfit',sans-serif", fontSize: 12, fontWeight: 600, textAlign: "left" }}>
                {t.label}
              </button>
            ))}
          </div>

          {tab === "users" && (
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search users…" style={{ ...panelInput, width: "100%", boxSizing: "border-box", marginTop: 10 }} />
          )}
        </div>

        <div style={{ flex: 1, overflowY: "auto" }}>
          {tab === "users" && (loading ? <div style={{ padding: 20, color: COLORS.muted, textAlign: "center" }}>Loading…</div> : filtered.map(u => (
            <div key={u.id} onClick={() => selectUser(u)}
              style={{ padding: "12px 16px", cursor: "pointer", borderBottom: `1px solid ${COLORS.border}`, background: selected?.id === u.id ? COLORS.admin + "15" : "transparent", transition: "background .15s", borderLeft: selected?.id === u.id ? `3px solid ${COLORS.admin}` : "3px solid transparent" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <Avatar src={u.avatar} name={u.name} size={30} />
                <div style={{ overflow: "hidden", flex: 1 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: u.banned ? COLORS.danger : COLORS.text, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                    {u.name} {u.banned && <span style={{ fontSize: 10, color: COLORS.danger }}>BANNED</span>}
                  </div>
                  <div style={{ fontSize: 11, color: COLORS.muted }}>{u.email}</div>
                  {/* Role pills in list */}
                  {(u.roles || []).length > 0 && (
                    <div style={{ display: "flex", gap: 4, marginTop: 3, flexWrap: "wrap" }}>
                      {(u.roles || []).slice(0, 2).map(rId => {
                        const role = ROLES.find(r => r.id === rId);
                        if (!role) return null;
                        return <span key={rId} style={{ fontSize: 9, background: role.color + "22", color: role.color, border: `1px solid ${role.color}44`, borderRadius: 4, padding: "1px 5px", fontWeight: 700 }}>{role.icon} {role.label}</span>;
                      })}
                    </div>
                  )}
                </div>
              </div>
              <div style={{ fontSize: 10, color: COLORS.muted, marginTop: 4, display: "flex", gap: 8 }}>
                <span>⭐ {u.xp}</span><span>🔥 {u.streak}</span><span>🏅 {(u.badges || []).length}</span>
              </div>
            </div>
          )))}

          {tab === "online" && (
            <div style={{ padding: 16 }}>
              <div style={{ fontSize: 11, color: COLORS.muted, marginBottom: 12, textTransform: "uppercase", fontWeight: 600 }}>Active in last 5 min</div>
              {onlineUsers.length === 0 ? <div style={{ color: COLORS.muted, textAlign: "center", padding: "20px 0" }}>No active users right now</div>
                : onlineUsers.map(u => (
                  <div key={u.id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 0", borderBottom: `1px solid ${COLORS.border}` }}>
                    <div style={{ position: "relative" }}>
                      <Avatar src={u.avatar} name={u.name} size={32} />
                      <div style={{ position: "absolute", bottom: -2, right: -2, width: 10, height: 10, borderRadius: "50%", background: COLORS.accent, border: `2px solid ${COLORS.surface}` }} />
                    </div>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 600 }}>{u.name}</div>
                      <div style={{ fontSize: 11, color: COLORS.muted }}>{u.email}</div>
                    </div>
                  </div>
                ))}
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
                <div style={{ fontFamily: "'Syne',sans-serif", fontWeight: 800, fontSize: 20 }}>{selected.name}</div>
                <div style={{ color: COLORS.muted, fontSize: 13 }}>{selected.email}</div>
                <div style={{ display: "flex", gap: 8, marginTop: 6 }}>{(selected.badges || []).map(b => { const badge = ALL_BADGES.find(x => x.id === b); return badge ? <span key={b} title={badge.label} style={{ fontSize: 18 }}>{badge.icon}</span> : null; })}</div>
              </div>
            </div>

            {msg && <div style={{ background: COLORS.accent + "18", border: `1px solid ${COLORS.accent}44`, borderRadius: 10, padding: "10px 14px", color: COLORS.accent, fontSize: 13 }}>✓ {msg}</div>}
            {err && <div style={{ background: COLORS.danger + "18", border: `1px solid ${COLORS.danger}44`, borderRadius: 10, padding: "10px 14px", color: COLORS.danger, fontSize: 13 }}>⚠ {err}</div>}

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}><label style={{ fontSize: 11, color: COLORS.muted, fontWeight: 600, letterSpacing: "0.06em", textTransform: "uppercase" }}>Name</label><input value={editName} onChange={e => setEditName(e.target.value)} style={panelInput} /></div>
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}><label style={{ fontSize: 11, color: COLORS.muted, fontWeight: 600, letterSpacing: "0.06em", textTransform: "uppercase" }}>Email</label><input value={editEmail} onChange={e => setEditEmail(e.target.value)} style={panelInput} /></div>
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}><label style={{ fontSize: 11, color: COLORS.muted, fontWeight: 600, letterSpacing: "0.06em", textTransform: "uppercase" }}>XP</label><input value={editXp} onChange={e => setEditXp(e.target.value)} type="number" style={panelInput} /></div>
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}><label style={{ fontSize: 11, color: COLORS.muted, fontWeight: 600, letterSpacing: "0.06em", textTransform: "uppercase" }}>Streak</label><input value={editStreak} onChange={e => setEditStreak(e.target.value)} type="number" style={panelInput} /></div>
            </div>
            <Btn variant="admin" onClick={() => action(`/admin/user/${selected.id}/update`, "POST", { name: editName, email: editEmail, xp: parseInt(editXp), streak: parseInt(editStreak) })}>💾 Save Changes</Btn>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 10 }}>
              <Btn variant="ghost" style={{ fontSize: 12, padding: "8px 10px" }} onClick={() => action(`/admin/user/${selected.id}/reset-streak`)}>Reset Streak</Btn>
              <Btn variant="ghost" style={{ fontSize: 12, padding: "8px 10px" }} onClick={() => action(`/admin/user/${selected.id}/reset-xp`)}>Reset XP</Btn>
              <Btn variant="ghost" style={{ fontSize: 12, padding: "8px 10px" }} onClick={() => action(`/admin/user/${selected.id}/reset-all`)}>Reset All</Btn>
            </div>

            <div style={{ display: "flex", gap: 10, alignItems: "flex-end" }}>
              <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 6 }}>
                <label style={{ fontSize: 11, color: COLORS.muted, fontWeight: 600, letterSpacing: "0.06em", textTransform: "uppercase" }}>Badge ID</label>
                <select value={badgeInput} onChange={e => setBadgeInput(e.target.value)} style={{ ...panelInput, cursor: "pointer" }}>
                  {ALL_BADGES.map(b => <option key={b.id} value={b.id}>{b.icon} {b.label}</option>)}
                </select>
              </div>
              <Btn variant="admin" style={{ fontSize: 12, padding: "9px 14px" }} onClick={() => action(`/admin/user/${selected.id}/give-badge`, "POST", { badge_id: badgeInput })}>Give</Btn>
              <Btn variant="danger" style={{ fontSize: 12, padding: "9px 14px" }} onClick={() => action(`/admin/user/${selected.id}/remove-badge`, "POST", { badge_id: badgeInput })}>Remove</Btn>
            </div>

            <div style={{ display: "flex", gap: 10 }}>
              <Btn variant={selected.banned ? "ghost" : "danger"} onClick={() => action(`/admin/user/${selected.id}/ban`, "POST", { banned: !selected.banned })} style={{ flex: 1 }}>
                {selected.banned ? "✅ Unban User" : "🚫 Ban User"}
              </Btn>
              <Btn variant="danger" onClick={() => { if (window.confirm(`Delete ${selected.name}?`)) action(`/admin/user/${selected.id}/delete`, "DELETE"); }} style={{ flex: 1 }}>
                🗑 Delete User
              </Btn>
            </div>

            {/* Discord-style Roles */}
            <div style={{ borderTop: `1px solid ${COLORS.border}`, paddingTop: 16 }}>
              <div style={{ fontFamily: "'Syne',sans-serif", fontWeight: 700, fontSize: 14, marginBottom: 12, display: "flex", alignItems: "center", gap: 8 }}>
                <span>🎭</span> Roles
                <span style={{ fontSize: 11, color: COLORS.muted, fontWeight: 400 }}>— Like Discord</span>
              </div>
              {/* Current roles */}
              <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 12 }}>
                {(selected.roles || []).length === 0 ? (
                  <span style={{ fontSize: 12, color: COLORS.muted }}>No roles assigned</span>
                ) : (selected.roles || []).map(rId => {
                  const role = ROLES.find(r => r.id === rId);
                  if (!role) return null;
                  return (
                    <span key={rId} style={{ display: "inline-flex", alignItems: "center", gap: 5, background: role.color + "22", border: `1px solid ${role.color}55`, borderRadius: 8, padding: "4px 10px", fontSize: 12, color: role.color, fontWeight: 600 }}>
                      {role.icon} {role.label}
                      <button onClick={() => action(`/admin/user/${selected.id}/update`, "POST", { roles: (selected.roles || []).filter(r => r !== rId) })}
                        style={{ background: "none", border: "none", color: role.color + "99", cursor: "pointer", fontSize: 14, padding: 0, lineHeight: 1, marginLeft: 2 }}>×</button>
                    </span>
                  );
                })}
              </div>
              {/* Add role buttons */}
              <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                {ROLES.filter(r => !(selected.roles || []).includes(r.id)).map(role => (
                  <button key={role.id} title={role.desc}
                    onClick={() => action(`/admin/user/${selected.id}/update`, "POST", { roles: [...(selected.roles || []), role.id] })}
                    style={{ display: "inline-flex", alignItems: "center", gap: 5, background: COLORS.surfaceAlt, border: `1px solid ${COLORS.border}`, borderRadius: 8, padding: "5px 12px", fontSize: 12, color: COLORS.muted, cursor: "pointer", fontFamily: "'Outfit',sans-serif", fontWeight: 500, transition: "all .15s" }}
                    onMouseOver={e => { e.currentTarget.style.borderColor = role.color + "66"; e.currentTarget.style.color = role.color; e.currentTarget.style.background = role.color + "15"; }}
                    onMouseOut={e => { e.currentTarget.style.borderColor = COLORS.border; e.currentTarget.style.color = COLORS.muted; e.currentTarget.style.background = COLORS.surfaceAlt; }}>
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
            {tickets.length === 0 ? <Card><div style={{ color: COLORS.muted, textAlign: "center", padding: "30px 0" }}>No tickets yet.</div></Card>
              : tickets.map(t => <TicketCard key={t._id} ticket={t} onReply={replyTicket} onDelete={deleteTicket} />)}
          </div>
        )}

        {/* CONNECT POSTS TAB */}
        {tab === "connect" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <h3 style={{ fontFamily: "'Syne',sans-serif", fontWeight: 800, fontSize: 20 }}>ZuxterConnect Posts</h3>
            {connectPosts.length === 0 ? <Card><div style={{ color: COLORS.muted, textAlign: "center", padding: "30px 0" }}>No posts yet.</div></Card>
              : connectPosts.map(p => (
                <div key={p._id} style={{ background: COLORS.surface, border: `1px solid ${COLORS.border}`, borderRadius: 14, padding: "16px 18px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                    <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                      <Avatar src={p.authorAvatar} name={p.authorName} size={34} />
                      <div>
                        <div style={{ fontWeight: 700, fontSize: 13 }}>{p.authorName}</div>
                        <div style={{ fontSize: 11, color: COLORS.muted }}>{p.authorEmail} · {new Date(p.createdAt).toLocaleString()}</div>
                      </div>
                    </div>
                    <button onClick={() => { if (window.confirm("Delete this post?")) deletePost(p._id); }}
                      style={{ background: COLORS.danger + "18", border: `1px solid ${COLORS.danger}44`, borderRadius: 7, padding: "4px 10px", color: COLORS.danger, cursor: "pointer", fontSize: 12, fontFamily: "'Outfit',sans-serif" }}>Delete</button>
                  </div>
                  {p.text && <p style={{ fontSize: 13, color: COLORS.text, marginTop: 10, lineHeight: 1.6 }}>{p.text}</p>}
                  {p.image && <img src={p.image} alt="" style={{ maxHeight: 200, width: "100%", objectFit: "cover", borderRadius: 8, marginTop: 8 }} />}
                  <div style={{ fontSize: 11, color: COLORS.muted, marginTop: 8 }}>❤️ {(p.likes || []).length} · 💬 {(p.comments || []).length}</div>
                  {/* Bug 6: Admin delete individual comments */}
                  {(p.comments || []).length > 0 && (
                    <div style={{ marginTop: 10, borderTop: `1px solid ${COLORS.border}`, paddingTop: 8 }}>
                      <div style={{ fontSize: 11, color: COLORS.muted, fontWeight: 600, marginBottom: 6 }}>Comments</div>
                      {(p.comments || []).map((c, ci) => (
                        <div key={ci} style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", padding: "5px 8px", background: COLORS.surfaceAlt, borderRadius: 7, marginBottom: 4 }}>
                          <div>
                            <span style={{ fontWeight: 700, fontSize: 11, color: COLORS.accent, marginRight: 6 }}>{c.authorName}</span>
                            <span style={{ fontSize: 12, color: COLORS.text }}>{c.text}</span>
                          </div>
                          <button onClick={() => { if (window.confirm("Delete this comment?")) deleteComment(p._id, ci); }}
                            style={{ background: COLORS.danger + "18", border: `1px solid ${COLORS.danger}44`, borderRadius: 5, padding: "2px 7px", color: COLORS.danger, cursor: "pointer", fontSize: 10, fontFamily: "'Outfit',sans-serif", flexShrink: 0, marginLeft: 8 }}>×</button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
          </div>
        )}

        {/* ONLINE TAB */}
        {tab === "online" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <h3 style={{ fontFamily: "'Syne',sans-serif", fontWeight: 800, fontSize: 20 }}>Online Users</h3>
              <button onClick={loadOnline} style={{ background: COLORS.accent + "18", border: `1px solid ${COLORS.accent}44`, borderRadius: 8, padding: "5px 12px", color: COLORS.accent, cursor: "pointer", fontSize: 12, fontFamily: "'Outfit',sans-serif" }}>↻ Refresh</button>
            </div>
            <div style={{ color: COLORS.muted, fontSize: 13 }}>Users active in the last 5 minutes: <span style={{ color: COLORS.accent, fontWeight: 700 }}>{onlineUsers.length}</span></div>
            {onlineUsers.length === 0 ? <Card><div style={{ color: COLORS.muted, textAlign: "center", padding: "30px 0" }}>No users currently active.</div></Card>
              : <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(200px,1fr))", gap: 12 }}>
                {onlineUsers.map(u => (
                  <div key={u.id} style={{ background: COLORS.surface, border: `1px solid ${COLORS.accent}22`, borderRadius: 12, padding: "14px 16px", display: "flex", alignItems: "center", gap: 12 }}>
                    <div style={{ position: "relative" }}>
                      <Avatar src={u.avatar} name={u.name} size={38} />
                      <div style={{ position: "absolute", bottom: -2, right: -2, width: 11, height: 11, borderRadius: "50%", background: COLORS.accent, border: `2px solid ${COLORS.surface}`, animation: "pulse 2s infinite" }} />
                    </div>
                    <div style={{ overflow: "hidden" }}>
                      <div style={{ fontWeight: 600, fontSize: 13, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{u.name}</div>
                      <div style={{ fontSize: 11, color: COLORS.muted }}>⭐ {u.xp} XP</div>
                    </div>
                  </div>
                ))}
              </div>}
          </div>
        )}
      </div>
    </div>
  );
}

function TicketCard({ ticket, onReply, onDelete }) {
  const [replyText, setReplyText] = useState("");
  const [open, setOpen] = useState(false);
  const [sending, setSending] = useState(false);
  const statusColor = { open: COLORS.gold, in_progress: COLORS.blue, resolved: COLORS.accent, closed: COLORS.muted };

  async function handleSend() {
    if (!replyText.trim()) return;
    setSending(true);
    await onReply(ticket._id, replyText);
    setReplyText("");
    setOpen(false);
    setSending(false);
  }

  return (
    <div style={{ background: COLORS.surface, border: `1px solid ${ticket.status === "open" ? COLORS.gold + "33" : COLORS.border}`, borderRadius: 14, padding: "16px 18px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
        <div>
          <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 4 }}>{ticket.subject}</div>
          <div style={{ fontSize: 12, color: COLORS.muted }}>
            {ticket.userName} · {ticket.userEmail} · {ticket.category} · {new Date(ticket.createdAt).toLocaleString()}
          </div>
        </div>
        <div style={{ display: "flex", gap: 8, alignItems: "center", flexShrink: 0, marginLeft: 10 }}>
          <span style={{ fontSize: 11, background: (statusColor[ticket.status] || COLORS.muted) + "22", color: statusColor[ticket.status] || COLORS.muted, border: `1px solid ${(statusColor[ticket.status] || COLORS.muted)}44`, borderRadius: 6, padding: "3px 10px", fontWeight: 600, textTransform: "uppercase" }}>{ticket.status}</span>
          <button onClick={() => { if (window.confirm("Delete this ticket?")) onDelete(ticket._id); }}
            style={{ background: COLORS.danger + "18", border: `1px solid ${COLORS.danger}44`, borderRadius: 6, padding: "3px 9px", color: COLORS.danger, cursor: "pointer", fontSize: 11, fontFamily: "'Outfit',sans-serif", fontWeight: 600 }}>🗑 Delete</button>
        </div>
      </div>
      <div style={{ fontSize: 13, color: COLORS.text, lineHeight: 1.6, padding: "10px 12px", background: COLORS.surfaceAlt, borderRadius: 8, marginBottom: 10 }}>{ticket.message}</div>
      {ticket.adminReply && (
        <div style={{ padding: "10px 12px", background: COLORS.accent + "0a", border: `1px solid ${COLORS.accent}22`, borderRadius: 8, marginBottom: 10 }}>
          <div style={{ fontSize: 11, color: COLORS.accent, fontWeight: 700, marginBottom: 2 }}>Your Reply</div>
          <div style={{ fontSize: 13 }}>{ticket.adminReply}</div>
        </div>
      )}
      {ticket.status !== "resolved" && (
        <div>
          <button onClick={() => setOpen(v => !v)} style={{ background: COLORS.admin + "18", border: `1px solid ${COLORS.admin}44`, borderRadius: 8, padding: "6px 14px", color: COLORS.admin, cursor: "pointer", fontSize: 12, fontFamily: "'Outfit',sans-serif", fontWeight: 600 }}>
            {open ? "Cancel" : "Reply & Resolve"}
          </button>
          {open && (
            <div style={{ display: "flex", gap: 8, marginTop: 10, alignItems: "center" }}>
              <input value={replyText} onChange={e => setReplyText(e.target.value)}
                onKeyDown={e => e.key === "Enter" && handleSend()}
                placeholder="Type your reply…"
                style={{ flex: 1, background: COLORS.surfaceAlt, border: `1px solid ${COLORS.border}`, borderRadius: 8, padding: "8px 12px", color: COLORS.text, fontFamily: "'DM Sans',sans-serif", fontSize: 13, outline: "none", caretColor: COLORS.text }} />
              <button onClick={handleSend} disabled={sending || !replyText.trim()}
                style={{ background: sending ? COLORS.admin + "55" : COLORS.admin, border: "none", borderRadius: 8, padding: "7px 12px", color: "#fff", cursor: sending ? "not-allowed" : "pointer", fontFamily: "'Outfit',sans-serif", fontWeight: 700, fontSize: 12, display: "flex", alignItems: "center", gap: 5, flexShrink: 0, whiteSpace: "nowrap", width: "auto" }}>
                {sending ? <><BtnSpinner /> Sending…</> : "Send"}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── PDF + RESULT BLOCK ───────────────────────────────────────────────────────

function downloadPDF(text, title) {
  // Convert text to HTML with bold headings, proper alignment
  const lines = text.split("\n");
  let html = "";
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) { html += "<br/>"; continue; }
    // Numbered section heading (e.g. "1. Day 1: ...")
    if (/^\d+[\.\)]/.test(trimmed)) {
      html += `<p style="font-weight:900;font-size:16px;color:#000;margin:16px 0 6px;text-align:left;"><strong>${trimmed}</strong></p>`;
    } else if (/^[A-Z][^a-z]{0,5}:/.test(trimmed) || (trimmed.endsWith(":") && trimmed.length < 60)) {
      // Short all-caps or colon-ended lines as sub-headings
      html += `<p style="font-weight:800;font-size:14px;margin:12px 0 4px;text-align:left;"><strong>${trimmed}</strong></p>`;
    } else if (/^[-•*]/.test(trimmed)) {
      html += `<p style="margin:4px 0 4px 18px;text-align:left;">${trimmed}</p>`;
    } else {
      html += `<p style="margin:5px 0;text-align:left;">${trimmed}</p>`;
    }
  }

  const el = document.createElement("div");
  el.innerHTML = `
    <div style="position:relative;font-family:Arial,sans-serif;padding:30px 36px;color:#000;line-height:1.7;text-align:left;">
      <div style="position:absolute;top:50%;left:50%;transform:translate(-50%,-50%) rotate(-30deg);font-size:60px;color:rgba(0,0,0,0.04);font-weight:900;pointer-events:none;white-space:nowrap;">ZuxterX</div>
      <div style="position:absolute;top:15px;right:25px;font-size:14px;font-weight:700;color:#000;">ZuxterX</div>
      <h2 style="text-align:left;margin-bottom:25px;font-size:24px;font-weight:900;color:#000;border-bottom:2px solid #000;padding-bottom:10px;">${title}</h2>
      ${html}
    </div>`;

  html2pdf().set({
    margin: [10, 10, 10, 10],
    filename: "zuxter-output.pdf",
    image: { type: "jpeg", quality: 1 },
    html2canvas: { scale: 3, useCORS: true },
    jsPDF: { unit: "mm", format: "a4", orientation: "portrait" }
  }).from(el).save();
}

function formatResponse(text) {
  const lines = text.split("\n");
  const elements = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmed = line.trim();

    if (!trimmed) {
      elements.push(<div key={i} style={{ height: 8 }} />);
      continue;
    }

    // Numbered heading (1. Day 1: ...)
    if (/^\d+[\.\)]/.test(trimmed)) {
      elements.push(
        <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: 10, marginTop: 18, marginBottom: 4 }}>
          <span style={{ minWidth: 28, height: 28, borderRadius: 8, background: `linear-gradient(135deg,${COLORS.accent},${COLORS.blue})`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 800, color: "#000", flexShrink: 0 }}>
            {trimmed.match(/^\d+/)[0]}
          </span>
          <p style={{ fontWeight: 800, color: COLORS.accent, fontSize: 15, fontFamily: "'Syne',sans-serif", lineHeight: "28px", margin: 0 }}>
            {trimmed.replace(/^\d+[\.\)]\s*/, "")}
          </p>
        </div>
      );
      // Bullet points
    } else if (/^[-•*]/.test(trimmed)) {
      elements.push(
        <div key={i} style={{ display: "flex", gap: 8, alignItems: "flex-start", marginLeft: 20, marginTop: 3 }}>
          <span style={{ color: COLORS.accent, marginTop: 6, flexShrink: 0, fontSize: 10 }}>◆</span>
          <p style={{ fontSize: 14, color: "#c8d0da", lineHeight: 1.75, margin: 0 }}>{trimmed.replace(/^[-•*]\s*/, "")}</p>
        </div>
      );
      // Sub-headings ending with colon or short all-uppercase
    } else if (trimmed.endsWith(":") && trimmed.length < 60 && !trimmed.includes(" ") === false) {
      elements.push(
        <p key={i} style={{ fontWeight: 700, fontSize: 13, color: COLORS.gold, letterSpacing: "0.06em", textTransform: "uppercase", marginTop: 14, marginBottom: 4, borderLeft: `3px solid ${COLORS.gold}`, paddingLeft: 10 }}>
          {trimmed.replace(/:$/, "")}
        </p>
      );
      // Normal paragraph
    } else {
      elements.push(
        <p key={i} style={{ fontSize: 14, color: "#c8d0da", lineHeight: 1.75, margin: "5px 0" }}>{trimmed}</p>
      );
    }
  }
  return elements;
}

function ResultBlock({ text, label, color = COLORS.accent }) {
  const [copied, setCopied] = useState(false);

  return (
    <div style={{ background: "linear-gradient(145deg,#0d1420,#0f172a)", border: `1px solid ${color}33`, borderRadius: 16, padding: "20px 22px", marginTop: 16, animation: "fadeUp .4s ease", boxShadow: `0 8px 32px rgba(0,0,0,0.3), 0 0 0 1px ${color}11` }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ width: 4, height: 28, borderRadius: 4, background: `linear-gradient(to bottom,${color},${color}66)` }} />
          <Tag color={color}>{label}</Tag>
          <span style={{ fontSize: 11, color: COLORS.muted }}>{text.split(" ").length} words</span>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <button onClick={() => { navigator.clipboard.writeText(text); setCopied(true); setTimeout(() => setCopied(false), 1500); }}
            style={{ background: COLORS.surfaceAlt, border: `1px solid ${COLORS.border}`, borderRadius: 8, padding: "6px 14px", color: copied ? COLORS.accent : COLORS.muted, fontSize: 12, cursor: "pointer", fontFamily: "'DM Sans',sans-serif", fontWeight: 500, transition: "all .15s" }}>
            {copied ? "✓ Copied!" : "📋 Copy"}
          </button>
          <button onClick={() => downloadPDF(text, label)}
            style={{ background: color + "18", border: `1px solid ${color}55`, borderRadius: 8, padding: "6px 14px", color: color, fontSize: 12, cursor: "pointer", fontFamily: "'DM Sans',sans-serif", fontWeight: 600, transition: "all .15s" }}>
            ⬇ PDF
          </button>
        </div>
      </div>

      {/* Styled output area */}
      <div style={{ background: "rgba(0,0,0,0.3)", borderRadius: 12, border: `1px solid rgba(255,255,255,0.06)`, padding: "18px 20px", maxHeight: 520, overflowY: "auto" }}>
        {formatResponse(text)}
      </div>
    </div>
  );
}

// ─── AI PAGES ─────────────────────────────────────────────────────────────────

function PlannerPage({ user, onUpdate }) {
  const [syllabus, setSyllabus] = useState(""); const [days, setDays] = useState("7");
  const [result, setResult] = useState(""); const [loading, setLoading] = useState(false);
  async function generate() {
    if (!syllabus.trim()) return;
    setLoading(true); setResult("");
    try {
      const out = await callAI(`Create a ${days}-day study plan for this syllabus:\n\n${syllabus}`);
      setResult(out);
      const updated = await recordActivity("planner");
      if (updated) onUpdate(updated);
    } catch { setResult("Error generating plan."); }
    setLoading(false);
  }
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <div><h2 style={{ fontFamily: "'Syne',sans-serif", fontSize: 26, fontWeight: 800 }}>Study Planner</h2><p style={{ color: COLORS.muted, marginTop: 4, fontSize: 14 }}>Get a personalized day-by-day study schedule.</p></div>
      <Card><div style={{ display: "flex", flexDirection: "column", gap: 16 }}><SyllabusInput value={syllabus} onChange={setSyllabus} />
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}><label style={{ fontSize: 12, color: COLORS.muted, fontWeight: 500, textTransform: "uppercase" }}>Study Duration (days)</label><input type="number" value={days} onChange={e => setDays(e.target.value)} style={{ background: COLORS.surfaceAlt, border: `1px solid ${COLORS.border}`, borderRadius: 10, padding: "11px 14px", color: COLORS.text, fontFamily: "'DM Sans',sans-serif", fontSize: 14, outline: "none" }} /></div>
        <Btn onClick={generate} disabled={loading || !syllabus.trim()}>{loading ? "Generating…" : "✨ Generate Study Plan"}</Btn>
        {loading && <Spinner />}
      </div></Card>
      {result && <ResultBlock text={result} label="Study Plan" color={COLORS.gold} />}
    </div>
  );
}

function QuestionsPage({ user, onUpdate }) {
  const [syllabus, setSyllabus] = useState(""); const [level, setLevel] = useState("mixed");
  const [result, setResult] = useState(""); const [loading, setLoading] = useState(false);
  async function generate() {
    if (!syllabus.trim()) return;
    setLoading(true); setResult("");
    try {
      const out = await callAI(`Generate ${level === "easy" ? "beginner" : level === "hard" ? "advanced" : "mixed-level"} important questions for:\n\n${syllabus}`);
      setResult(out);
      const updated = await recordActivity("questions");
      if (updated) onUpdate(updated);
    } catch { setResult("Error generating questions."); }
    setLoading(false);
  }
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <div><h2 style={{ fontFamily: "'Syne',sans-serif", fontSize: 26, fontWeight: 800 }}>Important Questions</h2><p style={{ color: COLORS.muted, marginTop: 4, fontSize: 14 }}>AI-generated exam-ready questions.</p></div>
      <Card><div style={{ display: "flex", flexDirection: "column", gap: 16 }}><SyllabusInput value={syllabus} onChange={setSyllabus} />
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}><label style={{ fontSize: 12, color: COLORS.muted, fontWeight: 500, textTransform: "uppercase" }}>Difficulty</label>
          <div style={{ display: "flex", gap: 8 }}>{["easy", "mixed", "hard"].map(l => <button key={l} onClick={() => setLevel(l)} style={{ flex: 1, padding: "9px 0", borderRadius: 8, border: `1px solid ${level === l ? COLORS.blue : COLORS.border}`, background: level === l ? COLORS.blue + "22" : "transparent", color: level === l ? COLORS.blue : COLORS.muted, cursor: "pointer", fontFamily: "'DM Sans',sans-serif", fontWeight: 600, fontSize: 13, textTransform: "capitalize", transition: "all .18s" }}>{l}</button>)}</div>
        </div>
        <Btn onClick={generate} disabled={loading || !syllabus.trim()} style={{ background: COLORS.blue, color: "#000" }}>{loading ? "Generating…" : "🧠 Generate Questions"}</Btn>
        {loading && <Spinner />}
      </div></Card>
      {result && <ResultBlock text={result} label="Questions" color={COLORS.blue} />}
    </div>
  );
}

function SummaryPage({ user, onUpdate }) {
  const [syllabus, setSyllabus] = useState(""); const [style, setStyle] = useState("concise");
  const [result, setResult] = useState(""); const [loading, setLoading] = useState(false);
  async function generate() {
    if (!syllabus.trim()) return;
    setLoading(true); setResult("");
    try {
      const out = await callAI(`Create a ${style} summary of this content:\n\n${syllabus}`);
      setResult(out);
      const updated = await recordActivity("summary");
      if (updated) onUpdate(updated);
    } catch { setResult("Error generating summary."); }
    setLoading(false);
  }
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <div><h2 style={{ fontFamily: "'Syne',sans-serif", fontSize: 26, fontWeight: 800 }}>AI Summaries</h2><p style={{ color: COLORS.muted, marginTop: 4, fontSize: 14 }}>Condensed, revision-ready summaries.</p></div>
      <Card><div style={{ display: "flex", flexDirection: "column", gap: 16 }}><SyllabusInput value={syllabus} onChange={setSyllabus} />
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}><label style={{ fontSize: 12, color: COLORS.muted, fontWeight: 500, textTransform: "uppercase" }}>Style</label>
          <div style={{ display: "flex", gap: 8 }}>{["concise", "detailed", "bullet points"].map(s => <button key={s} onClick={() => setStyle(s)} style={{ flex: 1, padding: "9px 0", borderRadius: 8, border: `1px solid ${style === s ? COLORS.gold : COLORS.border}`, background: style === s ? COLORS.gold + "22" : "transparent", color: style === s ? COLORS.gold : COLORS.muted, cursor: "pointer", fontFamily: "'DM Sans',sans-serif", fontWeight: 600, fontSize: 12, textTransform: "capitalize", transition: "all .18s" }}>{s}</button>)}</div>
        </div>
        <Btn onClick={generate} disabled={loading || !syllabus.trim()} style={{ background: COLORS.gold, color: "#000" }}>{loading ? "Generating…" : "📝 Generate Summary"}</Btn>
        {loading && <Spinner />}
      </div></Card>
      {result && <ResultBlock text={result} label="Summary" color={COLORS.gold} />}
    </div>
  );
}

function BadgesPage({ user }) {
  const earned = new Set(user.badges || []);
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <div><h2 style={{ fontFamily: "'Syne',sans-serif", fontSize: 26, fontWeight: 800 }}>Achievements</h2><p style={{ color: COLORS.muted, marginTop: 4, fontSize: 14 }}>Earn badges by using ZuxterX consistently.</p></div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(180px,1fr))", gap: 14 }}>
        {ALL_BADGES.map(b => {
          const has = earned.has(b.id);
          return <Card key={b.id} style={{ textAlign: "center", padding: "24px 16px", border: `1px solid ${has ? COLORS.gold + "55" : COLORS.border}`, background: has ? COLORS.gold + "0a" : COLORS.surface, animation: has ? "badgePop .5s ease both" : "fadeUp .4s ease", opacity: has ? 1 : .45, filter: has ? "none" : "grayscale(1)" }}>
            <div style={{ fontSize: 36, marginBottom: 10 }}>{b.icon}</div>
            <div style={{ fontFamily: "'Syne',sans-serif", fontWeight: 700, fontSize: 14, color: has ? COLORS.gold : COLORS.muted }}>{b.label}</div>
            <div style={{ fontSize: 12, color: COLORS.muted, marginTop: 6, lineHeight: 1.5 }}>{b.desc}</div>
            {has && <Tag color={COLORS.gold}>Earned</Tag>}
          </Card>;
        })}
      </div>
      <Card>
        <div style={{ display: "flex", gap: 32, flexWrap: "wrap" }}>
          {[{ label: "Plans", val: user.plans || 0, icon: "🗓" }, { label: "Q-Sets", val: user.qSets || 0, icon: "❓" }, { label: "Summaries", val: user.summaries || 0, icon: "📝" }, { label: "Max Streak", val: user.maxStreak || 0, icon: "🔥" }, { label: "Total XP", val: user.xp || 0, icon: "⭐" }].map(s => (
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

function LeaderboardPage({ currentUser }) {
  const [board, setBoard] = useState([]);
  const [loading, setLoading] = useState(true);
  const medals = ["🥇", "🥈", "🥉"];

  useEffect(() => {
    fetch(`${BASE_URL}/leaderboard`).then(r => r.json()).then(d => { setBoard(d); setLoading(false); }).catch(() => setLoading(false));
  }, []);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <div><h2 style={{ fontFamily: "'Syne',sans-serif", fontSize: 26, fontWeight: 800 }}>Leaderboard</h2><p style={{ color: COLORS.muted, marginTop: 4, fontSize: 14 }}>Top students ranked by XP — updated live from server.</p></div>
      <Card>
        {loading ? <div style={{ color: COLORS.muted, textAlign: "center", padding: "24px 0" }}>Loading…</div>
          : board.length === 0 ? <p style={{ color: COLORS.muted, textAlign: "center", padding: "24px 0" }}>No users yet. Be the first!</p>
            : <div style={{ display: "flex", flexDirection: "column" }}>
              {board.filter(u => (u.xp || 0) > 0).map((u, i) => {
                const isMe = u.email === currentUser.email;
                return <div key={u.id} style={{ display: "flex", alignItems: "center", gap: 16, padding: "14px 12px", borderRadius: 10, background: isMe ? COLORS.accent + "12" : "transparent", borderBottom: i < board.length - 1 ? `1px solid ${COLORS.border}` : "none" }}>
                  <span style={{ fontSize: 20, width: 28, textAlign: "center" }}>{medals[i] || `#${i + 1}`}</span>
                  <Avatar src={u.avatar} name={u.name} size={32} />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 600, fontSize: 14, color: isMe ? COLORS.accent : COLORS.text }}>{u.name} {isMe && <Tag color={COLORS.accent}>You</Tag>}</div>
                    <div style={{ fontSize: 12, color: COLORS.muted, marginTop: 2 }}>🔥 {u.streak} streak · 🏅 {(u.badges || []).length} badges</div>
                  </div>
                  <div style={{ fontFamily: "'Syne',sans-serif", fontWeight: 800, fontSize: 18, color: COLORS.gold }}>{u.xp} <span style={{ fontSize: 11, fontWeight: 400, color: COLORS.muted }}>XP</span></div>
                </div>;
              })}
            </div>}
      </Card>
    </div>
  );
}

// ─── ROOT APP ─────────────────────────────────────────────────────────────────

export default function App() {
  const [user, setUser] = useState(null);
  const [adminUser, setAdminUser] = useState(null);
  const [active, setActive] = useState("planner");
  const [prevActive, setPrevActive] = useState("planner");
  const [newBadge, setNewBadge] = useState(null);
  const [showNotifs, setShowNotifs] = useState(false);
  const [notifCount, setNotifCount] = useState(0);
  const [msgCount, setMsgCount] = useState(0);

  function handleLogin(data) { setUser(data); }
  function handleAdminLogin(data) { setAdminUser(data); }
  function handleLogout() { clearSession(); setUser(null); setActive("planner"); }
  function handleAdminLogout() { clearSession(); setAdminUser(null); }

  function handleUpdate(updatedUser) {
    const prevBadges = new Set(user.badges || []);
    setUser(updatedUser);
    const freshBadge = (updatedUser.badges || []).find(b => !prevBadges.has(b));
    if (freshBadge) {
      const badge = ALL_BADGES.find(b => b.id === freshBadge);
      setNewBadge(badge);
      setTimeout(() => setNewBadge(null), 3000);
    }
  }

  function handleUserUpdate(updatedUser) { setUser(updatedUser); }

  function navigateTo(page) {
    setPrevActive(active);
    setActive(page);
    setShowNotifs(false);
  }

  function goBack() { setActive(prevActive); }

  // Heartbeat + badge/msg/notif poll
  useEffect(() => {
    if (!user) return;
    const ping = () => fetch(`${BASE_URL}/heartbeat`, {
      method: "POST", headers: { "Authorization": "Bearer " + window._authToken }
    }).catch(() => { });
    const pollCounts = async () => {
      try {
        const [nr, mr] = await Promise.all([
          fetch(`${BASE_URL}/notifications/unread-count`, { headers: { "Authorization": "Bearer " + window._authToken } }),
          fetch(`${BASE_URL}/msg/unread-count`, { headers: { "Authorization": "Bearer " + window._authToken } }),
        ]);
        if (nr.ok) { const d = await nr.json(); setNotifCount(d.count || 0); }
        if (mr.ok) { const d = await mr.json(); setMsgCount(d.count || 0); }
      } catch { }
    };
    ping();
    pollCounts();
    const id1 = setInterval(ping, 60000);
    const id2 = setInterval(pollCounts, 15000);
    return () => { clearInterval(id1); clearInterval(id2); };
  }, [user]);

  const splineBg = (
    <>
      <div style={{ position: "fixed", inset: 0, zIndex: -2, opacity: user && !adminUser ? 0.45 : 1, transition: "opacity 1.5s ease", pointerEvents: "auto" }}>
        <iframe src="https://my.spline.design/retrofuturisticcircuitloop-26VXgZZN9YuD1DemISWkC4US/" frameBorder="0" width="100%" height="100%" style={{ background: 'transparent' }} allow="autoplay; fullscreen" />
      </div>
      <div style={{ position: "fixed", inset: 0, pointerEvents: "none", background: `radial-gradient(circle at center, transparent ${user && !adminUser ? '40%' : '0%'}, #05080f ${user && !adminUser ? '150%' : '85%'})`, zIndex: -1 }} />
    </>
  );

  if (adminUser) return <>{splineBg}<AdminPanel adminEmail={adminUser.email} onLogout={handleAdminLogout} /></>;
  if (!user) return <>{splineBg}<AuthScreen onLogin={handleLogin} onAdminLogin={handleAdminLogin} /></>;

  const pages = {
    planner: PlannerPage,
    questions: QuestionsPage,
    summary: SummaryPage,
    badges: BadgesPage,
    leaderboard: LeaderboardPage,
  };

  function renderPage() {
    if (active === "profile") return <ProfilePage user={user} onUserUpdate={handleUserUpdate} onBack={goBack} />;
    if (active === "connect") return <ZuxterConnect user={user} onUserUpdate={handleUserUpdate} />;
    if (active === "support") return <SupportPage user={user} />;
    if (active === "messages") return <MessagingPage user={user} />;
    const Page = pages[active];
    if (Page) return <Page user={user} onUpdate={handleUpdate} currentUser={user} />;
    return null;
  }

  // Desktop sidebar — add messages + notif button
  const sidebarWithMsg = (
    <div className="sidebar-wrap" style={{ background: COLORS.surface, borderRight: `1px solid ${COLORS.border}`, display: "flex", flexDirection: "column", padding: "20px 12px", height: "100vh", position: "sticky", top: 0, overflowY: "auto" }}>
      <div style={{ padding: "0 4px", marginBottom: 24 }}>
        <h2 style={{ fontFamily: "'Syne',sans-serif", fontWeight: 800, fontSize: 22, letterSpacing: "-0.5px" }}>
          Zuxter<span style={{ color: COLORS.accent, textShadow: `0 0 12px ${COLORS.accent}88` }}>X</span>
        </h2>
        <div style={{ fontSize: 11, color: COLORS.muted, marginTop: 2 }}>AI Study Platform</div>
      </div>

      <div onClick={() => navigateTo("profile")} title="Click to view profile"
        style={{ display: "flex", alignItems: "center", gap: 10, background: active === "profile" ? COLORS.accent + "12" : COLORS.surfaceAlt, borderRadius: 12, padding: "10px 12px", marginBottom: 16, border: `1px solid ${active === "profile" ? COLORS.accent + "44" : COLORS.border}`, cursor: "pointer", transition: "all .2s" }}>
        <Avatar src={user.avatar} name={user.name} size={36} />
        <div style={{ overflow: "hidden", flex: 1 }}>
          <div style={{ fontWeight: 600, fontSize: 13, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{user.name}</div>
          <div style={{ fontSize: 10, color: COLORS.accent, marginTop: 1, fontWeight: 500 }}>⭐ {user.xp || 0} XP · 🔥 {user.streak || 0}</div>
        </div>
      </div>

      {/* Notif + Msg row */}
      <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
        <button onClick={() => setShowNotifs(v => !v)}
          style={{ flex: 1, display: "flex", alignItems: "center", gap: 6, background: showNotifs ? COLORS.pink + "18" : COLORS.surfaceAlt, border: `1px solid ${showNotifs ? COLORS.pink + "55" : COLORS.border}`, borderRadius: 10, padding: "8px 10px", color: showNotifs ? COLORS.pink : COLORS.muted, cursor: "pointer", fontFamily: "'Outfit',sans-serif", fontSize: 12, fontWeight: 600, position: "relative" }}>
          🔔 Notifs
          {notifCount > 0 && <span style={{ background: COLORS.pink, color: "#fff", borderRadius: "50%", width: 16, height: 16, fontSize: 9, fontWeight: 800, display: "inline-flex", alignItems: "center", justifyContent: "center", marginLeft: "auto" }}>{notifCount > 9 ? "9+" : notifCount}</span>}
        </button>
        <button onClick={() => navigateTo("messages")}
          style={{ flex: 1, display: "flex", alignItems: "center", gap: 6, background: active === "messages" ? COLORS.blue + "18" : COLORS.surfaceAlt, border: `1px solid ${active === "messages" ? COLORS.blue + "55" : COLORS.border}`, borderRadius: 10, padding: "8px 10px", color: active === "messages" ? COLORS.blue : COLORS.muted, cursor: "pointer", fontFamily: "'Outfit',sans-serif", fontSize: 12, fontWeight: 600 }}>
          💬 Msgs
          {msgCount > 0 && <span style={{ background: COLORS.blue, color: "#000", borderRadius: "50%", width: 16, height: 16, fontSize: 9, fontWeight: 800, display: "inline-flex", alignItems: "center", justifyContent: "center", marginLeft: "auto" }}>{msgCount > 9 ? "9+" : msgCount}</span>}
        </button>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 4, flex: 1 }}>
        {[
          { id: "planner", icon: "🗓", label: "Study Planner" },
          { id: "questions", icon: "❓", label: "Questions" },
          { id: "summary", icon: "📝", label: "AI Summary" },
          { id: "connect", icon: "🌐", label: "ZuxterConnect" },
          { id: "badges", icon: "🏅", label: "Achievements" },
          { id: "leaderboard", icon: "🏆", label: "Leaderboard" },
        ].map(item => {
          const isActive = active === item.id;
          return (
            <button key={item.id} onClick={() => navigateTo(item.id)} className="nav-btn"
              style={{ padding: "10px 14px", border: "none", borderRadius: 11, cursor: "pointer", background: isActive ? `linear-gradient(135deg,${COLORS.accent}22,${COLORS.accent}0a)` : "transparent", color: isActive ? COLORS.accent : COLORS.muted, fontFamily: "'Outfit',sans-serif", fontWeight: isActive ? 600 : 400, fontSize: 14, textAlign: "left", borderLeft: isActive ? `3px solid ${COLORS.accent}` : "3px solid transparent", display: "flex", alignItems: "center", gap: 10 }}>
              <span style={{ fontSize: 16 }}>{item.icon}</span>{item.label}
            </button>
          );
        })}
      </div>

      <button onClick={() => navigateTo("support")} className="nav-btn"
        style={{ padding: "10px 14px", border: `1px solid ${active === "support" ? COLORS.pink + "55" : COLORS.border}`, borderRadius: 11, cursor: "pointer", background: active === "support" ? COLORS.pink + "15" : "transparent", color: active === "support" ? COLORS.pink : COLORS.muted, fontFamily: "'Outfit',sans-serif", fontWeight: active === "support" ? 600 : 400, fontSize: 13, textAlign: "left", display: "flex", alignItems: "center", gap: 10, marginTop: 8, transition: "all 0.2s" }}>
        <span style={{ fontSize: 16 }}>🎫</span> Support
      </button>

      <button onClick={handleLogout} style={{ marginTop: 8, padding: "10px 14px", border: `1px solid ${COLORS.danger}33`, borderRadius: 11, background: COLORS.danger + "12", color: COLORS.danger, cursor: "pointer", fontFamily: "'Outfit',sans-serif", fontWeight: 600, fontSize: 13, display: "flex", alignItems: "center", gap: 8, transition: "all 0.2s" }}
        onMouseOver={e => e.currentTarget.style.background = COLORS.danger + "25"}
        onMouseOut={e => e.currentTarget.style.background = COLORS.danger + "12"}>
        <span>⏻</span> Sign Out
      </button>
    </div>
  );

  return (
    <>
      {splineBg}
      <div className="main-container" style={{ display: "flex", width: "100%", height: "100vh", overflow: "hidden" }} onClick={e => { if (showNotifs && !e.target.closest(".notif-panel") && !e.target.closest(".notif-btn")) setShowNotifs(false); }}>
        <style>{css}</style>

        {/* Desktop sidebar */}
        {sidebarWithMsg}

        {/* Mobile top bar */}
        <MobileTopBar
          user={user}
          active={active}
          notifCount={notifCount}
          msgCount={msgCount}
          onAvatarClick={() => navigateTo("profile")}
          onNotifClick={() => setShowNotifs(v => !v)}
          onMsgClick={() => navigateTo("messages")}
        />

        {/* Notifications panel */}
        {showNotifs && (
          <div className="notif-panel">
            <NotificationsPanel user={user} onClose={() => setShowNotifs(false)} onNavigate={navigateTo} />
          </div>
        )}

        {/* Main content */}
        <main className="main-scroll" style={{ flex: 1, maxWidth: "100%" }}>
          {renderPage()}
        </main>

        {/* Mobile bottom nav */}
        <MobileBottomNav active={active} setActive={navigateTo} />

        {/* Badge toast */}
        {newBadge && (
          <div className="badge-toast" style={{ position: "fixed", bottom: 28, right: 28, background: COLORS.surface, border: `1px solid ${COLORS.gold}55`, borderRadius: 16, padding: "16px 22px", boxShadow: `0 8px 32px ${COLORS.gold}22`, animation: "badgePop .5s ease", display: "flex", alignItems: "center", gap: 14, zIndex: 999 }}>
            <span style={{ fontSize: 36 }}>{newBadge.icon}</span>
            <div>
              <div style={{ fontSize: 11, color: COLORS.gold, fontWeight: 700, letterSpacing: ".08em", textTransform: "uppercase" }}>Badge Unlocked!</div>
              <div style={{ fontFamily: "'Syne',sans-serif", fontWeight: 700, fontSize: 16, marginTop: 2 }}>{newBadge.label}</div>
              <div style={{ fontSize: 12, color: COLORS.muted, marginTop: 3 }}>{newBadge.desc}</div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}

// ─── MESSAGING PAGE ───────────────────────────────────────────────────────────

function MessagingPage({ user, openWithId = null, onBack }) {
  const [inbox, setInbox] = useState([]);
  const [activeChat, setActiveChat] = useState(null); // { otherId, otherName, otherAvatar }
  const [messages, setMessages] = useState([]);
  const [msgText, setMsgText] = useState("");
  const [sending, setSending] = useState(false);
  const [loadingMsgs, setLoadingMsgs] = useState(false);
  const [searchUser, setSearchUser] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const bottomRef = useRef(null);
  const pollRef = useRef(null);

  async function loadInbox() {
    try {
      const res = await fetch(`${BASE_URL}/msg/inbox`, { headers: { "Authorization": "Bearer " + window._authToken } });
      if (res.ok) setInbox(await res.json());
    } catch { }
  }

  async function openChat(otherId, otherName, otherAvatar) {
    setActiveChat({ otherId, otherName, otherAvatar });
    setLoadingMsgs(true);
    try {
      const res = await fetch(`${BASE_URL}/msg/conversation/${otherId}`, { headers: { "Authorization": "Bearer " + window._authToken } });
      if (res.ok) setMessages(await res.json());
    } catch { }
    setLoadingMsgs(false);
  }

  async function sendMsg() {
    if (!msgText.trim() || !activeChat) return;
    setSending(true);
    const text = msgText; setMsgText("");
    try {
      await fetch(`${BASE_URL}/msg/send`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "Authorization": "Bearer " + window._authToken },
        body: JSON.stringify({ toId: activeChat.otherId, text }),
      });
      const res = await fetch(`${BASE_URL}/msg/conversation/${activeChat.otherId}`, { headers: { "Authorization": "Bearer " + window._authToken } });
      if (res.ok) setMessages(await res.json());
      loadInbox();
    } catch { }
    setSending(false);
  }

  // Poll for new messages every 4s when chat is open
  useEffect(() => {
    loadInbox();
    if (openWithId) {
      // will be set by parent
    }
  }, []);

  useEffect(() => {
    if (!activeChat) return;
    if (pollRef.current) clearInterval(pollRef.current);
    pollRef.current = setInterval(async () => {
      try {
        const res = await fetch(`${BASE_URL}/msg/conversation/${activeChat.otherId}`, { headers: { "Authorization": "Bearer " + window._authToken } });
        if (res.ok) { const data = await res.json(); setMessages(data); }
      } catch { }
    }, 4000);
    return () => clearInterval(pollRef.current);
  }, [activeChat]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Open chat if openWithId passed (from notification click etc)
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
    // Search from inbox first, then we show a hint
    const filtered = inbox.filter(i => i.otherName.toLowerCase().includes(q.toLowerCase()));
    setSearchResults(filtered.map(i => ({ id: i.otherId, name: i.otherName, avatar: i.otherAvatar })));
  }

  const isMobile = window.innerWidth <= 640;
  const showList = !isMobile || !activeChat;
  const showChat = !isMobile || !!activeChat;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      {onBack && (
        <button onClick={onBack} style={{ alignSelf: "flex-start", display: "flex", alignItems: "center", gap: 6, background: COLORS.surfaceAlt, border: `1px solid ${COLORS.border}`, borderRadius: 10, padding: "8px 14px", color: COLORS.muted, cursor: "pointer", fontFamily: "'Outfit',sans-serif", fontSize: 13, fontWeight: 500, transition: "all .18s" }}
          onMouseOver={e => { e.currentTarget.style.borderColor = COLORS.accent + "55"; e.currentTarget.style.color = COLORS.accent; }}
          onMouseOut={e => { e.currentTarget.style.borderColor = COLORS.border; e.currentTarget.style.color = COLORS.muted; }}>
          ← Back to Profile
        </button>
      )}
      <div style={{ display: "flex", height: onBack ? "calc(100vh - 100px)" : "calc(100vh - 48px)", maxHeight: 700, background: COLORS.surface, borderRadius: 16, border: `1px solid ${COLORS.border}`, overflow: "hidden" }}>

        {/* LEFT — Inbox list */}
        {showList && (
          <div style={{ width: isMobile ? "100%" : 280, borderRight: isMobile ? "none" : `1px solid ${COLORS.border}`, display: "flex", flexDirection: "column" }}>
            <div style={{ padding: "16px 14px", borderBottom: `1px solid ${COLORS.border}` }}>
              <div style={{ fontFamily: "'Syne',sans-serif", fontWeight: 800, fontSize: 17, marginBottom: 10 }}>💬 Messages</div>
              <input value={searchUser} onChange={e => { setSearchUser(e.target.value); searchUsers(e.target.value); }}
                placeholder="Search conversations…"
                style={{ width: "100%", background: COLORS.surfaceAlt, border: `1px solid ${COLORS.border}`, borderRadius: 9, padding: "8px 12px", color: COLORS.text, fontSize: 13, outline: "none" }}
                onFocus={e => e.target.style.borderColor = COLORS.accent}
                onBlur={e => e.target.style.borderColor = COLORS.border}
              />
            </div>
            <div style={{ flex: 1, overflowY: "auto" }}>
              {inbox.length === 0 && (
                <div style={{ padding: 24, textAlign: "center", color: COLORS.muted, fontSize: 13 }}>
                  No conversations yet.<br />Follow someone and start chatting!
                </div>
              )}
              {inbox.map(thread => (
                <div key={thread.otherId} onClick={() => openChat(thread.otherId, thread.otherName, thread.otherAvatar)}
                  style={{ display: "flex", gap: 12, padding: "12px 14px", cursor: "pointer", background: activeChat?.otherId === thread.otherId ? COLORS.accent + "12" : "transparent", borderBottom: `1px solid ${COLORS.border}`, borderLeft: activeChat?.otherId === thread.otherId ? `3px solid ${COLORS.accent}` : "3px solid transparent", transition: "background .15s" }}
                  onMouseOver={e => e.currentTarget.style.background = COLORS.surfaceAlt}
                  onMouseOut={e => e.currentTarget.style.background = activeChat?.otherId === thread.otherId ? COLORS.accent + "12" : "transparent"}>
                  <div style={{ position: "relative" }}>
                    <Avatar src={thread.otherAvatar} name={thread.otherName} size={42} />
                    {thread.unread > 0 && <div style={{ position: "absolute", top: -3, right: -3, background: COLORS.accent, color: "#000", borderRadius: "50%", width: 18, height: 18, fontSize: 10, fontWeight: 800, display: "flex", alignItems: "center", justifyContent: "center" }}>{thread.unread}</div>}
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
                </div>
              ))}
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
                <div>
                  <div style={{ fontWeight: 700, fontSize: 14, fontFamily: "'Syne',sans-serif" }}>{activeChat.otherName || "Loading…"}</div>
                  <div style={{ fontSize: 11, color: COLORS.accent }}>🔒 End-to-end encrypted</div>
                </div>
              </div>

              {/* Messages */}
              <div style={{ flex: 1, overflowY: "auto", padding: "16px", display: "flex", flexDirection: "column", gap: 8 }}>
                {loadingMsgs ? (
                  <div style={{ textAlign: "center", color: COLORS.muted, padding: "40px 0" }}>Loading…</div>
                ) : messages.length === 0 ? (
                  <div style={{ textAlign: "center", color: COLORS.muted, padding: "40px 0", fontSize: 13 }}>No messages yet. Say hi! 👋</div>
                ) : messages.map(m => {
                  const isMe = m.fromId === user.id;
                  return (
                    <div key={m._id} style={{ display: "flex", justifyContent: isMe ? "flex-end" : "flex-start", gap: 8, alignItems: "flex-end" }}>
                      {!isMe && <Avatar src={m.fromAvatar} name={m.fromName} size={28} />}
                      <div style={{ maxWidth: "70%", display: "flex", flexDirection: "column", alignItems: isMe ? "flex-end" : "flex-start", gap: 2 }}>
                        <div style={{ background: isMe ? COLORS.accent : COLORS.surfaceAlt, color: isMe ? "#000" : COLORS.text, borderRadius: isMe ? "16px 16px 4px 16px" : "16px 16px 16px 4px", padding: "9px 14px", fontSize: 14, lineHeight: 1.5, fontFamily: "'DM Sans',sans-serif", wordBreak: "break-word" }}>
                          {m.text}
                        </div>
                        <div style={{ fontSize: 10, color: COLORS.muted, display: "flex", alignItems: "center", gap: 4 }}>
                          {timeAgo(m.createdAt)}
                          {isMe && <span style={{ color: m.seen ? COLORS.blue : COLORS.muted }}>{m.seen ? "✓✓" : "✓"}</span>}
                        </div>
                      </div>
                      {isMe && <Avatar src={user.avatar} name={user.name} size={28} />}
                    </div>
                  );
                })}
                <div ref={bottomRef} />
              </div>

              {/* Input */}
              <div style={{ padding: "12px 16px", borderTop: `1px solid ${COLORS.border}`, display: "flex", gap: 10, alignItems: "flex-end" }}>
                <textarea
                  value={msgText}
                  onChange={e => setMsgText(e.target.value)}
                  onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMsg(); } }}
                  placeholder="Message… (Enter to send)"
                  rows={1}
                  style={{ flex: 1, background: COLORS.surfaceAlt, border: `1px solid ${COLORS.border}`, borderRadius: 20, padding: "10px 16px", color: COLORS.text, fontSize: 14, outline: "none", resize: "none", fontFamily: "'DM Sans',sans-serif", lineHeight: 1.5, maxHeight: 100, overflowY: "auto", transition: "border .18s" }}
                  onFocus={e => e.target.style.borderColor = COLORS.accent}
                  onBlur={e => e.target.style.borderColor = COLORS.border}
                />
                <button onClick={sendMsg} disabled={sending || !msgText.trim()}
                  style={{ width: 42, height: 42, borderRadius: "50%", background: msgText.trim() ? COLORS.accent : COLORS.surfaceAlt, border: "none", cursor: msgText.trim() ? "pointer" : "not-allowed", fontSize: 18, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, transition: "all .2s" }}>
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

// ─── NOTIFICATIONS PANEL ──────────────────────────────────────────────────────

function NotificationsPanel({ user, onClose, onNavigate }) {
  const [notifs, setNotifs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch(`${BASE_URL}/notifications`, { headers: { "Authorization": "Bearer " + window._authToken } });
        if (res.ok) setNotifs(await res.json());
        // mark seen
        fetch(`${BASE_URL}/notifications/mark-seen`, { method: "POST", headers: { "Authorization": "Bearer " + window._authToken } });
      } catch { }
      setLoading(false);
    }
    load();
  }, []);

  function timeAgo(ts) {
    if (!ts) return "";
    const diff = Date.now() - new Date(ts).getTime();
    const m = Math.floor(diff / 60000);
    if (m < 1) return "just now";
    if (m < 60) return `${m}m ago`;
    const h = Math.floor(m / 60);
    if (h < 24) return `${h}h ago`;
    return `${Math.floor(h / 24)}d ago`;
  }

  function notifIcon(type) {
    if (type === "follow") return { icon: "👤", color: COLORS.blue };
    if (type === "like") return { icon: "❤️", color: COLORS.pink };
    if (type === "comment") return { icon: "💬", color: COLORS.accent };
    if (type === "message") return { icon: "✉️", color: COLORS.gold };
    return { icon: "🔔", color: COLORS.muted };
  }

  function notifText(n) {
    if (n.type === "follow") return `${n.fromName} started following you`;
    if (n.type === "like") return `${n.fromName} liked your post`;
    if (n.type === "comment") return `${n.fromName} commented: "${n.text}"`;
    if (n.type === "message") return `${n.fromName}: ${n.text}`;
    return n.text;
  }

  return (
    <div style={{ position: "fixed", top: 56, right: 0, width: Math.min(360, window.innerWidth), maxHeight: "80vh", background: COLORS.surface, border: `1px solid ${COLORS.border}`, borderRadius: "0 0 16px 16px", boxShadow: "0 12px 40px rgba(0,0,0,0.5)", zIndex: 500, display: "flex", flexDirection: "column", overflow: "hidden", animation: "slideUp .2s ease" }}>
      <div style={{ padding: "14px 16px", borderBottom: `1px solid ${COLORS.border}`, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div style={{ fontFamily: "'Syne',sans-serif", fontWeight: 800, fontSize: 15 }}>🔔 Notifications</div>
        <button onClick={onClose} style={{ background: "none", border: "none", color: COLORS.muted, cursor: "pointer", fontSize: 18 }}>×</button>
      </div>
      <div style={{ flex: 1, overflowY: "auto" }}>
        {loading ? (
          <div style={{ padding: 24, textAlign: "center", color: COLORS.muted }}>Loading…</div>
        ) : notifs.length === 0 ? (
          <div style={{ padding: 32, textAlign: "center", color: COLORS.muted, fontSize: 13 }}>
            <div style={{ fontSize: 32, marginBottom: 8 }}>🔕</div>
            No notifications yet
          </div>
        ) : notifs.map(n => {
          const { icon, color } = notifIcon(n.type);
          return (
            <div key={n._id}
              onClick={() => { if (n.type === "message") { onNavigate("messages"); onClose(); } else if (n.postId) { onNavigate("connect"); onClose(); } }}
              style={{ display: "flex", gap: 12, padding: "12px 16px", borderBottom: `1px solid ${COLORS.border}`, cursor: "pointer", background: n.seen ? "transparent" : COLORS.accent + "08", transition: "background .15s" }}
              onMouseOver={e => e.currentTarget.style.background = COLORS.surfaceAlt}
              onMouseOut={e => e.currentTarget.style.background = n.seen ? "transparent" : COLORS.accent + "08"}>
              <div style={{ position: "relative" }}>
                <Avatar src={n.fromAvatar} name={n.fromName} size={38} />
                <div style={{ position: "absolute", bottom: -4, right: -4, fontSize: 14, background: COLORS.surface, borderRadius: "50%", width: 20, height: 20, display: "flex", alignItems: "center", justifyContent: "center" }}>{icon}</div>
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13, color: COLORS.text, lineHeight: 1.5 }}>{notifText(n)}</div>
                <div style={{ fontSize: 11, color: color, marginTop: 3 }}>{timeAgo(n.createdAt)}</div>
              </div>
              {!n.seen && <div style={{ width: 8, height: 8, borderRadius: "50%", background: COLORS.accent, marginTop: 6, flexShrink: 0 }} />}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── MOBILE TOP BAR ───────────────────────────────────────────────────────────

function MobileTopBar({ user, onAvatarClick, onNotifClick, onMsgClick, notifCount, msgCount, active }) {
  return (
    <div className="mobile-topbar">
      <div style={{ fontFamily: "'Syne',sans-serif", fontWeight: 800, fontSize: 20 }}>
        Zuxter<span style={{ color: COLORS.accent }}>X</span>
      </div>
      <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
        {/* Messages */}
        <button onClick={onMsgClick} style={{ position: "relative", background: active === "messages" ? COLORS.accent + "22" : "transparent", border: `1px solid ${active === "messages" ? COLORS.accent + "44" : COLORS.border}`, borderRadius: 10, width: 38, height: 38, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", fontSize: 16 }}>
          💬
          {msgCount > 0 && <div style={{ position: "absolute", top: -4, right: -4, background: COLORS.accent, color: "#000", borderRadius: "50%", width: 16, height: 16, fontSize: 9, fontWeight: 800, display: "flex", alignItems: "center", justifyContent: "center" }}>{msgCount > 9 ? "9+" : msgCount}</div>}
        </button>
        {/* Notifications */}
        <button onClick={onNotifClick} style={{ position: "relative", background: "transparent", border: `1px solid ${COLORS.border}`, borderRadius: 10, width: 38, height: 38, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", fontSize: 16 }}>
          🔔
          {notifCount > 0 && <div style={{ position: "absolute", top: -4, right: -4, background: COLORS.pink, color: "#fff", borderRadius: "50%", width: 16, height: 16, fontSize: 9, fontWeight: 800, display: "flex", alignItems: "center", justifyContent: "center" }}>{notifCount > 9 ? "9+" : notifCount}</div>}
        </button>
        {/* Avatar */}
        <Avatar src={user.avatar} name={user.name} size={36} onClick={onAvatarClick} />
      </div>
    </div>
  );
}

// ─── MOBILE BOTTOM NAV ────────────────────────────────────────────────────────

function MobileBottomNav({ active, setActive }) {
  const items = [
    { id: "planner", icon: "🗓", label: "Plan" },
    { id: "questions", icon: "❓", label: "Questions" },
    { id: "summary", icon: "📝", label: "Summary" },
    { id: "connect", icon: "🌐", label: "Feed" },
    { id: "badges", icon: "🏅", label: "Badges" },
    { id: "leaderboard", icon: "🏆", label: "Rank" },
  ];
  return (
    <div className="mobile-bottomnav">
      {items.map(item => {
        const isActive = active === item.id;
        return (
          <button key={item.id} onClick={() => setActive(item.id)}
            style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 2, background: "none", border: "none", cursor: "pointer", padding: "6px 0", color: isActive ? COLORS.accent : COLORS.muted }}>
            <span style={{ fontSize: 20, filter: isActive ? `drop-shadow(0 0 6px ${COLORS.accent})` : "none" }}>{item.icon}</span>
            <span style={{ fontSize: 10, fontWeight: isActive ? 700 : 400, fontFamily: "'Outfit',sans-serif" }}>{item.label}</span>
          </button>
        );
      })}
    </div>
  );
}
