import { BASE_URL } from "../config/constants";

export async function callAI(userMsg) {
  const res = await fetch(`${BASE_URL}/api/ai`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": "Bearer " + (window._authToken || ""),
    },
    body: JSON.stringify({ prompt: userMsg }),
  });
  const data = await res.json();
  return data.response;
}

export async function recordActivity(feature) {
  const res = await fetch(`${BASE_URL}/activity`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": "Bearer " + (window._authToken || ""),
    },
    body: JSON.stringify({ feature }),
  });
  if (!res.ok) return null;
  return await res.json();
}

export async function adminFetch(path, method = "GET", body = null) {
  const opts = {
    method,
    headers: {
      "Content-Type": "application/json",
      "Authorization": "AdminBearer " + (window._adminToken || ""),
    },
  };
  if (body) opts.body = JSON.stringify(body);
  const res = await fetch(`${BASE_URL}${path}`, opts);
  return { ok: res.ok, data: await res.json() };
}
