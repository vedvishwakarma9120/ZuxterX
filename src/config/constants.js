export const DARK_COLORS = {
  bg: "#030303", surface: "rgba(15, 15, 15, 0.85)", surfaceAlt: "rgba(25, 25, 25, 0.75)",
  border: "rgba(255, 255, 255, 0.15)", accent: "#ffffff", accentDim: "rgba(255, 255, 255, 0.1)",
  accentHover: "#f0f0f0", gold: "#e0e0e0", blue: "#ffffff",
  pink: "#cccccc", text: "#f5f5f5", muted: "#888888", danger: "#ff5555",
  admin: "#e2e2e2",
};

export const LIGHT_COLORS = {
  bg: "#f4f6f8", surface: "#ffffff", surfaceAlt: "#f0f2f5",
  border: "rgba(0, 0, 0, 0.15)", accent: "#111111", accentDim: "rgba(0, 0, 0, 0.12)",
  accentHover: "#000000", gold: "#b8860b", blue: "#007bff",
  pink: "#d81b60", text: "#0f172a", muted: "#475569", danger: "#dc3545",
  admin: "#1e293b",
};

const _savedTheme = typeof localStorage !== "undefined" ? localStorage.getItem("zx_theme") || "dark" : "dark";
export const COLORS = { ...(_savedTheme === "light" ? LIGHT_COLORS : DARK_COLORS) };

export const BASE_URL =
  typeof window !== "undefined" && window.location.hostname === "localhost"
    ? "http://localhost:5000"
    : "https://zuxter-backend.onrender.com";

export const CACHE_TTL = {
  leaderboard: 60 * 1000,       // 60s
  posts: 30 * 1000,             // 30s
  userProfile: 120 * 1000,      // 2min
  userPosts: 60 * 1000,         // 60s
  myTickets: 120 * 1000,        // 2min
  inbox: 30 * 1000,             // 30s
  achievements: 120 * 1000,     // 2min
};

export const ROLES = [
  { id: "owner", label: "Owner", color: "#ff6b35", icon: "👑", desc: "Full control" },
  { id: "moderator", label: "Moderator", color: "#a855f7", icon: "🛡️", desc: "Manage content" },
  { id: "helper", label: "Helper", color: "#4cc9f0", icon: "🤝", desc: "Support team" },
  { id: "premium", label: "Premium", color: "#ffd166", icon: "⭐", desc: "Premium member" },
  { id: "verified", label: "Verified", color: "#00e5a0", icon: "✅", desc: "Verified user" },
  { id: "member", label: "Member", color: "#6b7585", icon: "👤", desc: "Regular member" },
];

export const FONTS = `@import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700&family=Syne:wght@400;600;700;800&family=DM+Sans:ital,wght@0,300;0,400;0,500;1,300&family=Outfit:wght@300;400;500;600;700&display=swap');`;

export const ALL_BADGES = [
  { id: "first_plan", icon: "🎯", label: "First Plan", desc: "Generated your first study plan" },
  { id: "streak3", icon: "🔥", label: "On Fire", desc: "3-day streak achieved" },
  { id: "streak7", icon: "⚡", label: "Lightning", desc: "7-day streak achieved" },
  { id: "ten_q", icon: "🧠", label: "Quizzed", desc: "Generated 10+ question sets" },
  { id: "explorer", icon: "🧭", label: "Explorer", desc: "Tried all 3 AI features" },
  { id: "top3", icon: "🏆", label: "Top 3", desc: "Reached top 3 on leaderboard" },
];
