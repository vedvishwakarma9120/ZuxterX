import "./App.css";
import React, { useState, useEffect } from "react";
import { COLORS, ALL_BADGES, BASE_URL } from "./config/constants";
import { ThemeContext, applyTheme } from "./context/ThemeContext";
import Avatar from "./components/common/Avatar";
import { Spinner } from "./components/common/Spinner";
import { AuthScreen } from "./components/auth/AuthScreen";
import Sidebar from "./components/layout/Sidebar";
import MobileTopBar from "./components/layout/MobileTopBar";
import MobileBottomNav from "./components/layout/MobileBottomNav";
import NotificationsPanel from "./components/notifications/NotificationsPanel";
import ProfilePage from "./components/profile/ProfilePage";
import ZuxterConnect from "./components/connect/ZuxterConnect";
import SupportPage from "./components/support/SupportPage";
import MessagingPage from "./components/messaging/MessagingPage";
import { PlannerPage, QuestionsPage, SummaryPage } from "./components/ai/AIPages";
import BadgesPage from "./components/ai/BadgesPage";
import LeaderboardPage from "./components/ai/LeaderboardPage";
import AdminPanel from "./components/admin/AdminPanel";

// BASE_URL is imported from config/constants

function clearSession() {
  window._authToken = null;
  window._adminToken = null;
  localStorage.removeItem("zx_token");
  localStorage.removeItem("zx_admin_token");
  sessionStorage.clear();
}

function getCss() {
  return `
    @keyframes fadeUp{from{opacity:0;transform:translateY(18px)}to{opacity:1;transform:none}}
    @keyframes badgePop{0%{transform:scale(0) rotate(-15deg)}70%{transform:scale(1.2) rotate(4deg)}100%{transform:scale(1) rotate(0deg)}}
    @keyframes pulse{0%,100%{opacity:1}50%{opacity:0.5}}
    @keyframes slideUp{from{opacity:0;transform:translateY(20px)}to{opacity:1;transform:none}}
    @keyframes neonPulse{0%,100%{box-shadow:0 0 10px rgba(255,255,255,0.1);}50%{box-shadow:0 0 20px rgba(255,255,255,0.3), 0 0 30px rgba(255,255,255,0.1);}}
    h1, h2, h3, h4, h5, h6 { color: ${COLORS.text} !important; }
    body.light-mode .brand-name { color: #007bff !important; text-shadow: 0 0 10px rgba(0, 123, 255, 0.6), 0 0 20px rgba(0, 123, 255, 0.4) !important; }
    body.light-mode .brand-name span { color: #007bff !important; text-shadow: 0 0 10px rgba(0, 123, 255, 0.8), 0 0 20px rgba(0, 123, 255, 0.6) !important; }
    .main-container{display:flex;min-height:100vh}
    .nav-btn{transition:all 0.2s ease;}
    .nav-btn:hover{background:${COLORS.accent}18 !important;color:${COLORS.accent} !important;transform:translateX(3px)}
    .post-card{transition:all 0.2s ease;}
    .post-card:hover{border-color:${COLORS.accent}44 !important;}
    .like-btn{transition:all 0.15s ease;}
    .like-btn:hover{transform:scale(1.1);}
    .connect-btn{transition:all 0.2s ease;}
    .connect-btn:hover{filter:brightness(1.15);}
    .sidebar-wrap{display:flex;flex-direction:column;width:220px;min-height:100vh}
    .auth-container { display: none; align-items: center; justify-content: center; width: 100%; min-height: 100vh; }
    .auth-right { width: 420px; display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 24px; }
    .mobile-topbar{display:none;position:fixed;top:0;left:0;right:0;z-index:200;background:${COLORS.surface};border-bottom:1px solid ${COLORS.border};padding:10px 16px;align-items:center;justify-content:space-between;height:56px}
    .mobile-bottomnav{display:none;position:fixed;bottom:0;left:0;right:0;z-index:200;background:${COLORS.surface};border-top:1px solid ${COLORS.border};padding:6px 0 10px;align-items:center;justify-content:space-around}
    .main-scroll{flex:1;overflow-y:auto;padding:24px}
    @media(max-width:900px){ .sidebar-wrap{width:180px !important} }
    @media(max-width:640px){
      .sidebar-wrap{display:none !important}
      .auth-container{justify-content:center;}
      .auth-right{width:100% !important;margin-right:0 !important;min-height:100vh;background:rgba(5,8,15,0.9) !important;}
      .mobile-topbar{display:flex !important}
      .mobile-bottomnav{display:flex !important}
      .main-scroll{padding:12px !important;padding-top:68px !important;padding-bottom:80px !important}
      .badge-toast{bottom:90px !important;right:12px !important;max-width:calc(100vw - 24px)}
      .connect-header{flex-direction:column !important;gap:8px !important}
    }
  `;
}

