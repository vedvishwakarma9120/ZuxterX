import React from "react";
import { COLORS } from "../../config/constants";

const spinKeyframes = `@keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}`;

export function Spinner() {
  return (
    <div style={{ display: "flex", justifyContent: "center", padding: "30px 0" }}>
      <style>{spinKeyframes}</style>
      <div style={{ width: 28, height: 28, border: `3px solid ${COLORS.border}`, borderTopColor: COLORS.accent, borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
    </div>
  );
}

export function BtnSpinner() {
  return (
    <>
      <style>{spinKeyframes}</style>
      <div style={{ width: 16, height: 16, border: "2px solid rgba(0,0,0,0.25)", borderTopColor: "#000", borderRadius: "50%", animation: "spin 0.8s linear infinite", display: "inline-block" }} />
    </>
  );
}
