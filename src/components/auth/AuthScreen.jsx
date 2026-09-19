import React, { useState } from "react";
import { COLORS, BASE_URL } from "../../config/constants";
import { BtnSpinner } from "../common/Spinner";

async function fetchWithTimeout(url, options = {}) {
  const { timeout = 15000 } = options;
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeout);
  try {
    const response = await fetch(url, { ...options, signal: controller.signal });
    clearTimeout(id);
    return response;
  } catch (error) {
    clearTimeout(id);
    throw error;
  }
}

export function SyllabusInput({ value, onChange }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
      <label style={{ fontSize: 12, color: COLORS.muted, fontWeight: 500, letterSpacing: ".05em", textTransform: "uppercase" }}>Syllabus / Topic</label>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Paste your syllabus or topic here…"
        rows={5}
        style={{ background: COLORS.surfaceAlt, border: `1px solid ${COLORS.border}`, borderRadius: 10, padding: "11px 14px", color: COLORS.text, fontFamily: "'DM Sans',sans-serif", fontSize: 14, outline: "none", resize: "vertical", transition: "border .18s" }}
        onFocus={(e) => (e.target.style.borderColor = COLORS.accent)}
        onBlur={(e) => (e.target.style.borderColor = COLORS.border)}
      />
    </div>
  );
}

