/**
 * Auth state must be isolated per browser tab. localStorage is shared by all
 * tabs of the same origin, which can mix Farmer, Buyer and Admin sessions.
 * Non-auth preferences (e.g. demo support requests) keep their old behavior.
 */
const AUTH_KEYS = new Set(['ardnet.user', 'ardnet.token', 'refreshToken']);

function storageFor(key) {
  return AUTH_KEYS.has(key) ? sessionStorage : localStorage;
}

// Do NOT migrate old localStorage JWTs: they may already belong to a different
// account. Remove them and ask users to sign in again after installing the fix.
for (const key of AUTH_KEYS) {
  try {
    localStorage.removeItem(key);
  } catch {
    // Browsers may deny storage; authentication storage is handled separately.
  }
}

export function getStorage(key, fallback = null) {
  try {
    const raw = storageFor(key).getItem(key);
    if (raw === null) return fallback;

    try {
      return JSON.parse(raw);
    } catch {
      // apiClient stores the access JWT as a plain string. Redux must be able
      // to restore that token after a page reload as well.
      if (key === 'ardnet.token' || key === 'refreshToken') return raw;
      return fallback;
    }
  } catch {
    return fallback;
  }
}

export function setStorage(key, value) {
  storageFor(key).setItem(key, JSON.stringify(value));
}

export function removeStorage(key) {
  storageFor(key).removeItem(key);
}
