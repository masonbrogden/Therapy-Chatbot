import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import CrisisModal from './CrisisModal';
import './CrisisFloatingBtn.css';

export default function CrisisFloatingBtn() {
  const [open, setOpen] = useState(false);
  const [isCrisisWidgetVisible, setIsCrisisWidgetVisible] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const handler = () => setOpen(true);
    window.addEventListener('open-crisis-modal', handler);
    return () => window.removeEventListener('open-crisis-modal', handler);
  }, []);

  const handleCrisisClick = () => {
    navigate('/crisis');
    setOpen(false);
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
        onClick={handleCrisisClick}
        type="button"
      >
        Crisis Support
      </button>
    </div>
  );
}
