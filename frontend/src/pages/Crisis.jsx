import React, { useState, useEffect } from 'react';
import Disclaimer from '../components/Disclaimer';
import LoadingSpinner from '../components/LoadingSpinner';
import * as api from '../services/api';
import './Crisis.css';

const COUNTRIES = ['US', 'UK', 'CA', 'AU', 'International'];

export default function Crisis() {
  const [country, setCountry] = useState('US');
  const [resources, setResources] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const locale = navigator.language || 'en-US';
    const fallback = locale.split('-')[1]?.toUpperCase() || 'US';
    api
      .getGeoCountry()
      .then((response) => {
        setCountry(response.data?.country || fallback);
      })
      .catch(() => setCountry(fallback));
  }, []);

  useEffect(() => {
    const loadResources = async () => {
      try {
        setLoading(true);
        const response = await api.getCrisisResources(country);
        setResources(response.data.resources);
      } catch (error) {
        console.error('Failed to load resources:', error);
      } finally {
        setLoading(false);
      }
    };
    loadResources();
  }, [country]);

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    alert('Copied to clipboard!');
  };

  return (
    <div className="crisis-container">
      <div className="crisis-emergency">
        <h1>Crisis Support</h1>
        <div className="emergency-banner">
          <strong>
            If you are in immediate danger, call emergency services or go to the nearest hospital.
          </strong>
        </div>
      </div>

      <Disclaimer />

      <div className="resources-section">
        <label htmlFor="country-select">Select your country:</label>
        <select
          id="country-select"
          value={country}
          onChange={(e) => setCountry(e.target.value)}
        >
          {COUNTRIES.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
      </div>

      <div className="crisis-actions">
        <button onClick={() => window.dispatchEvent(new CustomEvent('open-crisis-modal'))}>
          Get help now
        </button>
        <a href="tel:988">Call 988 (US)</a>
        <a href="https://findahelpline.com/" target="_blank" rel="noreferrer">
          Find local resources
        </a>
      </div>

      {loading ? (
        <LoadingSpinner />
      ) : resources.length === 0 ? (
        <p className="crisis-empty">No resources found. Try another region.</p>
      ) : (
        <div className="resources-grid">
          {resources.map((resource, idx) => (
            <div key={idx} className="resource-card">
              <h3>{resource.name}</h3>
              <div className="resource-details">
                {resource.phone !== 'N/A' && (
                  <div className="resource-item">
                    <strong>Phone:</strong>
                    <p>{resource.phone}</p>
                    <button
                      onClick={() => copyToClipboard(resource.phone)}
                      className="btn-copy"
                    >
                      Copy
                    </button>
                  </div>
                )}
                {resource.text !== 'N/A' && (
                  <div className="resource-item">
                    <strong>Text:</strong>
                    <p>{resource.text}</p>
                    <button
                      onClick={() => copyToClipboard(resource.text)}
                      className="btn-copy"
                    >
                      Copy
                    </button>
                  </div>
                )}
                {resource.link !== 'N/A' && (
                  <a
                    href={resource.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn-link"
                  >
                    Visit Website
                  </a>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="crisis-tips">
        <h2>What the chatbot can and cannot do</h2>
        <p>
          I can offer grounding techniques and supportive conversation, but I am not a
          licensed therapist or emergency service. If you feel unsafe, please reach out
          to a trained professional right away.
        </p>
      </div>

      <div className="crisis-tips">
        <h2>Coping Strategies</h2>
        <ul>
          <li>Reach out to a trusted friend or family member</li>
          <li>Practice the 5-4-3-2-1 grounding technique from Exercises</li>
          <li>Use box breathing to calm your nervous system</li>
          <li>Remove yourself from the immediate triggering situation if safe</li>
          <li>Call a crisis helpline and speak with a trained counselor</li>
          <li>If you have a therapist or doctor, contact them</li>
        </ul>
      </div>
    </div>
  );
}
