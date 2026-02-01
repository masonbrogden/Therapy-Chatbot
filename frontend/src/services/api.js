import axios from 'axios';
import { supabase } from '../lib/supabaseClient';

const RAW_API_URL =
  import.meta.env.VITE_API_BASE_URL ||
  import.meta.env.VITE_API_URL ||
  'http://127.0.0.1:8000/api';
const API_BASE_URL = RAW_API_URL.endsWith('/api') ? RAW_API_URL : `${RAW_API_URL}/api`;

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use(async (config) => {
  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response) {
      console.error('API error:', error.response.status, error.response.data);
    } else {
      console.error('Network error:', error.message, 'baseURL:', API_BASE_URL);
    }
    return Promise.reject(error);
  }
);

// Health check
export const healthCheck = async () => {
  try {
    const response = await api.get('/health');
    return response.data;
  } catch (error) {
    console.error('Health check failed:', error);
    return { status: 'error' };
  }
};

// Chat
export const createChatSession = (sessionId) =>
  api.post('/chat/session', { session_id: sessionId });

export const getChatSessions = (sessionId, params = {}) => {
  const query = { ...params };
  if (sessionId) {
    query.session_id = sessionId;
  }
  return api.get('/chat/sessions', { params: query });
};

export const getChatSession = (chatSessionId, sessionId = null) => {
  const query = {};
  if (sessionId) {
    query.session_id = sessionId;
  }
  return api.get(`/chat/session/${chatSessionId}`, { params: query });
};

export const renameChatSession = (chatSessionId, title) =>
  api.put(`/chat/session/${chatSessionId}/title`, { title });

export const exportChatSession = (chatSessionId, format = 'json') =>
  api.get(`/chat/session/${chatSessionId}/export`, { params: { format } });

export const sendChatMessage = (sessionId, chatSessionId, message, language = 'en') =>
  api.post('/chat/message', {
    session_id: sessionId,
    chat_session_id: chatSessionId,
    role: 'user',
    message,
    language,
  });

export const deleteChatSession = (chatSessionId, sessionId) =>
  api.delete(`/chat/session/${chatSessionId}`, { params: { session_id: sessionId } });

export const deleteAllChatSessions = (sessionId) =>
  api.delete('/chat/sessions', { params: { session_id: sessionId } });

// Chat Profile
export const getChatProfile = () => api.get('/chat-profile');

export const updateChatProfile = (profileData) =>
  api.put('/chat-profile', profileData);

// Mood
export const createMoodEntry = (sessionId, moodScore, tags = [], note = '') =>
  api.post('/mood/today', {
    session_id: sessionId,
    mood_score: moodScore,
    tags,
    note,
  });

export const getMoodEntries = (sessionId, params = {}) =>
  api.get('/mood', { params: { session_id: sessionId, ...params } });

export const getMoodSummary = (sessionId, params = {}) =>
  api.get('/mood/summary', { params: { session_id: sessionId, ...params } });

export const deleteMoodEntries = (sessionId) =>
  api.delete('/mood', { params: { session_id: sessionId } });

// Therapy Plan
export const getTherapyProfile = (sessionId) =>
  api.get('/profile', { params: { session_id: sessionId } });

export const upsertTherapyProfile = (sessionId, profileData) =>
  api.post('/profile', { session_id: sessionId, ...profileData });

export const generateTherapyPlan = (sessionId) =>
  api.post('/plan/generate', { session_id: sessionId });

export const getLatestTherapyPlan = (sessionId) =>
  api.get('/plan', { params: { session_id: sessionId } });

export const getPlanHistory = () => api.get('/plan/history');

export const updatePlanCompletion = (planId, dayIndex, completed) =>
  api.put('/plan/complete', { plan_id: planId, day_index: dayIndex, completed });

// Safety Check
export const checkSafety = (text) => api.post('/safety/check', { text });

// Crisis Resources
export const getCrisisResources = (country = 'US') =>
  api.get('/crisis-resources', { params: { country } });

export const getGeoCountry = () => api.get('/geo-country');

// Exercises
export const getAllExercises = () => api.get('/exercises');

export const getExerciseDetail = (slug) => api.get(`/exercises/${slug}`);

export const completeExercise = (slug, sessionId) =>
  api.post('/exercises/complete', { slug, session_id: sessionId });

export const getExerciseProgress = () => api.get('/exercises/progress');

export const getGuidedExerciseStep = (slug, stepIndex, mode = 'scripted') =>
  api.post('/exercises/guided', {
    slug,
    step_index: stepIndex,
    mode,
  });

// Journal
export const createJournalEntry = (payload) => api.post('/journal/entries', payload);

export const getJournalEntries = (params = {}) =>
  api.get('/journal/entries', { params });

export const getJournalEntry = (entryId) => api.get(`/journal/entries/${entryId}`);

export const updateJournalEntry = (entryId, payload) =>
  api.put(`/journal/entries/${entryId}`, payload);

export const deleteJournalEntry = (entryId) =>
  api.delete(`/journal/entries/${entryId}`);

// Contact
export const submitContact = (sessionId, contactData) =>
  api.post('/contact', { session_id: sessionId, ...contactData });

// User
export const attachSession = (sessionId) =>
  api.post('/user/attach-session', { session_id: sessionId });

export const getUserProfile = () => api.get('/user/profile');

export const updateUserProfile = (profileData) =>
  api.put('/user/profile', profileData);

// Data
export const exportUserData = (sessionId) =>
  api.get('/export', { params: { session_id: sessionId } });

export const deleteAllUserData = (sessionId) =>
  api.delete('/data', { params: { session_id: sessionId } });

export default api;
