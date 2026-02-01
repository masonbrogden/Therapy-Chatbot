import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import * as api from '../services/api';
import Chat from '../pages/Chat';
import { getCachedChatProfile, normalizeChatProfile, setCachedChatProfile } from '../utils/chatProfile';

export default function ChatGate() {
  const navigate = useNavigate();
  const [state, setState] = useState({ loading: true, profile: null });

  useEffect(() => {
    let active = true;
    const cached = getCachedChatProfile();
    if (cached) {
      setState((prev) => ({ ...prev, profile: cached }));
    }

    const loadProfile = async () => {
      try {
        const response = await api.getChatProfile();
        const profile = normalizeChatProfile(response.data || {});
        setCachedChatProfile(profile);
        if (!profile.onboardingCompleted) {
          navigate('/chat/onboarding', { replace: true });
          return;
        }
        if (active) {
          setState({ loading: false, profile });
        }
      } catch (error) {
        if (cached?.onboardingCompleted) {
          setState({ loading: false, profile: cached });
        } else {
          navigate('/chat/onboarding', { replace: true });
        }
      }
    };

    loadProfile();
    return () => {
      active = false;
    };
  }, [navigate]);

  if (state.loading) {
    return <div className="page-loading">Loading chat...</div>;
  }

  return <Chat chatProfile={state.profile} />;
}
