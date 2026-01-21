/**
 * Session utility: get or create anonymous session_id in localStorage
 */

const SESSION_KEY = 'therapy_chatbot_session_id';

export function getSessionId() {
  let sessionId = localStorage.getItem(SESSION_KEY);
  
  if (!sessionId) {
    // Generate new session ID
    sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    localStorage.setItem(SESSION_KEY, sessionId);
  }
  
  return sessionId;
}

export function clearSessionId() {
  localStorage.removeItem(SESSION_KEY);
}