export default function App() {
  const [user, setUser] = useState(null);
  const [adminUser, setAdminUser] = useState(null);
  const [active, setActive] = useState("planner");
  const [prevActive, setPrevActive] = useState("planner");
  const [newBadge, setNewBadge] = useState(null);
  const [showNotifs, setShowNotifs] = useState(false);
  const [notifCount, setNotifCount] = useState(0);
  const [msgCount, setMsgCount] = useState(0);
  const [restoring, setRestoring] = useState(true);
  const [theme, setThemeState] = useState(() => localStorage.getItem("zx_theme") || "dark");

  function setTheme(t) {
    localStorage.setItem("zx_theme", t);
    applyTheme(t);
    setThemeState(t);
  }

  useEffect(() => {
    const savedToken = localStorage.getItem("zx_token");
    const savedAdminToken = localStorage.getItem("zx_admin_token");
    if (savedToken) {
      window._authToken = savedToken;
      const attemptFetch = async (retries = 2) => {
        for (let i = 0; i <= retries; i++) {
          try {
            const controller = new AbortController();
            const id = setTimeout(() => controller.abort(), 15000);
            const r = await fetch(`${BASE_URL}/me`, { headers: { Authorization: "Bearer " + savedToken }, signal: controller.signal });
            clearTimeout(id);
            if (!r.ok) throw new Error("Not ok");
            const data = await r.json();
            setUser(data);
            setRestoring(false);
            return;
          } catch (e) {
            if (i === retries || e.message === "Not ok") {
              clearSession();
              setRestoring(false);
              return;
            }
          }
        }
      };
      attemptFetch();
    } else if (savedAdminToken) {
      window._adminToken = savedAdminToken;
      setAdminUser({ email: "admin" });
      setRestoring(false);
    } else {
      setRestoring(false);
    }
  }, []);

  function handleLogin(data) { setUser(data); }
  function handleAdminLogin(data) { setAdminUser(data); }
  function handleLogout() { clearSession(); setUser(null); setActive("planner"); }
  function handleAdminLogout() { clearSession(); setAdminUser(null); }

  function handleUpdate(updatedUser) {
    const prevBadges = new Set(user.badges || []);
    setUser(updatedUser);
    const freshBadge = (updatedUser.badges || []).find((b) => !prevBadges.has(b));
    if (freshBadge) {
      const badge = ALL_BADGES.find((b) => b.id === freshBadge);
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

  useEffect(() => {
    if (!user) return;
    const ping = () =>
      fetch(`${BASE_URL}/heartbeat`, {
        method: "POST",
        headers: { Authorization: "Bearer " + window._authToken },
      }).catch(() => {});

    const pollCounts = async () => {
      try {
        const [nr, mr] = await Promise.all([
          fetch(`${BASE_URL}/notifications/unread-count`, { headers: { Authorization: "Bearer " + window._authToken } }),
          fetch(`${BASE_URL}/msg/unread-count`, { headers: { Authorization: "Bearer " + window._authToken } }),
        ]);
        if (nr.ok) { const d = await nr.json(); setNotifCount(d.count || 0); }
        if (mr.ok) { const d = await mr.json(); setMsgCount(d.count || 0); }
      } catch {}
    };

    ping();
    pollCounts();
    const id1 = setInterval(ping, 60000);
    const id2 = setInterval(pollCounts, 15000);
    return () => { clearInterval(id1); clearInterval(id2); };
  }, [user]);

  const splineBg = (
    <>
      <style>{`
        .spline-bg-wrap iframe { width: 100%; height: 100%; }
        @media (max-width: 768px) {
          .spline-bg-wrap iframe {
            position: absolute;
            left: 0;
            top: 0;
            width: 300vw !important;
            height: 100vh !important;
            transform: translateX(-29%);
          }
        }
      `}</style>
      <div className="spline-bg-wrap" style={{ position: "fixed", inset: 0, zIndex: -2, opacity: theme === "light" ? 0.08 : (user && !adminUser ? 0.45 : 1), transition: "opacity 1.5s ease", pointerEvents: "none", overflow: "hidden" }}>
        <iframe
          src="https://my.spline.design/retrofuturisticcircuitloop-26VXgZZN9YuD1DemISWkC4US/"
          frameBorder="0"
          loading="lazy"
          style={{ background: 'transparent', border: 'none', width: "100%", height: "100%" }}
          allow="autoplay"
          title="Background animation"
        />
      </div>
      <div style={{ position: "fixed", inset: 0, pointerEvents: "none", background: theme === "light" ? `radial-gradient(circle at center, transparent 0%, #f0f2f5 85%)` : `radial-gradient(circle at center, transparent ${user && !adminUser ? '40%' : '0%'}, #05080f ${user && !adminUser ? '150%' : '85%'})`, zIndex: -1 }} />
    </>
  );

  if (restoring) return <>{splineBg}<div style={{ display: "flex", flexDirection: "column", gap: 16, alignItems: "center", justifyContent: "center", minHeight: "100vh" }}><Spinner /><div style={{ color: COLORS.accent, fontFamily: "'Syne',sans-serif", fontSize: 20, fontWeight: 700, letterSpacing: "-0.5px" }}>Waking up server…</div></div></>;
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
    if (active === "profile") return <ProfilePage user={user} onUserUpdate={handleUserUpdate} onBack={goBack} onLogout={handleLogout} />;
    if (active === "connect") return <ZuxterConnect user={user} onUserUpdate={handleUserUpdate} />;
    if (active === "support") return <SupportPage user={user} />;
    if (active === "messages") return <MessagingPage user={user} />;
    const Page = pages[active];
    if (Page) return <Page user={user} onUpdate={handleUpdate} currentUser={user} />;
    return null;
  }

  const sidebarWithMsg = (
    <Sidebar
      user={user}
      active={active}
      showNotifs={showNotifs}
      setShowNotifs={setShowNotifs}
      notifCount={notifCount}
      msgCount={msgCount}
      navigateTo={navigateTo}
      handleLogout={handleLogout}
    />
  );

  return (
    <ThemeContext.Provider value={{ theme, setTheme }}>
      <>
        {splineBg}
        <div className="main-container" style={{ display: "flex", width: "100%", height: "100vh", overflow: "hidden" }} onClick={(e) => { if (showNotifs && !e.target.closest(".notif-panel") && !e.target.closest(".notif-btn")) setShowNotifs(false); }}>
          <style>{getCss()}</style>

          {sidebarWithMsg}

          <MobileTopBar
            user={user}
            active={active}
            notifCount={notifCount}
            msgCount={msgCount}
            onAvatarClick={() => navigateTo("profile")}
            onNotifClick={() => setShowNotifs((v) => !v)}
            onMsgClick={() => navigateTo("messages")}
            onSupportClick={() => navigateTo("support")}
          />

          {showNotifs && (
            <div className="notif-panel">
              <NotificationsPanel user={user} onClose={() => setShowNotifs(false)} onNavigate={navigateTo} />
            </div>
          )}

          <main className="main-scroll" style={{ flex: 1, maxWidth: "100%" }}>
            {renderPage()}
          </main>

          <MobileBottomNav active={active} setActive={navigateTo} />

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
    </ThemeContext.Provider>
  );
}
