const STORAGE_KEY = 'chatProfile';

export const getCachedChatProfile = () => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch (error) {
    return null;
  }
};

export const setCachedChatProfile = (profile) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(profile));
  } catch (error) {
    // Ignore cache failures.
  }
};

export const normalizeChatProfile = (data = {}) => ({
  displayName: data.display_name || '',
  tone: data.tone || '',
  goal: data.goal || '',
  focusArea: data.focus_area || '',
  responseLength: data.response_length || '',
  boundaries: data.boundaries || '',
  onboardingCompleted: Boolean(data.onboarding_completed),
  updatedAt: data.updated_at || '',
});
