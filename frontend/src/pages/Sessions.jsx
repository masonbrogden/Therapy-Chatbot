import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import * as api from '../services/api';
import './Sessions.css';

export default function Sessions() {
  const navigate = useNavigate();
  const [sessions, setSessions] = useState([]);
  const [query, setQuery] = useState('');
  const [selected, setSelected] = useState(null);
  const [titleInput, setTitleInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const loadSessions = async (search = '') => {
    setLoading(true);
    setError('');
    try {
      const response = await api.getChatSessions(null, { q: search });
      setSessions(response.data);
      setSelected(null);
    } catch (err) {
      setError('Unable to load sessions. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const openSession = async (sessionId) => {
    setLoading(true);
    setError('');
    try {
      const response = await api.getChatSession(sessionId);
      setSelected(response.data);
      setTitleInput(response.data.session.title || '');
    } catch (err) {
      setError('Unable to load session details.');
    } finally {
      setLoading(false);
    }
  };

  const saveTitle = async () => {
    if (!selected?.session?.id || !titleInput.trim()) return;
    try {
      const response = await api.renameChatSession(selected.session.id, titleInput.trim());
      setSelected((prev) => ({ ...prev, session: response.data }));
      loadSessions(query);
    } catch (err) {
      setError('Unable to rename this session.');
    }
  };

  const exportSession = async (sessionId, format) => {
    try {
      const response = await api.exportChatSession(sessionId, format);
      if (format === 'json') {
        const blob = new Blob([JSON.stringify(response.data, null, 2)], {
          type: 'application/json',
        });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `chat-session-${sessionId}.json`;
        link.click();
        URL.revokeObjectURL(url);
      } else {
        const win = window.open('', '_blank');
        win.document.write(response.data);
        win.document.close();
      }
    } catch (err) {
      setError('Unable to export this session.');
    }
  };

  useEffect(() => {
    loadSessions();
  }, []);

  return (
    <div className="sessions-container">
      <div className="sessions-header">
        <h1>Past Sessions</h1>
        <p>Search and resume conversations, or export a session for your records.</p>
      </div>

      <div className="sessions-search">
        <input
          type="text"
          placeholder="Search by title or keyword"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          aria-label="Search sessions"
        />
        <button onClick={() => loadSessions(query)}>Search</button>
      </div>

      {loading && <p className="sessions-state">Loading sessions...</p>}
      {error && <p className="sessions-state error">{error}</p>}

      {!loading && sessions.length === 0 && (
        <p className="sessions-state">No sessions yet. Start a chat to create one.</p>
      )}

      <div className="sessions-grid">
        <div className="sessions-list">
          {sessions.map((session) => (
            <button
              key={session.id}
              className={`session-card ${selected?.session?.id === session.id ? 'active' : ''}`}
              onClick={() => openSession(session.id)}
            >
              <h3>{session.title}</h3>
              <p>{session.message_count} messages</p>
            </button>
          ))}
        </div>

        <div className="sessions-detail">
          {selected ? (
            <>
              <div className="session-title-edit">
                <input
                  type="text"
                  value={titleInput}
                  onChange={(e) => setTitleInput(e.target.value)}
                  aria-label="Session title"
                />
                <button onClick={saveTitle}>Save</button>
              </div>
              <div className="session-actions">
                <button onClick={() => navigate(`/?session=${selected.session.id}`)}>
                  Continue this session
                </button>
                <button onClick={() => exportSession(selected.session.id, 'json')}>
                  Export JSON
                </button>
                <button onClick={() => exportSession(selected.session.id, 'html')}>
                  Export Printable
                </button>
              </div>
              <div className="session-transcript">
                {selected.messages.map((msg, idx) => (
                  <div key={idx} className={`transcript-item ${msg.role}`}>
                    <strong>{msg.role}:</strong> {msg.content}
                  </div>
                ))}
              </div>
            </>
          ) : (
            <p className="sessions-state">Select a session to view details.</p>
          )}
        </div>
      </div>
    </div>
  );
}
