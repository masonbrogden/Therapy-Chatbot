import React, { useState } from 'react';
import * as api from '../services/api';
import { getSessionId } from '../utils/session';
import './Contact.css';

export default function Contact() {
  const sessionId = getSessionId();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    category: 'feedback',
    company: '',
    message: '',
  });
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      await api.submitContact(sessionId, formData);
      setSubmitted(true);
      setTimeout(() => {
        setFormData({ name: '', email: '', category: 'feedback', company: '', message: '' });
        setSubmitted(false);
      }, 3000);
    } catch (error) {
      console.error('Failed to submit contact:', error);
      alert('Failed to submit. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="contact-container">
      <h1>Contact & Support</h1>
      <p>Have feedback or need general support? Reach out to us.</p>

      {submitted ? (
        <div className="success-message">
          <h2>Thank you!</h2>
          <p>We've received your message and will review it soon.</p>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="contact-form">
          <div className="form-group">
            <label htmlFor="name">Name (Optional)</label>
            <input
              id="name"
              name="name"
              type="text"
              value={formData.name}
              onChange={handleInputChange}
              placeholder="Your name"
            />
          </div>

          <div className="form-group">
            <label htmlFor="email">Email*</label>
            <input
              id="email"
              name="email"
              type="email"
              value={formData.email}
              onChange={handleInputChange}
              placeholder="your@email.com"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="category">Category*</label>
            <select
              id="category"
              name="category"
              value={formData.category}
              onChange={handleInputChange}
            >
              <option value="feedback">Feedback</option>
              <option value="bug">Report a Bug</option>
              <option value="feature">Feature Request</option>
              <option value="general">General Support</option>
            </select>
          </div>

          <input
            type="text"
            name="company"
            value={formData.company}
            onChange={handleInputChange}
            className="honeypot"
            autoComplete="off"
            tabIndex="-1"
            aria-hidden="true"
          />

          <div className="form-group">
            <label htmlFor="message">Message*</label>
            <textarea
              id="message"
              name="message"
              value={formData.message}
              onChange={handleInputChange}
              placeholder="Please tell us more..."
              rows="5"
              required
            />
            <small>{formData.message.length}/2000</small>
          </div>

          <button type="submit" disabled={loading} className="btn-submit">
            {loading ? 'Sending...' : 'Send Message'}
          </button>
        </form>
      )}

      <p className="contact-response-note">
        Response time: we typically reply within 2-3 business days.
      </p>

      <div className="contact-faq">
        <h2>Frequently Asked Questions</h2>
        <details className="faq-item">
          <summary>Is this a real therapist?</summary>
          <p>No, this is an AI-powered supportive chatbot, not a substitute for licensed therapy.</p>
        </details>
        <details className="faq-item">
          <summary>What happens to my data?</summary>
          <p>Your data is stored securely and is yours. You can export or delete it anytime from the Privacy page.</p>
        </details>
        <details className="faq-item">
          <summary>Is this free?</summary>
          <p>Yes, this tool is free to use for everyone seeking support.</p>
        </details>
      </div>
    </div>
  );
}
