import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import CrisisModal from './CrisisModal';
import './CrisisFloatingBtn.css';

export default function CrisisFloatingBtn() {
  const [open, setOpen] = useState(false);
  const [isCrisisWidgetVisible, setIsCrisisWidgetVisible] = useState(true);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const handler = () => setOpen(true);
    window.addEventListener('open-crisis-modal', handler);
    return () => window.removeEventListener('open-crisis-modal', handler);
  }, []);

  const handleCrisisClick = () => {
    navigate('/crisis');
    setOpen(false);
    setConfirmOpen(false);
  };

  if (!isCrisisWidgetVisible) {
    return null;
  }

  return (
    <div className="crisis-floating-container">
      <CrisisModal open={open} onClose={() => setOpen(false)} />
      <button
        className="crisis-floating-dismiss"
        onClick={() => setIsCrisisWidgetVisible(false)}
        aria-label="Dismiss crisis support"
        type="button"
      >
        ×
      </button>
      <button
        className="crisis-floating-btn"
        onClick={() => setOpen(true)}
        aria-label="Need help now?"
        type="button"
      >
        Need Help Now?
      </button>
      <button
        className="crisis-floating-link"
        onClick={() => setConfirmOpen(true)}
        type="button"
      >
        Crisis Support
      </button>
      {confirmOpen ? (
        <div className="crisis-confirm-overlay" role="dialog" aria-modal="true">
          <div className="crisis-confirm-card">
            <h3>Open Crisis Support?</h3>
            <p>
              You are about to view crisis resources. Continue when you are ready.
            </p>
            <div className="crisis-confirm-actions">
              <button type="button" onClick={handleCrisisClick}>
                Continue
              </button>
              <button type="button" className="ghost" onClick={() => setConfirmOpen(false)}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
