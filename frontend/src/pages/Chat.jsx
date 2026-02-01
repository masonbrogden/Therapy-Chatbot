import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import Disclaimer from '../components/Disclaimer';
import CrisisBanner from '../components/CrisisBanner';
import LoadingSpinner from '../components/LoadingSpinner';
import * as api from '../services/api';
import { getSessionId } from '../utils/session';
import { useLanguage } from '../context/LanguageContext';
import { getCachedChatProfile, normalizeChatProfile, setCachedChatProfile } from '../utils/chatProfile';
import './Chat.css';

export default function Chat({ chatProfile: initialProfile = null }) {
  const { language } = useLanguage();
  const sessionId = getSessionId();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const [chatSessions, setChatSessions] = useState([]);
  const [currentSession, setCurrentSession] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [crisisMode, setCrisisMode] = useState(false);
  const [error, setError] = useState('');
  const [chatProfile, setChatProfile] = useState(initialProfile);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    loadSessions();
  }, []);

  useEffect(() => {
    const cached = getCachedChatProfile();
    if (cached && !chatProfile) {
      setChatProfile(cached);
    }
    const loadProfile = async () => {
      try {
        const response = await api.getChatProfile();
        const profile = normalizeChatProfile(response.data || {});
        setCachedChatProfile(profile);
        setChatProfile(profile);
      } catch (err) {
        // Ignore profile errors in chat view.
      }
    };
    loadProfile();
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    inputRef.current?.focus();
  }, [currentSession]);

  const loadSessions = async () => {
    try {
      setError('');
      const response = await api.getChatSessions(sessionId);
      setChatSessions(response.data);
      const preferredSession = parseInt(searchParams.get('session'), 10);
      if (response.data.length === 0) {
        createNewSession();
      } else if (preferredSession) {
        openSession(preferredSession);
      } else {
        openSession(response.data[0].id);
      }
    } catch (err) {
      console.error('Failed to load sessions:', err);
      setError('Unable to load sessions.');
      createNewSession();
    }
  };

  const createNewSession = async () => {
    try {
      const response = await api.createChatSession(sessionId);
      setChatSessions((prev) => [response.data, ...prev]);
      setCurrentSession(response.data.id);
      setMessages([]);
      setCrisisMode(false);
    } catch (err) {
      console.error('Failed to create session:', err);
    }
  };

  const openSession = async (sessionIdInternal) => {
    try {
      setError('');
      const response = await api.getChatSession(sessionIdInternal, sessionId);
      setCurrentSession(sessionIdInternal);
      setMessages(response.data.messages);
      setCrisisMode(false);
    } catch (err) {
      console.error('Failed to load session:', err);
      setError('Unable to open this session.');
    }
  };

  const sendMessage = async (e) => {
    e.preventDefault();
    if (!input.trim() || loading) return;

    const userMessage = input;
    setInput('');
    setLoading(true);

    try {
      let activeSession = currentSession;
      if (!activeSession) {
        const response = await api.createChatSession(sessionId);
        setChatSessions((prev) => [response.data, ...prev]);
        activeSession = response.data.id;
        setCurrentSession(activeSession);
        setMessages([]);
        setCrisisMode(false);
      }

      const response = await api.sendChatMessage(
        sessionId,
        activeSession,
        userMessage,
        language
      );

      setMessages((prev) => [
        ...prev,
        { role: 'user', content: userMessage, created_at: new Date().toISOString() },
        { role: 'assistant', content: response.data.bot_response, created_at: new Date().toISOString() },
      ]);

      setCrisisMode(response.data.crisis_mode);
    } catch (err) {
      console.error('Failed to send message:', err);
      setError('Message failed to send. Please try again.');
      setInput(userMessage);
    } finally {
      setLoading(false);
      inputRef.current?.focus();
    }
  };

  const deleteSession = async (id) => {
    try {
      await api.deleteChatSession(id, sessionId);
      setChatSessions((prev) => prev.filter((s) => s.id !== id));
      if (currentSession === id) {
        createNewSession();
      }
    } catch (err) {
      console.error('Failed to delete session:', err);
    }
  };

  return (
    <div className="chat-container">
      <Disclaimer />

      {crisisMode && <CrisisBanner />}

      <div className="chat-layout">
        <aside className="chat-sidebar">
          <button
            onClick={() => navigate('/chat/onboarding')}
            className="btn-preferences"
          >
            Edit Chat Preferences
          </button>
          <button onClick={createNewSession} className="btn-new-chat">+ New Chat</button>

          <div className="sessions-list">
            <h3>Past Sessions</h3>
            {chatSessions.map((session) => (
              <div
                key={session.id}
                className={`session-item ${currentSession === session.id ? 'active' : ''}`}
              >
                <button
                  onClick={() => openSession(session.id)}
                  className="session-title"
                >
                  {session.title}
                </button>
                <button
                  onClick={() => deleteSession(session.id)}
                  className="btn-delete"
                  title="Delete"
                >
                  X
                </button>
              </div>
            ))}
          </div>

          {chatSessions.length > 0 && (
            <button
              onClick={() => api.deleteAllChatSessions(sessionId).then(loadSessions)}
              className="btn-delete-all"
            >
              Delete All Sessions
            </button>
          )}
        </aside>

        <div className="chat-main">
          <div className="chat-language">
            Responding in: {language.toUpperCase()}
          </div>
          <div className="messages-container">
            {error && <div className="chat-error">{error}</div>}
            {messages.length === 0 ? (
              <div className="empty-state">
                <img className="empty-logo" src="/logo.png" alt="EchoMind logo" />
                <h2>
                  {chatProfile?.displayName
                    ? `Hey ${chatProfile.displayName}, what can I help you with today?`
                    : 'Hey, what can I help you with today?'}
                </h2>
                <p>Start a conversation. I'm here to listen and support you.</p>
              </div>
            ) : (
              messages.map((msg, idx) => (
                <div key={idx} className={`message ${msg.role}`}>
                  <div className="message-content">{msg.content}</div>
                  <small className="message-time">
                    {new Date(msg.created_at).toLocaleTimeString()}
                  </small>
                </div>
              ))
            )}
            {loading && <LoadingSpinner />}
            <div ref={messagesEndRef} />
          </div>

          <form onSubmit={sendMessage} className="message-form">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Type your message..."
              disabled={loading}
              ref={inputRef}
            />
            <button type="submit" disabled={loading}>
              Send
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
