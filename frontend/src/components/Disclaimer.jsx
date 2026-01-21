import React from 'react';
import './Disclaimer.css';

export default function Disclaimer() {
  return (
    <div className="disclaimer">
      <div className="disclaimer-content">
        <h3>Important Disclaimer</h3>
        <p>
          This chatbot is <strong>not a substitute for professional mental health care</strong>.
          I am a supportive AI assistant, not a licensed therapist. If you are experiencing a
          mental health crisis, suicidal thoughts, or self-harm urges, please{' '}
          <strong>contact emergency services or a mental health professional immediately</strong>.
        </p>
        <p>
          If you need immediate help, visit the <strong>Crisis Support</strong> page for hotline
          numbers and resources.
        </p>
      </div>
    </div>
  );
}
