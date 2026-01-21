import React, { useEffect, useState } from 'react';
import * as api from '../services/api';
import './CrisisModal.css';

const COUNTRY_OPTIONS = ['US', 'UK', 'CA', 'AU', 'International'];

const detectCountry = () => {
  const locale = navigator.language || 'en-US';
  const code = locale.split('-')[1];
  if (!code) return 'US';
  const upper = code.toUpperCase();
  if (COUNTRY_OPTIONS.includes(upper)) return upper;
  return 'International';
};

export default function CrisisModal({ open, onClose }) {
  const [country, setCountry] = useState('US');
  const [resources, setResources] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open) return;
    const fallback = detectCountry();
    api
      .getGeoCountry()
      .then((response) => {
        setCountry(response.data?.country || fallback);
      })
      .catch(() => setCountry(fallback));
  }, [open]);

  useEffect(() => {
    if (!open) return;
    setLoading(true);
    api
      .getCrisisResources(country)
      .then((response) => {
        setResources(response.data.resources || []);
      })
      .catch(() => {
        setResources([]);
      })
      .finally(() => setLoading(false));
  }, [open, country]);

  if (!open) return null;

  return (
    <div className="crisis-modal-overlay" role="dialog" aria-modal="true">
      <div className="crisis-modal">
        <div className="crisis-modal-header">
          <h2>Need help now?</h2>
          <button onClick={onClose} aria-label="Close crisis resources">
            Close
          </button>
        </div>

        <p className="crisis-modal-disclaimer">
          If you or someone else is in immediate danger, call local emergency services.
        </p>

        <label htmlFor="crisis-country">Your region</label>
        <select
          id="crisis-country"
          value={country}
          onChange={(e) => setCountry(e.target.value)}
        >
          {COUNTRY_OPTIONS.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>

        {loading ? (
          <p className="crisis-modal-state">Loading resources...</p>
        ) : resources.length ? (
          <div className="crisis-modal-list">
            {resources.map((resource, idx) => (
              <div key={idx} className="crisis-modal-card">
                <h3>{resource.name}</h3>
                {resource.phone !== 'N/A' && <p>Call: {resource.phone}</p>}
                {resource.text !== 'N/A' && <p>Text: {resource.text}</p>}
                {resource.link !== 'N/A' && (
                  <a href={resource.link} target="_blank" rel="noreferrer">
                    Visit website
                  </a>
                )}
              </div>
            ))}
          </div>
        ) : (
          <p className="crisis-modal-state">No resources found for this region.</p>
        )}
      </div>
    </div>
  );
}
