import React, { useEffect, useState } from 'react';
import * as api from '../services/api';
import './CrisisBanner.css';

export default function CrisisBanner() {
  const [resources, setResources] = useState([]);

  useEffect(() => {
    api
      .getGeoCountry()
      .then((response) => {
        const country = response.data?.country || 'International';
        return api.getCrisisResources(country);
      })
      .then((response) => {
        setResources(response.data.resources || []);
      })
      .catch(() => setResources([]));
  }, []);

  return (
    <div className="crisis-banner">
      <h3>Crisis Support</h3>
      <p>
        I'm concerned about what you've shared. Your safety is important. Please reach
        out to a crisis service or mental health professional immediately.
      </p>
      {resources.length > 0 && (
        <div className="crisis-resources">
          {resources.slice(0, 2).map((resource, idx) => (
            <div key={idx} className="crisis-resource-item">
              <strong>{resource.name}</strong>
              {resource.phone !== 'N/A' && <span>Call {resource.phone}</span>}
              {resource.text !== 'N/A' && <span>Text {resource.text}</span>}
            </div>
          ))}
        </div>
      )}
      <div className="crisis-banner-actions">
        <button
          className="btn btn-primary"
          onClick={() => window.dispatchEvent(new CustomEvent('open-crisis-modal'))}
        >
          Get help now
        </button>
        <button className="btn btn-secondary" onClick={() => {
          window.location.href = '/crisis';
        }}>View Resources</button>
      </div>
    </div>
  );
}
