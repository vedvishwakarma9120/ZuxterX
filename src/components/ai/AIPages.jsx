import React, { useState } from "react";
import { COLORS } from "../../config/constants";
import Card from "../common/Card";
import Btn from "../common/Btn";
import { Spinner } from "../common/Spinner";
import Tag from "../common/Tag";
import { callAI, recordActivity } from "../../utils/api";
import { downloadPDF } from "../../utils/pdf";

function formatResponse(text) {
  const lines = text.split("\n");
  const elements = [];
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmed = line.trim();
    if (!trimmed) { elements.push(<div key={i} style={{ height: 8 }} />); continue; }
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
    } else if (/^[-•*]/.test(trimmed)) {
      elements.push(
        <div key={i} style={{ display: "flex", gap: 8, alignItems: "flex-start", marginLeft: 20, marginTop: 3 }}>
          <span style={{ color: COLORS.accent, marginTop: 6, flexShrink: 0, fontSize: 10 }}>◆</span>
          <p style={{ fontSize: 14, color: "#c8d0da", lineHeight: 1.75, margin: 0 }}>{trimmed.replace(/^[-•*]\s*/, "")}</p>
        </div>
      );
    } else if (trimmed.endsWith(":") && trimmed.length < 60) {
      elements.push(
        <p key={i} style={{ fontWeight: 700, fontSize: 13, color: COLORS.gold, letterSpacing: "0.06em", textTransform: "uppercase", marginTop: 14, marginBottom: 4, borderLeft: `3px solid ${COLORS.gold}`, paddingLeft: 10 }}>
          {trimmed.replace(/:$/, "")}
        </p>
      );
    } else {
      elements.push(<p key={i} style={{ fontSize: 14, color: "#c8d0da", lineHeight: 1.75, margin: "5px 0" }}>{trimmed}</p>);
    }
  }
  return elements;
}

function ResultBlock({ text, label, color = COLORS.accent }) {
  const [copied, setCopied] = useState(false);
  return (
    <div style={{ background: `linear-gradient(145deg, ${COLORS.surface}, ${COLORS.surfaceAlt})`, border: `1px solid ${color}33`, borderRadius: 16, padding: "20px 22px", marginTop: 16, animation: "fadeUp .4s ease", boxShadow: `0 8px 32px rgba(0,0,0,0.3), 0 0 0 1px ${color}11` }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ width: 4, height: 28, borderRadius: 4, background: `linear-gradient(to bottom,${color},${color}66)` }} />
          <Tag color={color}>{label}</Tag>
          <span style={{ fontSize: 11, color: COLORS.muted }}>{text.split(" ").length} words</span>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <button onClick={() => { navigator.clipboard.writeText(text); setCopied(true); setTimeout(() => setCopied(false), 1500); }}
            style={{ background: COLORS.surfaceAlt, border: `1px solid ${COLORS.border}`, borderRadius: 8, padding: "6px 14px", color: copied ? COLORS.accent : COLORS.muted, fontSize: 12, cursor: "pointer" }}>
            {copied ? "✓ Copied!" : "📋 Copy"}
          </button>
          <button onClick={() => downloadPDF(text, label)}
            style={{ background: color + "18", border: `1px solid ${color}55`, borderRadius: 8, padding: "6px 14px", color, fontSize: 12, cursor: "pointer", fontWeight: 600 }}>
            ⬇ PDF
          </button>
        </div>
      </div>
      <div style={{ background: "rgba(0,0,0,0.3)", borderRadius: 12, border: `1px solid rgba(255,255,255,0.06)`, padding: "18px 20px", maxHeight: 520, overflowY: "auto" }}>
        {formatResponse(text)}
      </div>
    </div>
  );
}

function SyllabusInput({ value, onChange }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
      <label style={{ fontSize: 12, color: COLORS.muted, fontWeight: 500, letterSpacing: ".05em", textTransform: "uppercase" }}>Syllabus / Topic</label>
      <textarea value={value} onChange={(e) => onChange(e.target.value)} placeholder="Paste your syllabus or topic here…" rows={5}
        style={{ background: COLORS.surfaceAlt, border: `1px solid ${COLORS.border}`, borderRadius: 10, padding: "11px 14px", color: COLORS.text, fontFamily: "'DM Sans',sans-serif", fontSize: 14, outline: "none", resize: "vertical" }}
        onFocus={(e) => (e.target.style.borderColor = COLORS.accent)}
        onBlur={(e) => (e.target.style.borderColor = COLORS.border)} />
    </div>
  );
}

