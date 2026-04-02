import "./App.css";
import { useState, useEffect, useRef } from "react";
import carBg from "./assets/car.jpg";

// Inline styles / design tokens
const FONTS = `@import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=DM+Sans:ital,wght@0,300;0,400;0,500;1,300&display=swap');`;

const COLORS = {
  bg: "#0a0c10",
  surface: "#11141a",
  surfaceAlt: "#181c24",
  border: "#1f2530",
  accent: "#00e5a0",
  accentDim: "#00e5a022",
  accentHover: "#00ffb3",
  gold: "#ffd166",
  blue: "#4cc9f0",
  pink: "#f72585",
  text: "#e8ecf0",
  muted: "#6b7585",
  danger: "#ff4d6d",
};

const css = `
  ${FONTS}
  *,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
  body{background:${COLORS.bg};color:${COLORS.text};font-family:'DM Sans',sans-serif;min-height:100vh}
  ::-webkit-scrollbar{width:4px}
  ::-webkit-scrollbar-track{background:${COLORS.bg}}
  ::-webkit-scrollbar-thumb{background:${COLORS.border};border-radius:2px}
  @keyframes fadeUp{from{opacity:0;transform:translateY(18px)}to{opacity:1;transform:none}}
  @keyframes pulse{0%,100%{opacity:1}50%{opacity:.5}}
  @keyframes spin{to{transform:rotate(360deg)}}
  @keyframes shimmer{0%{background-position:-200% 0}100%{background-position:200% 0}}
  @keyframes badgePop{0%{transform:scale(0) rotate(-15deg)}70%{transform:scale(1.2) rotate(4deg)}100%{transform:scale(1) rotate(0deg)}}
`;

// Fake "DB" in memory
const USERS_KEY = "sp_users";
const SESSION_KEY = "sp_session";
function getUsers() { try { return JSON.parse(localStorage.getItem(USERS_KEY) || "{}"); } catch { return {}; } }
function saveUsers(u) { localStorage.setItem(USERS_KEY, JSON.stringify(u)); }
function getSession() { try { return JSON.parse(localStorage.getItem(SESSION_KEY) || "null"); } catch { return null; } }
function saveSession(s) { localStorage.setItem(SESSION_KEY, JSON.stringify(s)); }
function clearSession() { localStorage.removeItem(SESSION_KEY); }

// Badges config 
const ALL_BADGES = [
  { id: "first_plan", icon: "🎯", label: "First Plan", desc: "Generated your first study plan" },
  { id: "streak3",   icon: "🔥", label: "On Fire",    desc: "3-day streak achieved" },
  { id: "streak7",   icon: "⚡", label: "Lightning",  desc: "7-day streak achieved" },
  { id: "ten_q",     icon: "🧠", label: "Quizzed",    desc: "Generated 10+ question sets" },
  { id: "explorer",  icon: "🧭", label: "Explorer",   desc: "Tried all 3 AI features" },
  { id: "top3",      icon: "🏆", label: "Top 3",      desc: "Reached top 3 on leaderboard" },
];

//  Helpers 
const today = () => new Date().toISOString().slice(0, 10);

function updateStreak(user) {
  const t = today();
  if (user.lastActive === t) return user;
  const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
  const streak = user.lastActive === yesterday ? (user.streak || 0) + 1 : 1;
  return { ...user, lastActive: t, streak, maxStreak: Math.max(streak, user.maxStreak || 0) };
}

function checkBadges(user) {
  const earned = new Set(user.badges || []);
  if (user.plans >= 1) earned.add("first_plan");
  if (user.streak >= 3) earned.add("streak3");
  if (user.streak >= 7) earned.add("streak7");
  if (user.qSets >= 10) earned.add("ten_q");
  if (user.featuresUsed && user.featuresUsed.length >= 3) earned.add("explorer");
  return [...earned];
}

//  Claude API call 
async function callClaude(systemPrompt, userMsg) {
  const res = await fetch("https://zuxter-backend.onrender.com/api/ai", {
  method: "POST",
  headers: {
    "Content-Type": "application/json"
  },
  body: JSON.stringify({
    prompt: userMsg
  })
});

  const data = await res.json();
  return data.response;
}

// COMPONENTS


