import React, { useState, useEffect, useRef } from "react";
import { COLORS } from "../../config/constants";
import Avatar from "../common/Avatar";
import Card from "../common/Card";
import Btn from "../common/Btn";
import PostCard from "./PostCard";
import MessagingPage from "../messaging/MessagingPage";
import UserProfileView from "./UserProfileView";
import { cacheGet, cacheDel, cachedFetch } from "../../utils/cache";

import { BASE_URL } from "../../config/constants";

const CACHE_TTL_POSTS = 30 * 1000;

export default function ZuxterConnect({ user, onUserUpdate }) {
  const [posts, setPosts] = useState([]);
  const [loadingPosts, setLoadingPosts] = useState(true);
  const [postText, setPostText] = useState("");
  const [postImg, setPostImg] = useState(null);
  const [posting, setPosting] = useState(false);
  const [postErr, setPostErr] = useState("");
  const [viewProfile, setViewProfile] = useState(null);
  const fileRef = useRef(null);

  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [currentTab, setCurrentTab] = useState("feed");
  const [msgTarget, setMsgTarget] = useState(null);

  useEffect(() => {
    if (!searchQuery.trim()) { setSearchResults([]); return; }
    const id = setTimeout(async () => {
      setIsSearching(true);
      try {
        const res = await fetch(`${BASE_URL}/connect/search?q=${encodeURIComponent(searchQuery)}`, {
          headers: { Authorization: "Bearer " + window._authToken },
        });
        if (res.ok) setSearchResults(await res.json());
      } catch {}
      setIsSearching(false);
    }, 300);
    return () => clearTimeout(id);
  }, [searchQuery]);

  async function loadPosts(skipCache) {
    if (skipCache) cacheDel("feedPosts");
    await cachedFetch(
      "feedPosts",
      `${BASE_URL}/connect/posts`,
      { headers: { Authorization: "Bearer " + window._authToken } },
      CACHE_TTL_POSTS,
      (data) => { if (Array.isArray(data)) setPosts(data); setLoadingPosts(false); }
    );
  }

  useEffect(() => { loadPosts(); }, []);

  async function submitPost() {
    if (!postText.trim() && !postImg) return;
    setPosting(true); setPostErr("");
    try {
      const res = await fetch(`${BASE_URL}/connect/post`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: "Bearer " + window._authToken },
        body: JSON.stringify({ text: postText, image: postImg }),
      });
      const data = await res.json();
      if (!res.ok) { setPostErr(data.msg || "Error posting"); setPosting(false); return; }
      setPostText(""); setPostImg(null);
      await loadPosts(true);
      setCurrentTab("feed");
    } catch { setPostErr("Server error"); }
    setPosting(false);
  }

  async function toggleLike(postId) {
    // Optimistic update
    setPosts((prev) =>
      prev.map((p) => {
        if (p._id !== postId) return p;
        const already = (p.likes || []).includes(user.id);
        return { ...p, likes: already ? p.likes.filter((id) => id !== user.id) : [...(p.likes || []), user.id] };
      })
    );
    try {
      await fetch(`${BASE_URL}/connect/post/${postId}/like`, {
        method: "POST",
        headers: { Authorization: "Bearer " + window._authToken },
      });
    } catch {}
  }

  async function addComment(postId, text) {
    if (!text.trim()) return;
    try {
      const res = await fetch(`${BASE_URL}/connect/post/${postId}/comment`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: "Bearer " + window._authToken },
        body: JSON.stringify({ text }),
      });
      if (res.ok) {
        const updated = await res.json();
        setPosts((prev) => prev.map((p) => p._id === postId ? { ...p, comments: updated.comments || p.comments } : p));
      }
    } catch {}
  }

  async function toggleFollow(targetId) {
    try {
      const res = await fetch(`${BASE_URL}/connect/follow/${targetId}`, {
        method: "POST",
        headers: { Authorization: "Bearer " + window._authToken },
      });
      const data = await res.json();
      if (res.ok) onUserUpdate({ ...user, following: data.following, followers: data.followers });
    } catch {}
  }

  async function deletePost(postId) {
    try {
      await fetch(`${BASE_URL}/connect/post/${postId}`, {
        method: "DELETE",
        headers: { Authorization: "Bearer " + window._authToken },
      });
      await loadPosts(true);
    } catch {}
  }

  function editPost(postId, newText) {
    setPosts((prev) => prev.map((p) => p._id === postId ? { ...p, text: newText } : p));
  }

  function handleImagePick(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) { setPostErr("Only image files allowed."); return; }
    if (file.size > 2 * 1024 * 1024) { setPostErr("Image must be under 2MB."); return; }
    setPostErr("");
    const reader = new FileReader();
    reader.onload = (ev) => setPostImg(ev.target.result);
    reader.readAsDataURL(file);
  }

  if (msgTarget) {
    return <MessagingPage user={user} openWithId={msgTarget} onBack={() => setMsgTarget(null)} />;
  }
  if (viewProfile) {
    return (
      <UserProfileView
        userId={viewProfile}
        currentUser={user}
        onBack={() => setViewProfile(null)}
        onFollow={toggleFollow}
        onMessage={(id) => setMsgTarget(id)}
      />
    );
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
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search people by name..."
          style={{ width: "100%", background: COLORS.surfaceAlt, border: `1px solid ${COLORS.border}`, borderRadius: 10, padding: "12px 16px", color: COLORS.text, fontFamily: "'DM Sans',sans-serif", fontSize: 14, outline: "none", boxSizing: "border-box" }}
          onFocus={(e) => (e.target.style.borderColor = COLORS.blue)}
          onBlur={(e) => (e.target.style.borderColor = COLORS.border)}
        />
        {searchQuery.trim() && (
          <div style={{ position: "absolute", top: "100%", left: 0, right: 0, background: COLORS.surface, border: `1px solid ${COLORS.border}`, borderRadius: 10, marginTop: 6, maxHeight: 300, overflowY: "auto", boxShadow: "0 8px 32px rgba(0,0,0,0.5)" }}>
            {isSearching ? (
              <div style={{ padding: 16, textAlign: "center", color: COLORS.muted }}>Searching...</div>
            ) : searchResults.length === 0 ? (
              <div style={{ padding: 16, textAlign: "center", color: COLORS.muted }}>No users found.</div>
            ) : (
              searchResults.map((u) => (
                <div key={u.id} onClick={() => { setViewProfile(u.id); setSearchQuery(""); }}
                  style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 16px", borderBottom: `1px solid ${COLORS.border}`, cursor: "pointer" }}
                  onMouseOver={(e) => (e.currentTarget.style.background = COLORS.surfaceAlt)}
                  onMouseOut={(e) => (e.currentTarget.style.background = "transparent")}
                >
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
        <button onClick={() => setCurrentTab("feed")}
          style={{ flex: 1, padding: "10px", borderRadius: 10, border: `1px solid ${currentTab === "feed" ? COLORS.blue : COLORS.border}`, background: currentTab === "feed" ? COLORS.blue + "22" : "transparent", color: currentTab === "feed" ? COLORS.blue : COLORS.muted, fontFamily: "'Outfit',sans-serif", fontWeight: 700, cursor: "pointer" }}>
          📰 Feed
        </button>
        <button onClick={() => setCurrentTab("post")}
          style={{ flex: 1, padding: "10px", borderRadius: 10, border: `1px solid ${currentTab === "post" ? COLORS.accent : COLORS.border}`, background: currentTab === "post" ? COLORS.accent + "22" : "transparent", color: currentTab === "post" ? COLORS.accent : COLORS.muted, fontFamily: "'Outfit',sans-serif", fontWeight: 700, cursor: "pointer" }}>
          ✨ Create Post
        </button>
      </div>

      {/* Create Post */}
      {currentTab === "post" && (
        <Card glow>
          <div style={{ display: "flex", gap: 14 }}>
            <Avatar src={user.avatar} name={user.name} size={42} />
            <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 10 }}>
              <textarea
                value={postText}
                onChange={(e) => setPostText(e.target.value)}
                placeholder="Share something with the community…"
                rows={3}
                style={{ background: COLORS.surfaceAlt, border: `1px solid ${COLORS.border}`, borderRadius: 10, padding: "11px 14px", color: COLORS.text, fontFamily: "'DM Sans',sans-serif", fontSize: 14, outline: "none", resize: "none", width: "100%" }}
                onFocus={(e) => (e.target.style.borderColor = COLORS.blue)}
                onBlur={(e) => (e.target.style.borderColor = COLORS.border)}
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

      {/* Feed */}
      {currentTab === "feed" && (
        <>
          {loadingPosts ? (
            <div style={{ textAlign: "center", color: COLORS.muted, padding: "40px 0" }}>Loading posts…</div>
          ) : posts.length === 0 ? (
            <Card><div style={{ textAlign: "center", color: COLORS.muted, padding: "30px 0" }}>No posts yet. Be the first to post! 🚀</div></Card>
          ) : (
            posts.map((post) => (
              <PostCard
                key={post._id}
                post={post}
                currentUser={user}
                onLike={() => toggleLike(post._id)}
                onComment={(text) => addComment(post._id, text)}
                onFollowToggle={toggleFollow}
                onViewProfile={(id) => setViewProfile(id)}
                onDelete={deletePost}
                onEdit={editPost}
              />
            ))
          )}
        </>
      )}
    </div>
  );
}