export function PlannerPage({ user, onUpdate }) {
  const [syllabus, setSyllabus] = useState("");
  const [days, setDays] = useState("7");
  const [result, setResult] = useState("");
  const [loading, setLoading] = useState(false);

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
      <div>
        <h2 style={{ fontFamily: "'Syne',sans-serif", fontSize: 26, fontWeight: 800 }}>Study Planner</h2>
        <p style={{ color: COLORS.muted, marginTop: 4, fontSize: 14 }}>Get a personalized day-by-day study schedule.</p>
      </div>
      <Card>
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <SyllabusInput value={syllabus} onChange={setSyllabus} />
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <label style={{ fontSize: 12, color: COLORS.muted, fontWeight: 500, textTransform: "uppercase" }}>Study Duration (days)</label>
            <input type="number" value={days} onChange={(e) => setDays(e.target.value)}
              style={{ background: COLORS.surfaceAlt, border: `1px solid ${COLORS.border}`, borderRadius: 10, padding: "11px 14px", color: COLORS.text, fontFamily: "'DM Sans',sans-serif", fontSize: 14, outline: "none" }} />
          </div>
          <Btn onClick={generate} disabled={loading || !syllabus.trim()}>{loading ? "Generating…" : "✨ Generate Study Plan"}</Btn>
          {loading && <Spinner />}
        </div>
      </Card>
      {result && <ResultBlock text={result} label="Study Plan" color={COLORS.gold} />}
    </div>
  );
}

export function QuestionsPage({ user, onUpdate }) {
  const [syllabus, setSyllabus] = useState("");
  const [level, setLevel] = useState("mixed");
  const [result, setResult] = useState("");
  const [loading, setLoading] = useState(false);

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
      <div>
        <h2 style={{ fontFamily: "'Syne',sans-serif", fontSize: 26, fontWeight: 800 }}>Important Questions</h2>
        <p style={{ color: COLORS.muted, marginTop: 4, fontSize: 14 }}>AI-generated exam-ready questions.</p>
      </div>
      <Card>
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <SyllabusInput value={syllabus} onChange={setSyllabus} />
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <label style={{ fontSize: 12, color: COLORS.muted, fontWeight: 500, textTransform: "uppercase" }}>Difficulty</label>
            <div style={{ display: "flex", gap: 8 }}>
              {["easy", "mixed", "hard"].map((l) => (
                <button key={l} onClick={() => setLevel(l)}
                  style={{ flex: 1, padding: "9px 0", borderRadius: 8, border: `1px solid ${level === l ? COLORS.blue : COLORS.border}`, background: level === l ? COLORS.blue + "22" : "transparent", color: level === l ? COLORS.blue : COLORS.muted, cursor: "pointer", fontWeight: 600, fontSize: 13, textTransform: "capitalize" }}>
                  {l}
                </button>
              ))}
            </div>
          </div>
          <Btn onClick={generate} disabled={loading || !syllabus.trim()} style={{ background: COLORS.blue, color: "#000" }}>{loading ? "Generating…" : "🧠 Generate Questions"}</Btn>
          {loading && <Spinner />}
        </div>
      </Card>
      {result && <ResultBlock text={result} label="Questions" color={COLORS.blue} />}
    </div>
  );
}

export function SummaryPage({ user, onUpdate }) {
  const [syllabus, setSyllabus] = useState("");
  const [style, setStyle] = useState("concise");
  const [result, setResult] = useState("");
  const [loading, setLoading] = useState(false);

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
      <div>
        <h2 style={{ fontFamily: "'Syne',sans-serif", fontSize: 26, fontWeight: 800 }}>AI Summaries</h2>
        <p style={{ color: COLORS.muted, marginTop: 4, fontSize: 14 }}>Condensed, revision-ready summaries.</p>
      </div>
      <Card>
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <SyllabusInput value={syllabus} onChange={setSyllabus} />
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <label style={{ fontSize: 12, color: COLORS.muted, fontWeight: 500, textTransform: "uppercase" }}>Style</label>
            <div style={{ display: "flex", gap: 8 }}>
              {["concise", "detailed", "bullet points"].map((s) => (
                <button key={s} onClick={() => setStyle(s)}
                  style={{ flex: 1, padding: "9px 0", borderRadius: 8, border: `1px solid ${style === s ? COLORS.gold : COLORS.border}`, background: style === s ? COLORS.gold + "22" : "transparent", color: style === s ? COLORS.gold : COLORS.muted, cursor: "pointer", fontWeight: 600, fontSize: 12, textTransform: "capitalize" }}>
                  {s}
                </button>
              ))}
            </div>
          </div>
          <Btn onClick={generate} disabled={loading || !syllabus.trim()} style={{ background: COLORS.gold, color: "#000" }}>{loading ? "Generating…" : "📝 Generate Summary"}</Btn>
          {loading && <Spinner />}
        </div>
      </Card>
      {result && <ResultBlock text={result} label="Summary" color={COLORS.gold} />}
    </div>
  );
}
