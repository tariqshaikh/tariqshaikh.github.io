import { db, auth } from '../firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';

/**
 * Logs a page visit to Firestore.
 * @param path The URL path visited.
 */
export const logVisit = async (path: string) => {
  try {
    const logData = {
      path,
      referrer: document.referrer || 'direct',
      userAgent: navigator.userAgent,
      timestamp: serverTimestamp(),
      userId: auth.currentUser?.uid || null,
      screenResolution: `${window.screen.width}x${window.screen.height}`,
      sessionId: getSessionId(),
    };

    await addDoc(collection(db, 'visitorLogs'), logData);
  } catch (error) {
    // Silently fail to not interrupt user experience
    console.error('Analytics error:', error);
  }
};

/**
 * Simple session ID generator/retriever using sessionStorage.
 */
const getSessionId = () => {
  let sessionId = sessionStorage.getItem('visitor_session_id');
  if (!sessionId) {
    sessionId = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
    sessionStorage.setItem('visitor_session_id', sessionId);
  }
  return sessionId;
};