function Spinner() {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10, color: COLORS.accent, fontSize: 14 }}>
      <div style={{
        width: 18, height: 18, border: `2px solid ${COLORS.accentDim}`,
        borderTop: `2px solid ${COLORS.accent}`, borderRadius: "50%",
        animation: "spin .7s linear infinite",
      }} />
      Generating with AI…
    </div>
  );
}

function Tag({ children, color = COLORS.accent }) {
  return (
    <span style={{
      background: color + "22", color, border: `1px solid ${color}44`,
      borderRadius: 6, padding: "2px 10px", fontSize: 11, fontWeight: 600,
      letterSpacing: ".05em", textTransform: "uppercase",
    }}>{children}</span>
  );
}

function Card({ children, style = {}, glow = false }) {
  return (
    <div style={{
      background: COLORS.surface, border: `1px solid ${COLORS.border}`,
      borderRadius: 16, padding: "22px 24px",
      boxShadow: glow ? `0 0 24px ${COLORS.accent}22` : "none",
      animation: "fadeUp .4s ease both",
      ...style,
    }}>{children}</div>
  );
}

function Btn({ children, onClick, variant = "primary", disabled = false, style = {} }) {
  const base = {
    border: "none", borderRadius: 10, padding: "10px 22px",
    fontFamily: "'DM Sans',sans-serif", fontWeight: 600, fontSize: 14,
    cursor: disabled ? "not-allowed" : "pointer", transition: "all .18s",
    opacity: disabled ? .5 : 1, ...style,
  };
  const variants = {
    primary: { background: COLORS.accent, color: "#000" },
    ghost: { background: "transparent", color: COLORS.accent, border: `1px solid ${COLORS.accent}44` },
    danger: { background: COLORS.danger + "22", color: COLORS.danger, border: `1px solid ${COLORS.danger}44` },
  };
  return <button style={{ ...base, ...variants[variant] }} onClick={onClick} disabled={disabled}>{children}</button>;
}

function Input({ label, type = "text", value, onChange, placeholder }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
      {label && <label style={{ fontSize: 12, color: COLORS.muted, fontWeight: 500, letterSpacing: ".05em", textTransform: "uppercase" }}>{label}</label>}
      <input
        type={type} value={value} onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        style={{
          background: COLORS.surfaceAlt, border: `1px solid ${COLORS.border}`,
          borderRadius: 10, padding: "11px 14px", color: COLORS.text,
          fontFamily: "'DM Sans',sans-serif", fontSize: 14, outline: "none",
          transition: "border .18s",
        }}
        onFocus={e => e.target.style.borderColor = COLORS.accent}
        onBlur={e => e.target.style.borderColor = COLORS.border}
      />
    </div>
  );
}

