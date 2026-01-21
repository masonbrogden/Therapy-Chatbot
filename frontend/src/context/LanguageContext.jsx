import React, { createContext, useEffect, useState, useContext } from 'react';
import { useAuth } from './AuthContext';
import { getUserProfile, updateUserProfile } from '../services/api';

const LanguageContext = createContext();

export function LanguageProvider({ children }) {
  const { user } = useAuth();
  const [language, setLanguage] = useState(() => {
    return localStorage.getItem('therapy_chatbot_language') || 'en';
  });

  const changeLanguage = (lang) => {
    setLanguage(lang);
    localStorage.setItem('therapy_chatbot_language', lang);
    if (user) {
      updateUserProfile({ preferred_language: lang }).catch(() => {});
    }
  };

  useEffect(() => {
    if (!user) return;
    getUserProfile()
      .then((response) => {
        const lang = response.data?.preferred_language;
        if (lang) {
          setLanguage(lang);
          localStorage.setItem('therapy_chatbot_language', lang);
        }
      })
      .catch(() => {});
  }, [user]);

  return (
    <LanguageContext.Provider value={{ language, changeLanguage }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within LanguageProvider');
  }
  return context;
}
