const _memCache = {};

export function cacheSet(key, data, ttlMs) {
  const entry = { data, ts: Date.now(), ttl: ttlMs };
  _memCache[key] = entry;
  try {
    sessionStorage.setItem("zx_c_" + key, JSON.stringify(entry));
  } catch {}
}

export function cacheGet(key) {
  let entry = _memCache[key];
  if (!entry) {
    try {
      const raw = sessionStorage.getItem("zx_c_" + key);
      if (raw) {
        entry = JSON.parse(raw);
        _memCache[key] = entry;
      }
    } catch {}
  }
  if (!entry) return { data: null, fresh: false };
  const age = Date.now() - entry.ts;
  return { data: entry.data, fresh: age < entry.ttl };
}

export function cacheDel(keyPrefix) {
  Object.keys(_memCache).forEach((k) => {
    if (k.startsWith(keyPrefix)) delete _memCache[k];
  });
  try {
    for (let i = sessionStorage.length - 1; i >= 0; i--) {
      const k = sessionStorage.key(i);
      if (k && k.startsWith("zx_c_" + keyPrefix)) sessionStorage.removeItem(k);
    }
  } catch {}
}

export async function cachedFetch(cacheKey, url, opts, ttlMs, onData) {
  const cached = cacheGet(cacheKey);
  if (cached.data) {
    onData(cached.data);
    if (cached.fresh) return;
  }
  try {
    const res = await fetch(url, opts);
    if (res.ok) {
      const data = await res.json();
      cacheSet(cacheKey, data, ttlMs);
      onData(data);
    }
  } catch {}
}
