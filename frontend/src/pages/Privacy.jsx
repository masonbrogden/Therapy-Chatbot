import React, { useState } from 'react';
import * as api from '../services/api';
import { getSessionId, clearSessionId } from '../utils/session';
import './Privacy.css';

export default function Privacy() {
  const sessionId = getSessionId();
  const [exported, setExported] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleExport = async () => {
    try {
      setLoading(true);
      const response = await api.exportUserData(sessionId);

      const element = document.createElement('a');
      const file = new Blob([JSON.stringify(response.data, null, 2)], {
        type: 'application/json',
      });
      element.href = URL.createObjectURL(file);
      element.download = `echomind-export-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(element);
      element.click();
      document.body.removeChild(element);

      setExported(true);
      setTimeout(() => setExported(false), 3000);
    } catch (error) {
      console.error('Failed to export data:', error);
      alert('Failed to export data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteAll = async () => {
    if (
      window.confirm(
        'WARNING: This will permanently delete ALL your data (chat history, mood entries, profile, etc.). This cannot be undone. Are you sure?'
      )
    ) {
      if (window.confirm('This is your final warning. Type \"DELETE\" to confirm.')) {
        try {
          setLoading(true);
          await api.deleteAllUserData(sessionId);
          clearSessionId();
          alert('All your data has been deleted. Your session has been reset.');
          window.location.reload();
        } catch (error) {
          console.error('Failed to delete data:', error);
          alert('Failed to delete data. Please try again.');
        } finally {
          setLoading(false);
        }
      }
    }
  };

  return (
    <div className="privacy-container">
      <h1>Privacy & Data Management</h1>
      <p>You own your data. Manage it here.</p>

      <div className="data-section">
        <h2>Export Your Data</h2>
        <p>Download all your data as a JSON file. This includes:</p>
        <ul>
          <li>Chat history and sessions</li>
          <li>Mood entries and trends</li>
          <li>Therapy profile and plans</li>
          <li>Contact messages</li>
        </ul>

        {exported && <div className="success-banner">Data exported successfully!</div>}

        <button onClick={handleExport} disabled={loading} className="btn-export">
          {loading ? 'Exporting...' : 'Download My Data'}
        </button>
      </div>

      <div className="data-section danger">
        <h2>Delete Your Data</h2>
        <p>Permanently delete all data associated with your session. This cannot be undone.</p>
        <p className="warning-text">
          Once deleted, your chat history, mood entries, plans, and all other data will be permanently removed.
        </p>

        <button onClick={handleDeleteAll} disabled={loading} className="btn-delete">
          {loading ? 'Deleting...' : 'Delete All Data'}
        </button>
      </div>

      <div className="privacy-policy">
        <h2>Privacy Policy</h2>
        <p>
          <strong>Your Privacy Matters:</strong> All data is stored locally in your browser/server. We
          do not share your data with third parties. You have full control to export or delete at any time.
        </p>

        <h3>Data Collection</h3>
        <ul>
          <li>Chat messages and history</li>
          <li>Mood check-in entries</li>
          <li>Therapy profile information</li>
          <li>Contact form submissions</li>
          <li>Anonymous session ID (no personal identification)</li>
        </ul>

        <h3>Data Security</h3>
        <ul>
          <li>Data is stored in a local SQLite database</li>
          <li>No data is transmitted to external servers (except for LLM API if configured)</li>
          <li>CORS is configured to prevent unauthorized access</li>
        </ul>

        <h3>Your Rights</h3>
        <ul>
          <li><strong>Access:</strong> Export your data anytime</li>
          <li><strong>Delete:</strong> Permanently delete all data</li>
          <li><strong>Control:</strong> You own and control all your information</li>
        </ul>

        <h3>Disclaimer</h3>
        <p>
          This is a supportive AI chatbot, <strong>not a substitute for professional mental health care</strong>.
          If you are experiencing a crisis, please contact emergency services or a mental health professional
          immediately.
        </p>
      </div>
    </div>
  );
}