// AUTH SCREEN 
function AuthScreen({ onLogin }) {
  const [mode, setMode] = useState("login");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [pass, setPass] = useState("");
  const [err, setErr] = useState("");

  function submit() {
    setErr("");
    if (!email || !pass) return setErr("Please fill all fields.");
    const users = getUsers();
    if (mode === "signup") {
      if (!name) return setErr("Name required.");
      if (users[email]) return setErr("Account already exists.");
      const user = { name, email, pass, streak: 1, maxStreak: 1, lastActive: today(), plans: 0, qSets: 0, summaries: 0, badges: [], featuresUsed: [], xp: 0 };
      users[email] = user;
      saveUsers(users);
      saveSession(email);
      onLogin(user);
    } else {
      const u = users[email];
      if (!u || u.pass !== pass) return setErr("Invalid credentials.");
      const updated = updateStreak(u);
      users[email] = updated;
      saveUsers(users);
      saveSession(email);
      onLogin(updated);
    }
  }

  return (
  <div
    style={{
      minHeight: "100vh",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      backgroundImage: `url(${carBg})`, // 👈 car image
      backgroundSize: "cover",
      backgroundPosition: "center",
      position: "relative",
      padding: 24,
    }}
  >
    {/* Dark overlay */}
    <div
      style={{
        position: "absolute",
        inset: 0,
        background: "rgba(0,0,0,0.6)"
      }}
    ></div>

    <style>{css}</style>

    {/* Main content */}
    <div style={{ position: "relative", zIndex: 1, width: "100%", maxWidth: 420, animation: "fadeUp .5s ease" }}>
      
      <div style={{ textAlign: "center", marginBottom: 40 }}>
        <div style={{ fontSize: 42, marginBottom: 8 }}>📚</div>
        <h1 style={{ fontFamily: "'Syne',sans-serif", fontSize: 32, fontWeight: 800, color: COLORS.text }}>
          Zuxter<span style={{ color: COLORS.accent }}>X</span>
        </h1>
        <p style={{ color: COLORS.muted, marginTop: 6, fontSize: 14 }}>
          Your AI-powered study companion
        </p>
      </div>

      <Card>
        <div style={{ display: "flex", gap: 8, marginBottom: 24 }}>
          {["login", "signup"].map(m => (
            <button key={m} onClick={() => { setMode(m); setErr(""); }}
              style={{
                flex: 1, padding: "9px 0", borderRadius: 8, border: "none", cursor: "pointer",
                fontFamily: "'DM Sans',sans-serif", fontWeight: 600, fontSize: 13,
                background: mode === m ? COLORS.accent : COLORS.surfaceAlt,
                color: mode === m ? "#000" : COLORS.muted, transition: "all .18s",
              }}>
              {m === "login" ? "Sign In" : "Sign Up"}
            </button>
          ))}
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {mode === "signup" && <Input label="Full Name" value={name} onChange={setName} placeholder="Ada Lovelace" />}
          <Input label="Email" type="email" value={email} onChange={setEmail} placeholder="you@example.com" />
          <Input label="Password" type="password" value={pass} onChange={setPass} placeholder="••••••••" />
          {err && <p style={{ color: COLORS.danger, fontSize: 13 }}>{err}</p>}
          <Btn onClick={submit} style={{ marginTop: 4, width: "100%", padding: "12px" }}>
            {mode === "login" ? "Sign In →" : "Create Account →"}
          </Btn>
        </div>
      </Card>
    </div>
  </div>
);
}

// SIDEBAR NAV
function Sidebar({ active, setActive, user, onLogout }) {
  const nav = [
    { id: "planner", icon: "🗓", label: "Study Planner" },
    { id: "questions", icon: "❓", label: "Questions" },
    { id: "summary", icon: "📝", label: "Summaries" },
    { id: "badges", icon: "🏅", label: "Badges" },
    { id: "leaderboard", icon: "🏆", label: "Leaderboard" },
  ];

  return (
   <div style={{
  width: "100%",
  maxWidth: 220,
  background: COLORS.surface,
  borderRight: `1px solid ${COLORS.border}`,
  display: "flex",
  flexDirection: "column",
  padding: "24px 14px",
  minHeight: "100vh",
  position: "sticky",
  top: 0,
}}>
      <div style={{ marginBottom: 28, paddingLeft: 8 }}>
        <h2 style={{ fontFamily: "'Syne',sans-serif", fontSize: 22, fontWeight: 800 }}>
          Zuxter<span style={{ color: COLORS.accent }}>X</span>
        </h2>
      </div>

      {/* User card */}
      <div style={{
        background: COLORS.surfaceAlt, borderRadius: 12, padding: "12px 14px",
        marginBottom: 24, border: `1px solid ${COLORS.border}`,
      }}>
        <div style={{ fontWeight: 600, fontSize: 14, color: COLORS.text }}>{user.name}</div>
        <div style={{ fontSize: 12, color: COLORS.muted, marginTop: 2 }}>{user.email}</div>
        <div style={{ marginTop: 10, display: "flex", alignItems: "center", gap: 6 }}>
          <span style={{ fontSize: 16 }}>🔥</span>
          <span style={{ fontSize: 13, color: COLORS.gold, fontWeight: 600 }}>{user.streak} day streak</span>
        </div>
        <div style={{ marginTop: 6, display: "flex", alignItems: "center", gap: 6 }}>
          <span style={{ fontSize: 14 }}>⭐</span>
          <span style={{ fontSize: 13, color: COLORS.blue, fontWeight: 600 }}>{user.xp || 0} XP</span>
        </div>
      </div>

      {/* Nav links */}
      <nav style={{ flex: 1, display: "flex", flexDirection: "column", gap: 4 }}>
        {nav.map(({ id, icon, label }) => (
          <button key={id} onClick={() => setActive(id)}
            style={{
              display: "flex", alignItems: "center", gap: 10,
              padding: "10px 12px", borderRadius: 10, border: "none",
              cursor: "pointer", textAlign: "left", transition: "all .15s",
              fontFamily: "'DM Sans',sans-serif", fontWeight: active === id ? 600 : 400,
              fontSize: 14,
              background: active === id ? COLORS.accentDim : "transparent",
              color: active === id ? COLORS.accent : COLORS.muted,
              borderLeft: active === id ? `2px solid ${COLORS.accent}` : "2px solid transparent",
            }}>
            <span style={{ fontSize: 16 }}>{icon}</span> {label}
          </button>
        ))}
      </nav>

      <Btn variant="danger" onClick={onLogout} style={{ marginTop: 16, width: "100%" }}>Sign Out</Btn>
    </div>
  );
}

