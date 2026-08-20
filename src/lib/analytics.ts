import { db, auth } from '../firebase';
import { collection, addDoc, doc, updateDoc, serverTimestamp } from 'firebase/firestore';

let currentDocId: string | null = null;
let visitStart = Date.now();

function getSessionId() {
  let id = sessionStorage.getItem('visitor_session_id');
  if (!id) {
    id = Math.random().toString(36).slice(2, 15) + Math.random().toString(36).slice(2, 15);
    sessionStorage.setItem('visitor_session_id', id);
  }
  return id;
}

function parseBrowser(ua: string): string {
  if (/Edg\//.test(ua)) return 'Edge';
  if (/OPR\/|Opera/.test(ua)) return 'Opera';
  if (/Chrome\//.test(ua)) return 'Chrome';
  if (/Firefox\//.test(ua)) return 'Firefox';
  if (/Safari\//.test(ua)) return 'Safari';
  return 'Other';
}

function parseDevice(ua: string): string {
  if (/Mobi|Android|iPhone/.test(ua)) return 'Mobile';
  if (/Tablet|iPad/.test(ua)) return 'Tablet';
  return 'Desktop';
}

function parseReferrer(referrer: string): string {
  if (!referrer) return 'direct';
  try {
    const host = new URL(referrer).hostname.replace('www.', '');
    if (host.includes('linkedin.com')) return 'LinkedIn';
    if (host.includes('github.com')) return 'GitHub';
    if (host.includes('google.com')) return 'Google';
    if (host.includes('twitter.com') || host.includes('x.com')) return 'Twitter / X';
    if (host.includes('reddit.com')) return 'Reddit';
    return host;
  } catch {
    return referrer;
  }
}

function flushTimeSpent() {
  if (!currentDocId) return;
  const elapsed = Math.round((Date.now() - visitStart) / 1000);
  if (elapsed < 3) return;
  try {
    updateDoc(doc(db, 'visitorLogs', currentDocId), { timeSpentSeconds: elapsed });
  } catch { /* silent */ }
}

document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'hidden') flushTimeSpent();
});
window.addEventListener('beforeunload', flushTimeSpent);

export const logVisit = async (path: string) => {
  visitStart = Date.now();
  try {
    const ua = navigator.userAgent;
    const ref = await addDoc(collection(db, 'visitorLogs'), {
      path,
      referrer: parseReferrer(document.referrer),
      userAgent: ua,
      browser: parseBrowser(ua),
      device: parseDevice(ua),
      language: navigator.language,
      screenResolution: `${window.screen.width}x${window.screen.height}`,
      timestamp: serverTimestamp(),
      userId: auth.currentUser?.uid || null,
      sessionId: getSessionId(),
      country: null,
      countryCode: null,
      city: null,
      region: null,
      timeSpentSeconds: null,
    });
    currentDocId = ref.id;

    // Geo lookup in background — doesn't block page load
    fetch('https://ipapi.co/json/')
      .then(r => r.json())
      .then(geo => updateDoc(ref, {
        country: geo.country_name || null,
        countryCode: geo.country_code || null,
        city: geo.city || null,
        region: geo.region || null,
      }))
      .catch(() => {});
  } catch (error: any) {
    const msg = typeof error === 'string' ? error : error?.message || '';
    if (error?.code !== 'already-exists' && !msg.includes('already exists')) {
      console.error('Analytics error:', error);
    }
  }
};
