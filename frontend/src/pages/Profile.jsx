import React, { useEffect, useState } from 'react';
import { useLanguage } from '../context/LanguageContext';
import * as api from '../services/api';
import './Profile.css';

export default function Profile() {
  const { language, changeLanguage } = useLanguage();
  const [formData, setFormData] = useState({
    display_name: '',
    preferred_language: language,
    therapy_preferences: '',
    notification_prefs: '',
  });
  const [status, setStatus] = useState({ loading: true, error: '', success: '' });

  useEffect(() => {
    const loadProfile = async () => {
      setStatus({ loading: true, error: '', success: '' });
      try {
        const response = await api.getUserProfile();
        const profile = response.data || {};
        setFormData({
          display_name: profile.display_name || '',
          preferred_language: profile.preferred_language || language,
          therapy_preferences: JSON.stringify(profile.therapy_preferences || {}, null, 2),
          notification_prefs: JSON.stringify(profile.notification_prefs || {}, null, 2),
        });
      } catch (err) {
        setStatus({ loading: false, error: 'Unable to load profile.', success: '' });
        return;
      }
      setStatus({ loading: false, error: '', success: '' });
    };
    loadProfile();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (name === 'preferred_language') {
      changeLanguage(value);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus({ loading: false, error: '', success: '' });
    try {
      const therapy_preferences = formData.therapy_preferences
        ? JSON.parse(formData.therapy_preferences)
        : {};
      const notification_prefs = formData.notification_prefs
        ? JSON.parse(formData.notification_prefs)
        : {};

      await api.updateUserProfile({
        display_name: formData.display_name,
        preferred_language: formData.preferred_language,
        therapy_preferences,
        notification_prefs,
      });

      setStatus({ loading: false, error: '', success: 'Profile updated.' });
    } catch (err) {
      setStatus({
        loading: false,
        error: 'Failed to save profile. Make sure JSON fields are valid.',
        success: '',
      });
    }
  };

  if (status.loading) {
    return <div className="profile-container">Loading profile...</div>;
  }

  return (
    <div className="profile-container">
      <h1>Your Profile</h1>
      <p>Update your preferences so the chatbot can personalize your experience.</p>

      <form className="profile-form" onSubmit={handleSubmit}>
        <label htmlFor="display_name">Name</label>
        <input
          id="display_name"
          name="display_name"
          type="text"
          value={formData.display_name}
          onChange={handleChange}
          placeholder="Your name"
        />

        <label htmlFor="preferred_language">Preferred Language</label>
        <select
          id="preferred_language"
          name="preferred_language"
          value={formData.preferred_language}
          onChange={handleChange}
        >
          <option value="en">English</option>
          <option value="es">Espanol</option>
          <option value="fr">Francais</option>
          <option value="de">Deutsch</option>
        </select>

        <label htmlFor="therapy_preferences">Therapy Style Preferences (JSON)</label>
        <textarea
          id="therapy_preferences"
          name="therapy_preferences"
          rows="4"
          value={formData.therapy_preferences}
          onChange={handleChange}
        />

        <label htmlFor="notification_prefs">Notification Preferences (JSON)</label>
        <textarea
          id="notification_prefs"
          name="notification_prefs"
          rows="4"
          value={formData.notification_prefs}
          onChange={handleChange}
        />

        {status.error && <p className="profile-error">{status.error}</p>}
        {status.success && <p className="profile-success">{status.success}</p>}

        <button type="submit">Save Profile</button>
      </form>
    </div>
  );
}