export function AuthScreen({ onLogin, onAdminLogin }) {
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
  const [showPass, setShowPass] = useState(false);
  // support form state
  const [suppName, setSuppName] = useState("");
  const [suppEmail, setSuppEmail] = useState("");
  const [suppSubject, setSuppSubject] = useState("");
  const [suppMsg, setSuppMsg] = useState("");
  const [suppSent, setSuppSent] = useState(false);

  function switchMode(m) {
    setMode(m);
    setErr("");
    setInfo("");
    setSignupStep("form");
    setOtp("");
    setShowPass(false);
    setSuppSent(false);
  }

  async function doLogin() {
    setErr("");
    setInfo("");
    if (!email || !pass) {
      setErr("Please fill all fields.");
      return;
    }
    setLoading(true);
    try {
      const res = await fetchWithTimeout(`${BASE_URL}/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password: pass }),
      });
      const data = await res.json();
      if (!res.ok) {
        setErr(data.msg || "Error");
        setLoading(false);
        return;
      }
      window._authToken = data.token;
      localStorage.setItem("zx_token", data.token);
      onLogin(data);
    } catch (error) {
      setErr(error.name === "AbortError" ? "Server is waking up, please try again…" : "Server error");
    }
    setLoading(false);
  }

  async function doSendOtp() {
    setErr("");
    setInfo("");
    if (!name || !email || !pass) {
      setErr("Please fill all fields.");
      return;
    }
    if (pass.length < 8) {
      setErr("Password must be at least 8 characters.");
      return;
    }
    if (!/[A-Z]/.test(pass)) {
      setErr("Password must include an uppercase letter.");
      return;
    }
    if (!/[a-z]/.test(pass)) {
      setErr("Password must include a lowercase letter.");
      return;
    }
    if (!/[0-9]/.test(pass)) {
      setErr("Password must include a number.");
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setErr("Please enter a valid email address.");
      return;
    }
    setLoading(true);
    try {
      const res = await fetchWithTimeout(`${BASE_URL}/send-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email }),
      });
      const data = await res.json();
      if (!res.ok) {
        setErr(data.msg || "Error");
        setLoading(false);
        return;
      }
      setInfo(`OTP sent to ${email}`);
      setSignupStep("otp");
    } catch (error) {
      setErr(error.name === "AbortError" ? "Server is waking up, please try again…" : "Server error");
    }
    setLoading(false);
  }

  async function doVerifyOtp() {
    setErr("");
    setInfo("");
    if (!otp) {
      setErr("Please enter the OTP.");
      return;
    }
    setLoading(true);
    try {
      const res = await fetchWithTimeout(`${BASE_URL}/verify-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password: pass, otp }),
      });
      const data = await res.json();
      if (!res.ok) {
        setErr(data.msg || "Error");
        setLoading(false);
        return;
      }
      setInfo("Account created! Please sign in.");
      switchMode("login");
    } catch (error) {
      setErr(error.name === "AbortError" ? "Server is waking up, please try again…" : "Server error");
    }
    setLoading(false);
  }

  async function doAdminLogin() {
    setErr("");
    setInfo("");
    if (!email || !pass) {
      setErr("Please fill all fields.");
      return;
    }
    setLoading(true);
    try {
      const res = await fetchWithTimeout(`${BASE_URL}/admin/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password: pass }),
      });
      const data = await res.json();
      if (!res.ok) {
        setErr(data.msg || "Not authorized");
        setLoading(false);
        return;
      }
      window._adminToken = data.adminToken;
      localStorage.setItem("zx_admin_token", data.adminToken);
      onAdminLogin({ email: data.email });
    } catch (error) {
      setErr(error.name === "AbortError" ? "Server is waking up, please try again…" : "Server error");
    }
    setLoading(false);
  }

  async function doSendForgotOtp() {
    setErr("");
    setInfo("");
    if (!email) {
      setErr("Please enter your email.");
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setErr("Please enter a valid email address.");
      return;
    }
    setLoading(true);
    try {
      const res = await fetchWithTimeout(`${BASE_URL}/forgot-password-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (!res.ok) {
        setErr(data.msg || "Error");
        setLoading(false);
        return;
      }
      setInfo(data.msg || `OTP sent to ${email}`);
      setSignupStep("otp");
    } catch (error) {
      setErr(error.name === "AbortError" ? "Server is waking up, please try again…" : "Server error");
    }
    setLoading(false);
  }

  async function doResetPassword() {
    setErr("");
    setInfo("");
    if (!otp || !pass) {
      setErr("Please enter the OTP and new password.");
      return;
    }
    if (pass.length < 8) {
      setErr("Password must be at least 8 characters.");
      return;
    }
    if (!/[A-Z]/.test(pass)) {
      setErr("Password must include an uppercase letter.");
      return;
    }
    if (!/[a-z]/.test(pass)) {
      setErr("Password must include a lowercase letter.");
      return;
    }
    if (!/[0-9]/.test(pass)) {
      setErr("Password must include a number.");
      return;
    }
    setLoading(true);
    try {
      const res = await fetchWithTimeout(`${BASE_URL}/reset-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, otp, password: pass }),
      });
      const data = await res.json();
      if (!res.ok) {
        setErr(data.msg || "Error");
        setLoading(false);
        return;
      }
      setInfo(data.msg || "Password reset successfully!");
      switchMode("login");
    } catch (error) {
      setErr(error.name === "AbortError" ? "Server is waking up, please try again…" : "Server error");
    }
    setLoading(false);
  }

  async function doSupportTicket() {
    setErr("");
    setInfo("");
    if (!suppName.trim()) {
      setErr("Name is required.");
      return;
    }
    if (!suppEmail.trim()) {
      setErr("Email is required.");
      return;
    }
    const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRe.test(suppEmail.trim())) {
      setErr("Please enter a valid email address.");
      return;
    }
    if (!suppSubject.trim()) {
      setErr("Subject is required.");
      return;
    }
    if (!suppMsg.trim()) {
      setErr("Please describe your issue.");
      return;
    }
    setLoading(true);
    try {
      const res = await fetchWithTimeout(`${BASE_URL}/support/guest-ticket`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: suppName, email: suppEmail, subject: suppSubject, message: suppMsg }),
      });
      const data = await res.json();
      if (!res.ok) {
        setErr(data.msg || "Error");
        setLoading(false);
        return;
      }
      setSuppSent(true);
    } catch (error) {
      setErr(error.name === "AbortError" ? "Server is waking up, please try again…" : "Server error");
    }
    setLoading(false);
  }

  function submit() {
    if (mode === "admin") {
      doAdminLogin();
      return;
    }
    if (mode === "login") {
      doLogin();
      return;
    }
    if (mode === "support") {
      doSupportTicket();
      return;
    }
    if (mode === "forgot") {
      if (signupStep === "form") {
        doSendForgotOtp();
        return;
      }
      doResetPassword();
      return;
    }
    if (signupStep === "form") {
      doSendOtp();
      return;
    }
    doVerifyOtp();
  }

  const accentColor = mode === "admin" ? COLORS.admin : COLORS.accent;

  if (!showForm) {
    return (
      <button
        onClick={() => setShowForm(true)}
        style={{
          position: "fixed",
          top: 32,
          right: 32,
          zIndex: 100,
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
          transition: "all 0.3s ease",
        }}
        onMouseOver={(e) => {
          e.currentTarget.style.transform = "scale(1.05)";
          e.currentTarget.style.filter = "brightness(1.2)";
        }}
        onMouseOut={(e) => {
          e.currentTarget.style.transform = "scale(1)";
          e.currentTarget.style.filter = "brightness(1)";
        }}
      >
        Sign In ➤
      </button>
    );
  }

  if (mode === "privacy" || mode === "terms") {
    return (
      <div className="bg-black/60 backdrop-blur-md text-white font-sans tracking-wide" style={{ position: "fixed", inset: 0, zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <button onClick={() => setShowForm(false)} className="absolute top-6 right-8 bg-transparent border-none text-gray-400 cursor-pointer text-3xl z-50 transition-all hover:text-white hover:scale-110">✕</button>
        <main className="relative z-10 w-full max-w-lg px-6 py-8 mx-auto">
          <div className="bg-[#0a0a0a] border border-white/10 rounded-[20px] p-8 shadow-2xl overflow-hidden relative animate-[slideIn_0.5s_ease-out]">
            <div className="text-center mb-6">
              <h1 className="text-[24px] font-semibold text-white tracking-tight">{mode === "privacy" ? "🔒 Privacy Policy" : "📜 Terms of Service"}</h1>
              <p className="text-gray-400 mt-2 text-sm">Last updated: April 2026</p>
            </div>
            <div style={{ maxHeight: "55vh", overflowY: "auto", paddingRight: 8, fontSize: 13, lineHeight: 1.75, color: "#aab0bc" }}>
              {mode === "privacy" ? (
                <div>
                  <h3 style={{ color: "#fff", fontSize: 15, marginBottom: 8 }}>1. Information We Collect</h3>
                  <p>We collect information you provide when creating an account: your name, email address, and encrypted password. We also collect usage data such as study activity, XP earned, streaks, and content you post on ZuxterConnect.</p>
                  <h3 style={{ color: "#fff", fontSize: 15, marginTop: 20, marginBottom: 8 }}>2. How We Use Your Information</h3>
                  <p>Your information is used to provide and improve our services, including personalized study plans, AI-generated content, leaderboard rankings, social features, and account security (OTP verification).</p>
                  <h3 style={{ color: "#fff", fontSize: 15, marginTop: 20, marginBottom: 8 }}>3. Data Storage & Security</h3>
                  <p>Your data is stored securely in encrypted MongoDB Atlas clusters. Passwords are hashed using industry-standard algorithms. JWT tokens manage sessions with automatic expiry. We implement rate limiting, OTP verification with attempt limits, and strong password requirements to protect your account.</p>
                  <h3 style={{ color: "#fff", fontSize: 15, marginTop: 20, marginBottom: 8 }}>4. Third-Party Services</h3>
                  <p>We use the following third-party services:</p>
                  <ul style={{ paddingLeft: 20, marginTop: 6 }}>
                    <li><strong style={{ color: "#fff" }}>Google Gemini API</strong> — AI-powered study features.</li>
                    <li><strong style={{ color: "#fff" }}>Brevo</strong> — Transactional emails (OTP, password resets).</li>
                    <li><strong style={{ color: "#fff" }}>Vercel</strong> — Frontend hosting.</li>
                    <li><strong style={{ color: "#fff" }}>Render</strong> — Backend hosting.</li>
                  </ul>
                  <h3 style={{ color: "#fff", fontSize: 15, marginTop: 20, marginBottom: 8 }}>5. Data Sharing</h3>
                  <p>We do not sell your personal data. Information is shared only with the third-party services listed above, solely for providing our services. Your profile name and avatar are visible to other platform users.</p>
                  <h3 style={{ color: "#fff", fontSize: 15, marginTop: 20, marginBottom: 8 }}>6. Your Rights</h3>
                  <p>You can access, update, or request deletion of your personal data at any time. Update your profile and password from settings. To delete your account, contact support. Control messaging privacy via your profile settings.</p>
                  <h3 style={{ color: "#fff", fontSize: 15, marginTop: 20, marginBottom: 8 }}>7. Cookies & Storage</h3>
                  <p>We use session tokens stored in browser memory for authentication. We do not use tracking cookies or localStorage for sensitive data.</p>
                  <h3 style={{ color: "#fff", fontSize: 15, marginTop: 20, marginBottom: 8 }}>8. Children&apos;s Privacy</h3>
                  <p>ZuxterX is designed for students. We do not knowingly collect data from children under 13 without parental consent.</p>
                  <h3 style={{ color: "#fff", fontSize: 15, marginTop: 20, marginBottom: 8 }}>9. Changes to This Policy</h3>
                  <p>We may update this policy periodically. Continued use of ZuxterX constitutes acceptance of the updated policy.</p>
                  <h3 style={{ color: "#fff", fontSize: 15, marginTop: 20, marginBottom: 8 }}>10. Contact</h3>
                  <p>For privacy questions, use the in-app support system or email <strong style={{ color: "#fff" }}>vedvishwakarma9120@gmail.com</strong>.</p>
                </div>
              ) : (
                <div>
                  <h3 style={{ color: "#fff", fontSize: 15, marginBottom: 8 }}>1. Acceptance of Terms</h3>
                  <p>By creating an account or using ZuxterX, you agree to these Terms. If you do not agree, do not use the platform.</p>
                  <h3 style={{ color: "#fff", fontSize: 15, marginTop: 20, marginBottom: 8 }}>2. Account Responsibilities</h3>
                  <p>You are responsible for your account security. Provide accurate information during registration. Do not share accounts or create duplicates. Use a strong password (8+ characters with uppercase, lowercase, and numbers).</p>
                  <h3 style={{ color: "#fff", fontSize: 15, marginTop: 20, marginBottom: 8 }}>3. Acceptable Use</h3>
                  <p>You agree not to:</p>
                  <ul style={{ paddingLeft: 20, marginTop: 6 }}>
                    <li>Post offensive, harmful, or illegal content.</li>
                    <li>Harass or send unsolicited messages to users.</li>
                    <li>Attempt to exploit, hack, or disrupt the platform.</li>
                    <li>Use bots or scrapers to access the service.</li>
                    <li>Impersonate others or create misleading profiles.</li>
                    <li>Upload malicious files or oversized images.</li>
                  </ul>
                  <h3 style={{ color: "#fff", fontSize: 15, marginTop: 20, marginBottom: 8 }}>4. Content & Intellectual Property</h3>
                  <p>You retain ownership of content you post. By posting on ZuxterConnect, you grant ZuxterX a non-exclusive license to display it. AI-generated content is provided as-is and should be verified independently.</p>
                  <h3 style={{ color: "#fff", fontSize: 15, marginTop: 20, marginBottom: 8 }}>5. Suspension & Termination</h3>
                  <p>We may suspend or ban accounts that violate these terms. Admins may delete content that violates community guidelines.</p>
                  <h3 style={{ color: "#fff", fontSize: 15, marginTop: 20, marginBottom: 8 }}>6. Service Availability</h3>
                  <p>ZuxterX is provided &quot;as-is&quot; without warranty. We do not guarantee uninterrupted access. The service may be modified or discontinued at any time.</p>
                  <h3 style={{ color: "#fff", fontSize: 15, marginTop: 20, marginBottom: 8 }}>7. Limitation of Liability</h3>
                  <p>ZuxterX and its creators are not liable for damages arising from platform use, including academic outcomes, data loss, or service interruptions.</p>
                  <h3 style={{ color: "#fff", fontSize: 15, marginTop: 20, marginBottom: 8 }}>8. Privacy</h3>
                  <p>Your use is also governed by our <button type="button" onClick={() => switchMode("privacy")} style={{ background: "none", border: "none", color: "#fff", textDecoration: "underline", cursor: "pointer", padding: 0, font: "inherit" }}>Privacy Policy</button>.</p>
                  <h3 style={{ color: "#fff", fontSize: 15, marginTop: 20, marginBottom: 8 }}>9. Changes to Terms</h3>
                  <p>We may modify these terms at any time. Continued use constitutes acceptance.</p>
                  <p>If user get banned for thier unaccepted behavior then the user will not be able to access the platform.again we delete all the data of user instantly</p>
                  <h3 style={{ color: "#fff", fontSize: 15, marginTop: 20, marginBottom: 8 }}>10. Contact</h3>
                  <p>For questions, use in-app support or email <strong style={{ color: "#fff" }}>vedvishwakarma9120@gmail.com</strong>.</p>
                </div>
              )}
            </div>
            <div style={{ textAlign: "center", marginTop: 20 }}>
              <button type="button" onClick={() => switchMode("login")} className="text-sm text-gray-400 hover:text-white transition-colors hover:underline bg-transparent border-none cursor-pointer font-semibold">← Back to Sign In</button>
            </div>
          </div>
        </main>
        <style dangerouslySetInnerHTML={{ __html: `@keyframes slideIn { from { transform: translateY(24px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }` }} />
      </div>
    );
  }

  return (
    <div className="bg-black/60 backdrop-blur-md text-white selection:bg-white/30 selection:text-white font-sans tracking-wide" style={{ position: "fixed", inset: 0, zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center" }}>
      <button onClick={() => setShowForm(false)} className="absolute top-6 right-8 bg-transparent border-none text-gray-400 cursor-pointer text-3xl z-50 transition-all hover:text-white hover:scale-110">✕</button>
      <main className="relative z-10 w-full max-w-md px-6 py-12 mx-auto mt-6 animate-[slideIn_0.5s_ease-out]">
        <div className="bg-[#0a0a0a] border border-white/10 rounded-[20px] p-8 md:p-10 shadow-2xl overflow-hidden relative">
          <div className="text-center mb-8">
            <h1 className="text-[28px] font-semibold text-white tracking-tight leading-tight">
              {mode === "admin" ? "Admin Access" : mode === "signup" ? "Create Account" : mode === "forgot" ? "Reset Password" : mode === "support" ? "Get Support" : "Welcome back"}
            </h1>
            <p className="text-gray-400 mt-2 font-medium">
              {mode === "admin" ? "Enter admin credentials" : mode === "signup" ? "Join ZuxterX today" : mode === "forgot" ? "We'll send you an OTP" : mode === "support" ? "Tell us what went wrong" : "Sign in to continue"}
            </p>
          </div>

          <div className="flex gap-2 mb-6 bg-white/5 rounded-xl p-1.5 border border-white/10">
            {["login", "signup", "admin"].map((m) => (
              <button key={m} onClick={() => switchMode(m)} className={`flex-1 py-2 rounded-lg text-sm font-bold tracking-wide transition-all border outline-none cursor-pointer ${mode === m ? "bg-white text-black border-white shadow-sm" : "bg-transparent text-gray-400 border-transparent hover:text-white"}`}>
                {m === "login" ? "Sign In" : m === "signup" ? "Sign Up" : "Admin"}
              </button>
            ))}
          </div>

          {mode !== "support" && (
            <div style={{ textAlign: "center", marginBottom: 2 }}>
              <button type="button" onClick={() => switchMode("support")} className="text-xs text-gray-500 hover:text-white transition-colors hover:underline bg-transparent border-none cursor-pointer font-semibold">
                🆘 Can't sign in? Get help
              </button>
            </div>
          )}

          {(mode === "signup" || mode === "forgot") && (
            <div className="flex items-center gap-2 mb-5">
              {["Details", "Verify OTP"].map((step, i) => {
                const cur = signupStep === "form" ? 1 : 2;
                const active = i + 1 === cur;
                const done = i + 1 < cur;
                return (
                  <div key={step} className={`flex items-center gap-2 ${i < 1 ? "flex-1" : ""}`}>
                    <div className="flex items-center gap-1.5">
                      <div className={`w-5 h-5 rounded-full text-[10px] font-bold flex items-center justify-center border-2 ${done ? "bg-white border-white text-black" : active ? "bg-white/10 border-white text-white" : "bg-transparent border-white/20 text-gray-500"}`}>
                        {done ? "✓" : i + 1}
                      </div>
                      <span className={`text-xs ${active ? "text-white font-semibold" : "text-gray-500"}`}>{step}</span>
                    </div>
                    {i < 1 && <div className={`flex-1 h-px mx-1 ${done ? "bg-white/40" : "bg-white/10"}`} />}
                  </div>
                );
              })}
            </div>
          )}

          <form className="space-y-4" onSubmit={(e) => { e.preventDefault(); submit(); }}>
            {mode === "signup" && signupStep === "form" && (
              <div className="space-y-1.5 text-left">
                <label className="text-xs uppercase tracking-[0.05em] font-semibold text-gray-400 ml-1">Full Name</label>
                <div className="relative group">
                  <input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full h-[52px] px-4 bg-[#111] border border-white/20 rounded-xl focus:border-white focus:ring-[2px] focus:ring-white/30 focus:outline-none transition-all duration-300 text-white placeholder-gray-500"
                    placeholder="Enter Your Name"
                  />
                </div>
              </div>
            )}

            {(mode === "login" || mode === "admin" || (mode === "signup" && signupStep === "form") || (mode === "forgot" && signupStep === "form")) && (
              <div className="space-y-1.5 text-left">
                <label className="text-xs uppercase tracking-[0.05em] font-semibold text-gray-400 ml-1">Email Address</label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
                    <svg className="w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <input
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full h-[52px] pl-12 pr-4 bg-[#111] border border-white/20 rounded-xl focus:border-white focus:ring-[2px] focus:ring-white/30 focus:outline-none transition-all duration-300 text-white placeholder-gray-500"
                    placeholder="name@company.com"
                    type="email"
                  />
                </div>
              </div>
            )}

            {(mode === "login" || mode === "admin" || (mode === "signup" && signupStep === "form") || (mode === "forgot" && signupStep === "otp")) && (
              <div className="space-y-1.5 text-left">
                <div className="flex justify-between items-center px-1">
                  <label className="text-xs uppercase tracking-[0.05em] font-semibold text-gray-400">Password</label>
                  {mode === "login" && (
                    <button type="button" onClick={() => switchMode("forgot")} className="text-xs font-semibold text-gray-400 hover:text-white transition-colors hover:underline bg-transparent border-none cursor-pointer">Forgot?</button>
                  )}
                </div>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
                    <svg className="w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                  </div>
                  <input
                    value={pass}
                    onChange={(e) => setPass(e.target.value)}
                    className="w-full h-[52px] pl-12 pr-12 bg-[#111] border border-white/20 rounded-xl focus:border-white focus:ring-[2px] focus:ring-white/30 focus:outline-none transition-all duration-300 text-white placeholder-gray-500"
                    placeholder={mode === "forgot" ? "New Password" : "••••••••"}
                    type={showPass ? "text" : "password"}
                  />
                  <span
                    className="absolute text-gray-500 hover:text-white cursor-pointer select-none flex items-center justify-center transition-colors"
                    style={{ right: "16px", top: "50%", transform: "translateY(-50%)", width: "32px", height: "32px", padding: 0, margin: 0, zIndex: 10 }}
                    onClick={() => setShowPass(!showPass)}
                    title="Toggle Password Visibility"
                  >
                    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                      {showPass ? (
                        <path d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z" />
                      ) : (
                        <path d="M12 7c2.76 0 5 2.24 5 5 0 .65-.13 1.26-.36 1.83l2.92 2.92c1.51-1.26 2.7-2.89 3.43-4.75-1.73-4.39-6-7.5-11-7.5-1.4 0-2.74.25-3.98.7l2.16 2.16C10.74 7.13 11.35 7 12 7zM2 4.27l2.28 2.28.46.46C3.08 8.3 1.78 10.02 1 12c1.73 4.39 6 7.5 11 7.5 1.55 0 3.03-.3 4.38-.84l.42.42L19.73 22 21 20.73 3.27 3 2 4.27zM7.53 9.8l1.55 1.55c-.05.21-.08.43-.08.65 0 1.66 1.34 3 3 3 .22 0 .44-.03.65-.08l1.55 1.55c-.67.33-1.41.53-2.2.53-2.76 0-5-2.24-5-5 0-.79.2-1.53.53-2.2zm4.31-.78l3.15 3.15.02-.16c0-1.66-1.34-3-3-3l-.17.01z" />
                      )}
                    </svg>
                  </span>
                </div>
              </div>
            )}

            {(mode === "signup" || mode === "forgot") && signupStep === "otp" && (
              <div className="space-y-1.5 mt-2">
                <p className="text-xs text-gray-500">Enter the 6-digit code sent to <span className="text-white font-semibold">{email}</span></p>
                <input value={otp} onChange={(e) => setOtp(e.target.value)} placeholder="000000" maxLength={6}
                  className="w-full h-[64px] bg-[#111] border border-white/20 rounded-xl focus:border-white focus:ring-[2px] focus:ring-white/30 focus:outline-none transition-all duration-300 text-white placeholder-gray-500 text-2xl tracking-[0.5em] text-center font-bold font-sans" />
              </div>
            )}

            {err && <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3 text-red-400 text-sm flex items-start text-left gap-2 mt-2 font-medium"><svg className="w-4 h-4 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>{err}</div>}
            {info && <div className="bg-white/10 border border-white/30 rounded-lg p-3 text-white text-sm flex items-start text-left gap-2 mt-2 font-medium"><svg className="w-4 h-4 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>{info}</div>}

            {mode === "support" && (
              suppSent ? (
                <div style={{ textAlign: "center", padding: "24px 0" }}>
                  <div style={{ fontSize: 48, marginBottom: 12 }}>✅</div>
                  <div className="text-white font-bold text-lg mb-2">Request Submitted!</div>
                  <div className="text-gray-400 text-sm mb-6">Our admin team will review your issue soon. Try signing in again or contact us directly.</div>
                  <button type="button" onClick={() => switchMode("login")} className="text-sm text-gray-400 hover:text-white transition-colors hover:underline bg-transparent border-none cursor-pointer font-semibold">← Back to Sign In</button>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="space-y-1.5 text-left">
                    <label className="text-xs uppercase tracking-[0.05em] font-semibold text-gray-400 ml-1">Your Name *</label>
                    <input value={suppName} onChange={(e) => setSuppName(e.target.value)} className="w-full h-[52px] px-4 bg-[#111] border border-white/20 rounded-xl focus:border-white focus:ring-[2px] focus:ring-white/30 focus:outline-none transition-all duration-300 text-white placeholder-gray-500" placeholder="Your Name" />
                  </div>
                  <div className="space-y-1.5 text-left">
                    <label className="text-xs uppercase tracking-[0.05em] font-semibold text-gray-400 ml-1">Email *</label>
                    <input value={suppEmail} onChange={(e) => setSuppEmail(e.target.value)} type="email" required className="w-full h-[52px] px-4 bg-[#111] border border-white/20 rounded-xl focus:border-white focus:ring-[2px] focus:ring-white/30 focus:outline-none transition-all duration-300 text-white placeholder-gray-500" placeholder="name@example.com" />
                  </div>
                  <div className="space-y-1.5 text-left">
                    <label className="text-xs uppercase tracking-[0.05em] font-semibold text-gray-400 ml-1">Subject *</label>
                    <input value={suppSubject} onChange={(e) => setSuppSubject(e.target.value)} className="w-full h-[52px] px-4 bg-[#111] border border-white/20 rounded-xl focus:border-white focus:ring-[2px] focus:ring-white/30 focus:outline-none transition-all duration-300 text-white placeholder-gray-500" placeholder="e.g. Can't log in to my account" />
                  </div>
                  <div className="space-y-1.5 text-left">
                    <label className="text-xs uppercase tracking-[0.05em] font-semibold text-gray-400 ml-1">Describe your issue *</label>
                    <textarea value={suppMsg} onChange={(e) => setSuppMsg(e.target.value)} rows={4} className="w-full px-4 py-3 bg-[#111] border border-white/20 rounded-xl focus:border-white focus:ring-[2px] focus:ring-white/30 focus:outline-none transition-all duration-300 text-white placeholder-gray-500 resize-none" placeholder="Please describe what happened and what you expected..." />
                  </div>
                  <button type="submit" disabled={loading}
                    className={`mt-2 w-full h-[52px] rounded-xl bg-white text-black text-[15px] font-bold tracking-wide hover:bg-gray-200 border-none transition-all duration-300 shadow flex items-center justify-center gap-2 ${loading ? "opacity-70 cursor-not-allowed" : "cursor-pointer active:scale-[0.98]"}`}>
                    {loading ? <BtnSpinner /> : null}{loading ? "Sending..." : "🆘 Send Support Request"}
                  </button>
                  <button type="button" onClick={() => switchMode("login")} className="w-full bg-transparent border-none text-gray-500 text-xs font-semibold cursor-pointer hover:text-white hover:underline transition-colors mt-1">← Back to Sign In</button>
                </div>
              )
            )}

            {mode !== "support" && (
              <button
                type="submit" disabled={loading}
                className={`mt-4 w-full h-[52px] rounded-xl bg-white text-black text-[15px] font-bold tracking-wide hover:bg-gray-200 border-none transition-all duration-300 shadow flex items-center justify-center gap-2 ${loading ? "opacity-70 cursor-not-allowed" : "cursor-pointer active:scale-[0.98]"}`}
              >
                {loading ? <BtnSpinner /> : null}
                {loading ? "Please wait..." : mode === "login" ? "Sign In" : mode === "signup" ? (signupStep === "form" ? "Send OTP" : "Create Account") : mode === "forgot" ? (signupStep === "form" ? "Send Reset OTP" : "Reset Password") : "Access Admin"}
              </button>
            )}

            {(mode === "signup" || mode === "forgot") && signupStep === "otp" && (
              <button type="button" onClick={() => { setSignupStep("form"); setOtp(""); setErr(""); setInfo(""); }} className="w-full bg-transparent border-none text-gray-500 text-xs font-semibold cursor-pointer hover:text-white hover:underline transition-colors mt-2">← Change email or resend OTP</button>
            )}
          </form>

          <div style={{ textAlign: "center", marginTop: 20, display: "flex", justifyContent: "center", gap: 16, paddingBottom: 4 }}>
            <button type="button" onClick={() => switchMode("privacy")} className="text-xs text-gray-500 hover:text-white transition-colors hover:underline bg-transparent border-none cursor-pointer font-semibold">Privacy Policy</button>
            <span className="text-gray-600">·</span>
            <button type="button" onClick={() => switchMode("terms")} className="text-xs text-gray-500 hover:text-white transition-colors hover:underline bg-transparent border-none cursor-pointer font-semibold">Terms of Service</button>
          </div>
        </div>
      </main>
      <style dangerouslySetInnerHTML={{
        __html: `
        @keyframes slideIn {
          from { transform: translateY(24px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
      `}} />
    </div>
  );
}