//  SYLLABUS INPUT 
function SyllabusInput({ value, onChange }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
      <label style={{ fontSize: 12, color: COLORS.muted, fontWeight: 500, letterSpacing: ".05em", textTransform: "uppercase" }}>
        Syllabus / Topic Input
      </label>
      <textarea
        value={value} onChange={e => onChange(e.target.value)}
        placeholder="Paste your syllabus, topic list, or any subject content here…"
        rows={5}
        style={{
          background: COLORS.surfaceAlt, border: `1px solid ${COLORS.border}`,
          borderRadius: 12, padding: "14px 16px", color: COLORS.text,
          fontFamily: "'DM Sans',sans-serif", fontSize: 14, outline: "none",
          resize: "vertical", lineHeight: 1.6, transition: "border .18s",
        }}
        onFocus={e => e.target.style.borderColor = COLORS.accent}
        onBlur={e => e.target.style.borderColor = COLORS.border}
      />
    </div>
  );
}

// AI RESULT BLOCK 
function ResultBlock({ text, label, color = COLORS.accent }) {
  const [copied, setCopied] = useState(false);
  function copy() {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }
  return (
    <div style={{
      background: COLORS.surfaceAlt, border: `1px solid ${color}33`,
      borderRadius: 14, padding: "18px 20px", marginTop: 16,
      animation: "fadeUp .4s ease",
    }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
        <Tag color={color}>{label}</Tag>
        <button onClick={copy}
          style={{
            background: "transparent", border: `1px solid ${COLORS.border}`,
            borderRadius: 7, padding: "5px 12px", color: COLORS.muted,
            fontSize: 12, cursor: "pointer", fontFamily: "'DM Sans',sans-serif",
          }}>
          {copied ? "✓ Copied" : "Copy"}
        </button>
      </div>
      <pre style={{
        color: COLORS.text, fontSize: 13, lineHeight: 1.75,
        whiteSpace: "pre-wrap", wordBreak: "break-word", margin: 0,
        fontFamily: "'DM Sans',sans-serif",
      }}>{text}</pre>
    </div>
  );
}

// PLANNER PAGE
function PlannerPage({ user, onUpdate }) {
  const [syllabus, setSyllabus] = useState("");
  const [days, setDays] = useState("7");
  const [result, setResult] = useState("");
  const [loading, setLoading] = useState(false);

  async function generate() {
    if (!syllabus.trim()) return;
    setLoading(true); setResult("");
    try {
      const out = await callClaude(
        "You are an expert study planner. Create a detailed, day-by-day study schedule. Use clear formatting with Day labels, topics, time estimates, and revision tips. Be encouraging.",
        `Create a ${days}-day study plan for this syllabus:\n\n${syllabus}`
      );
      setResult(out);
      onUpdate("planner");
    } catch { setResult("Error generating plan. Please try again."); }
    setLoading(false);
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <div>
        <h2 style={{ fontFamily: "'Syne',sans-serif", fontSize: 24, fontWeight: 700 }}>Study Planner</h2>
        <p style={{ color: COLORS.muted, marginTop: 4, fontSize: 14 }}>Get a personalized day-by-day study schedule from your syllabus.</p>
      </div>
      <Card>
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <SyllabusInput value={syllabus} onChange={setSyllabus} />
          <Input label="Study Duration (days)" type="number" value={days} onChange={setDays} placeholder="7" />
          <Btn onClick={generate} disabled={loading || !syllabus.trim()}>
            {loading ? "Generating…" : "✨ Generate Study Plan"}
          </Btn>
          {loading && <Spinner />}
        </div>
      </Card>
      {result && <ResultBlock text={result} label="Study Plan" color={COLORS.accent} />}
    </div>
  );
}

//QUESTIONS PAGE
function QuestionsPage({ user, onUpdate }) {
  const [syllabus, setSyllabus] = useState("");
  const [level, setLevel] = useState("mixed");
  const [result, setResult] = useState("");
  const [loading, setLoading] = useState(false);

  async function generate() {
    if (!syllabus.trim()) return;
    setLoading(true); setResult("");
    try {
      const out = await callClaude(
        "You are an expert educator. Generate important exam-style questions. Number them clearly. Include short-answer, analytical, and conceptual questions. Group by topic if possible.",
        `Generate ${level === "easy" ? "beginner" : level === "hard" ? "advanced" : "mixed-level"} important questions for:\n\n${syllabus}`
      );
      setResult(out);
      onUpdate("questions");
    } catch { setResult("Error generating questions. Please try again."); }
    setLoading(false);
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <div>
        <h2 style={{ fontFamily: "'Syne',sans-serif", fontSize: 24, fontWeight: 700 }}>Important Questions</h2>
        <p style={{ color: COLORS.muted, marginTop: 4, fontSize: 14 }}>AI-generated exam-ready questions from your syllabus.</p>
      </div>
      <Card>
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <SyllabusInput value={syllabus} onChange={setSyllabus} />
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <label style={{ fontSize: 12, color: COLORS.muted, fontWeight: 500, letterSpacing: ".05em", textTransform: "uppercase" }}>Difficulty Level</label>
            <div style={{ display: "flex", gap: 8 }}>
              {["easy", "mixed", "hard"].map(l => (
                <button key={l} onClick={() => setLevel(l)}
                  style={{
                    flex: 1, padding: "9px 0", borderRadius: 8,
                    border: `1px solid ${level === l ? COLORS.blue : COLORS.border}`,
                    background: level === l ? COLORS.blue + "22" : "transparent",
                    color: level === l ? COLORS.blue : COLORS.muted,
                    cursor: "pointer", fontFamily: "'DM Sans',sans-serif",
                    fontWeight: 600, fontSize: 13, textTransform: "capitalize", transition: "all .18s",
                  }}>{l}</button>
              ))}
            </div>
          </div>
          <Btn onClick={generate} disabled={loading || !syllabus.trim()} style={{ background: COLORS.blue, color: "#000" }}>
            {loading ? "Generating…" : "🧠 Generate Questions"}
          </Btn>
          {loading && <Spinner />}
        </div>
      </Card>
      {result && <ResultBlock text={result} label="Questions" color={COLORS.blue} />}
    </div>
  );
}

//SUMMARIES PAGE
function SummaryPage({ user, onUpdate }) {
  const [syllabus, setSyllabus] = useState("");
  const [style, setStyle] = useState("concise");
  const [result, setResult] = useState("");
  const [loading, setLoading] = useState(false);

  async function generate() {
    if (!syllabus.trim()) return;
    setLoading(true); setResult("");
    try {
      const out = await callClaude(
        "You are a brilliant academic summarizer. Create clear, well-structured summaries. Use bullet points, key terms in caps, and organize by topic. Make it easy to revise from.",
        `Create a ${style} summary of this content:\n\n${syllabus}`
      );
      setResult(out);
      onUpdate("summary");
    } catch { setResult("Error generating summary. Please try again."); }
    setLoading(false);
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <div>
        <h2 style={{ fontFamily: "'Syne',sans-serif", fontSize: 24, fontWeight: 700 }}>AI Summaries</h2>
        <p style={{ color: COLORS.muted, marginTop: 4, fontSize: 14 }}>Condensed, revision-ready summaries from any content.</p>
      </div>
      <Card>
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <SyllabusInput value={syllabus} onChange={setSyllabus} />
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <label style={{ fontSize: 12, color: COLORS.muted, fontWeight: 500, letterSpacing: ".05em", textTransform: "uppercase" }}>Summary Style</label>
            <div style={{ display: "flex", gap: 8 }}>
              {["concise", "detailed", "bullet points"].map(s => (
                <button key={s} onClick={() => setStyle(s)}
                  style={{
                    flex: 1, padding: "9px 0", borderRadius: 8,
                    border: `1px solid ${style === s ? COLORS.gold : COLORS.border}`,
                    background: style === s ? COLORS.gold + "22" : "transparent",
                    color: style === s ? COLORS.gold : COLORS.muted,
                    cursor: "pointer", fontFamily: "'DM Sans',sans-serif",
                    fontWeight: 600, fontSize: 12, textTransform: "capitalize", transition: "all .18s",
                  }}>{s}</button>
              ))}
            </div>
          </div>
          <Btn onClick={generate} disabled={loading || !syllabus.trim()} style={{ background: COLORS.gold, color: "#000" }}>
            {loading ? "Generating…" : "📝 Generate Summary"}
          </Btn>
          {loading && <Spinner />}
        </div>
      </Card>
      {result && <ResultBlock text={result} label="Summary" color={COLORS.gold} />}
    </div>
  );
}

// BADGES PAGE 
function BadgesPage({ user }) {
  const earned = new Set(user.badges || []);
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <div>
        <h2 style={{ fontFamily: "'Syne',sans-serif", fontSize: 24, fontWeight: 700 }}>Achievements</h2>
        <p style={{ color: COLORS.muted, marginTop: 4, fontSize: 14 }}>Earn badges by using ZuxterX consistently.</p>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(180px,1fr))", gap: 14 }}>
        {ALL_BADGES.map(b => {
          const has = earned.has(b.id);
          return (
            <Card key={b.id} style={{
              textAlign: "center", padding: "24px 16px",
              border: `1px solid ${has ? COLORS.gold + "55" : COLORS.border}`,
              background: has ? COLORS.gold + "0a" : COLORS.surface,
              animation: has ? "badgePop .5s ease both" : "fadeUp .4s ease",
              opacity: has ? 1 : .45, filter: has ? "none" : "grayscale(1)",
            }}>
              <div style={{ fontSize: 36, marginBottom: 10 }}>{b.icon}</div>
              <div style={{ fontFamily: "'Syne',sans-serif", fontWeight: 700, fontSize: 14, color: has ? COLORS.gold : COLORS.muted }}>{b.label}</div>
              <div style={{ fontSize: 12, color: COLORS.muted, marginTop: 6, lineHeight: 1.5 }}>{b.desc}</div>
              {has && <Tag color={COLORS.gold} style={{ marginTop: 10, display: "inline-block" }}>Earned</Tag>}
            </Card>
          );
        })}
      </div>
      <Card style={{ padding: "16px 20px" }}>
        <div style={{ display: "flex", gap: 32 }}>
          {[
            { label: "Plans Generated", val: user.plans || 0, icon: "🗓" },
            { label: "Question Sets", val: user.qSets || 0, icon: "❓" },
            { label: "Summaries", val: user.summaries || 0, icon: "📝" },
            { label: "Max Streak", val: user.maxStreak || 0, icon: "🔥" },
            { label: "Total XP", val: user.xp || 0, icon: "⭐" },
          ].map(s => (
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

// LEADERBOARD PAGE 
function LeaderboardPage({ currentUser }) {
  const users = getUsers();
  const sorted = Object.values(users)
    .sort((a, b) => (b.xp || 0) - (a.xp || 0))
    .slice(0, 10);

  const medals = ["🥇", "🥈", "🥉"];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <div>
        <h2 style={{ fontFamily: "'Syne',sans-serif", fontSize: 24, fontWeight: 700 }}>Leaderboard</h2>
        <p style={{ color: COLORS.muted, marginTop: 4, fontSize: 14 }}>Top students ranked by XP earned.</p>
      </div>
      <Card>
        {sorted.length === 0 ? (
          <p style={{ color: COLORS.muted, textAlign: "center", padding: "24px 0" }}>No users yet. Be the first!</p>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
            {sorted.map((u, i) => {
              const isMe = u.email === currentUser.email;
              return (
                <div key={u.email} style={{
                  display: "flex", alignItems: "center", gap: 16,
                  padding: "14px 12px", borderRadius: 10,
                  background: isMe ? COLORS.accent + "12" : "transparent",
                  borderBottom: i < sorted.length - 1 ? `1px solid ${COLORS.border}` : "none",
                  transition: "background .2s",
                }}>
                  <span style={{ fontSize: 20, width: 28, textAlign: "center" }}>
                    {medals[i] || `#${i + 1}`}
                  </span>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 600, fontSize: 14, color: isMe ? COLORS.accent : COLORS.text }}>
                      {u.name} {isMe && <Tag color={COLORS.accent}>You</Tag>}
                    </div>
                    <div style={{ fontSize: 12, color: COLORS.muted, marginTop: 2 }}>
                      🔥 {u.streak || 0} streak · 🏅 {(u.badges || []).length} badges
                    </div>
                  </div>
                  <div style={{ fontFamily: "'Syne',sans-serif", fontWeight: 800, fontSize: 18, color: COLORS.gold }}>
                    {u.xp || 0} <span style={{ fontSize: 11, fontWeight: 400, color: COLORS.muted }}>XP</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </Card>
    </div>
  );
}


// ROOT APP

export default function App() {
  const [user, setUser] = useState(null);
  const [active, setActive] = useState("planner");
  const [newBadge, setNewBadge] = useState(null);

  useEffect(() => {
    const email = getSession();
    if (email) {
      const users = getUsers();
      if (users[email]) {
        const updated = updateStreak(users[email]);
        users[email] = updated;
        saveUsers(users);
        setUser(updated);
      }
    }
  }, []);

  function handleLogin(u) { setUser(u); }

  function handleLogout() { clearSession(); setUser(null); setActive("planner"); }

  function handleUpdate(feature) {
    const users = getUsers();
    const u = { ...users[user.email] };
    if (feature === "planner") { u.plans = (u.plans || 0) + 1; u.xp = (u.xp || 0) + 20; }
    if (feature === "questions") { u.qSets = (u.qSets || 0) + 1; u.xp = (u.xp || 0) + 15; }
    if (feature === "summary") { u.summaries = (u.summaries || 0) + 1; u.xp = (u.xp || 0) + 15; }
    const used = new Set(u.featuresUsed || []);
    used.add(feature);
    u.featuresUsed = [...used];
    const prevBadges = new Set(u.badges || []);
    u.badges = checkBadges(u);
    const freshBadge = u.badges.find(b => !prevBadges.has(b));
    users[user.email] = u;
    saveUsers(users);
    setUser(u);
    if (freshBadge) {
      const badge = ALL_BADGES.find(b => b.id === freshBadge);
      setNewBadge(badge);
      setTimeout(() => setNewBadge(null), 3000);
    }
  }

  if (!user) return <AuthScreen onLogin={handleLogin} />;

  const pages = { planner: PlannerPage, questions: QuestionsPage, summary: SummaryPage, badges: BadgesPage, leaderboard: LeaderboardPage };
  const Page = pages[active];

  return (
   <div className="main-container">

      <style>{css}</style>

      <Sidebar active={active} setActive={setActive} user={user} onLogout={handleLogout} />

      <main style={{ flex: 1, padding: "20px", maxWidth: "100%", overflowY: "auto" }}>
        <Page user={user} onUpdate={handleUpdate} currentUser={user} />
      </main>

      {/* Badge toast */}
      {newBadge && (
        <div style={{
          position: "fixed", bottom: 28, right: 28,
          background: COLORS.surface, border: `1px solid ${COLORS.gold}55`,
          borderRadius: 16, padding: "16px 22px",
          boxShadow: `0 8px 32px ${COLORS.gold}22`,
          animation: "badgePop .5s ease",
          display: "flex", alignItems: "center", gap: 14, zIndex: 999,
        }}>
          <span style={{ fontSize: 36 }}>{newBadge.icon}</span>
          <div>
            <div style={{ fontSize: 11, color: COLORS.gold, fontWeight: 700, letterSpacing: ".08em", textTransform: "uppercase" }}>Badge Unlocked!</div>
            <div style={{ fontFamily: "'Syne',sans-serif", fontWeight: 700, fontSize: 16, marginTop: 2 }}>{newBadge.label}</div>
            <div style={{ fontSize: 12, color: COLORS.muted, marginTop: 3 }}>{newBadge.desc}</div>
          </div>
        </div>
      )}
    </div>
  );
}