import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  createJournalEntry,
  deleteJournalEntry,
  getJournalEntries,
  updateJournalEntry,
} from '../services/api';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabaseClient';
import SectionIntro from '../components/SectionIntro';
import './Journal.css';

const PROMPTS = [
  { group: 'Emotional check-in', text: 'What emotion feels strongest right now? Where do you feel it in your body?' },
  { group: 'Emotional check-in', text: 'What was the hardest moment today, and what helped you get through it?' },
  { group: 'Trigger tracking', text: 'Did anything trigger you today? What happened just before it?' },
  { group: 'Trigger tracking', text: 'What patterns have you noticed around your stress this week?' },
  { group: 'Self-compassion', text: 'If you spoke to yourself like a good friend, what would you say?' },
  { group: 'Self-compassion', text: 'What do you need most right now: rest, clarity, reassurance, or action?' },
  { group: 'Reflection', text: 'What did you learn about yourself today?' },
  { group: 'Reflection', text: 'What is one small win you can acknowledge from today?' },
  { group: 'Gratitude', text: 'List three things you are grateful for, no matter how small.' },
  { group: 'Gratitude', text: 'Who supported you recently, and how did it make you feel?' },
  { group: 'Values', text: 'Which of your values did you honor today? Which felt hard to honor?' },
  { group: 'Future focus', text: 'What is one kind thing you can do for yourself tomorrow?' },
];

const FREE_WRITE_PROMPT = 'Free write (no prompt)';

const MOODS = ['Calm', 'Anxious', 'Angry', 'Sad', 'Hopeful', 'Stressed', 'Grateful', 'Numb'];

const EXERCISE_SUGGESTIONS = {
  Calm: ['Gratitude Journaling', 'DBT Wise Mind Exercise'],
  Anxious: ['Box Breathing', '5-4-3-2-1 Grounding Technique'],
  Angry: ['DBT Wise Mind Exercise', 'Progressive Muscle Relaxation'],
  Sad: ['Gratitude Journaling', 'CBT Thought Reframe'],
  Hopeful: ['CBT Thought Reframe', 'Gratitude Journaling'],
  Stressed: ['Box Breathing', 'Progressive Muscle Relaxation'],
  Grateful: ['Gratitude Journaling'],
  Numb: ['5-4-3-2-1 Grounding Technique', 'DBT Wise Mind Exercise'],
};

const draftKeyFor = (uid) => `journalDraft:${uid || 'guest'}`;
const lockKeyFor = (uid) => `journalLock:${uid || 'guest'}`;

const getSummaryLabel = (entry) => {
  if (entry.title) return entry.title;
  const firstLine = (entry.content || '').split('\n').find((line) => line.trim());
  return firstLine ? firstLine.slice(0, 60) : 'Untitled entry';
};

const formatDate = (iso) => {
  if (!iso) return '';
  const date = new Date(iso);
  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
};

const getDayKey = (iso) => new Date(iso).toDateString();

export default function Journal() {
  const { user } = useAuth();
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState({ error: '', busy: false });
  const [mode, setMode] = useState('new');
  const [selectedEntry, setSelectedEntry] = useState(null);
  const [filters, setFilters] = useState({
    query: '',
    mood: 'All',
    startDate: '',
    endDate: '',
  });
  const [form, setForm] = useState({
    title: '',
    content: '',
    mood: '',
    triggersInput: '',
    triggers: [],
    promptUsed: '',
  });
  const [promptText, setPromptText] = useState('');
  const [draftStatus, setDraftStatus] = useState('Draft not saved');
  const [showReflection, setShowReflection] = useState(false);
  const [reflectionAnswers, setReflectionAnswers] = useState({
    feelDifferent: null,
    wantExercises: null,
  });
  const [lockEnabled, setLockEnabled] = useState(false);
  const [locked, setLocked] = useState(false);
  const [unlockPassword, setUnlockPassword] = useState('');
  const [unlockError, setUnlockError] = useState('');
  const [showUnlock, setShowUnlock] = useState(false);
  const [speechSupported, setSpeechSupported] = useState(false);
  const recognitionRef = useRef(null);

  useEffect(() => {
    setSpeechSupported(Boolean(window.SpeechRecognition || window.webkitSpeechRecognition));
  }, []);

  useEffect(() => {
    const uid = user?.id || 'guest';
    const savedLock = localStorage.getItem(lockKeyFor(uid));
    if (savedLock === 'enabled') {
      setLockEnabled(true);
      setLocked(true);
    }
  }, [user]);

  useEffect(() => {
    let active = true;
    const loadEntries = async () => {
      try {
        setLoading(true);
        const response = await getJournalEntries();
        if (!active) return;
        setEntries(response.data || []);
      } catch (error) {
        if (!active) return;
        setStatus({ error: 'Unable to load journal entries.', busy: false });
      } finally {
        if (active) setLoading(false);
      }
    };
    loadEntries();
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    const uid = user?.id || 'guest';
    const savedDraft = localStorage.getItem(draftKeyFor(uid));
    if (savedDraft && mode === 'new') {
      try {
        const parsed = JSON.parse(savedDraft);
        setForm((prev) => ({ ...prev, ...parsed }));
        setPromptText(parsed.promptText || '');
        setDraftStatus('Draft restored');
      } catch (error) {
        localStorage.removeItem(draftKeyFor(uid));
      }
    }
  }, [user, mode]);

  useEffect(() => {
    const uid = user?.id || 'guest';
    const interval = setInterval(() => {
      if (mode === 'view') return;
      const payload = {
        title: form.title,
        content: form.content,
        mood: form.mood,
        triggers: form.triggers,
        triggersInput: form.triggersInput,
        promptUsed: form.promptUsed,
        promptText,
      };
      localStorage.setItem(draftKeyFor(uid), JSON.stringify(payload));
      setDraftStatus('Draft saved');
    }, 4000);
    return () => clearInterval(interval);
  }, [form, promptText, mode, user]);

  const filteredEntries = useMemo(() => {
    return entries.filter((entry) => {
      if (filters.mood !== 'All' && entry.mood !== filters.mood) return false;
      if (filters.query) {
        const q = filters.query.toLowerCase();
        const text = `${entry.title || ''} ${entry.content || ''}`.toLowerCase();
        if (!text.includes(q)) return false;
      }
      if (filters.startDate) {
        if (new Date(entry.created_at) < new Date(filters.startDate)) return false;
      }
      if (filters.endDate) {
        const end = new Date(filters.endDate);
        end.setHours(23, 59, 59, 999);
        if (new Date(entry.created_at) > end) return false;
      }
      return true;
    });
  }, [entries, filters]);

  const weeklyStats = useMemo(() => {
    const now = new Date();
    const weekStart = new Date();
    weekStart.setDate(now.getDate() - 6);
    const weekEntries = entries.filter(
      (entry) => new Date(entry.created_at) >= weekStart
    );
    const moodCounts = weekEntries.reduce((acc, entry) => {
      if (entry.mood) acc[entry.mood] = (acc[entry.mood] || 0) + 1;
      return acc;
    }, {});
    const triggerCounts = weekEntries.reduce((acc, entry) => {
      const triggers = Array.isArray(entry.triggers)
        ? entry.triggers
        : (entry.triggers || '').split(',');
      triggers.forEach((trigger) => {
        const key = trigger.toLowerCase();
        if (key.trim()) {
          acc[key.trim()] = (acc[key.trim()] || 0) + 1;
        }
      });
      return acc;
    }, {});
    const topMood = Object.entries(moodCounts).sort((a, b) => b[1] - a[1])[0];
    const topTrigger = Object.entries(triggerCounts).sort((a, b) => b[1] - a[1])[0];
    const dateSet = new Set(weekEntries.map((entry) => getDayKey(entry.created_at)));
    let streak = 0;
    const cursor = new Date();
    while (dateSet.has(cursor.toDateString())) {
      streak += 1;
      cursor.setDate(cursor.getDate() - 1);
    }
    return {
      count: weekEntries.length,
      topMood: topMood ? topMood[0] : 'None yet',
      topTrigger: topTrigger ? topTrigger[0] : 'None yet',
      streak,
    };
  }, [entries]);

  const startNewEntry = () => {
    setMode('new');
    setSelectedEntry(null);
    setPromptText('');
    setForm({
      title: '',
      content: '',
      mood: '',
      triggersInput: '',
      triggers: [],
      promptUsed: '',
    });
  };

  const handleSelectEntry = (entry) => {
    setSelectedEntry(entry);
    setMode('view');
    setPromptText(entry.prompt_used || '');
    setForm({
      title: entry.title || '',
      content: entry.content || '',
      mood: entry.mood || '',
      triggersInput: (entry.triggers || []).join(', '),
      triggers: entry.triggers || [],
      promptUsed: entry.prompt_used || '',
    });
  };

  const handleEditEntry = () => {
    if (!selectedEntry) return;
    setMode('edit');
  };

  const handleTriggerBlur = () => {
    const next = form.triggersInput
      .split(',')
      .map((item) => item.trim())
      .filter(Boolean);
    setForm((prev) => ({ ...prev, triggers: Array.from(new Set(next)) }));
  };

  const removeTrigger = (value) => {
    setForm((prev) => ({
      ...prev,
      triggers: prev.triggers.filter((item) => item !== value),
      triggersInput: prev.triggers.filter((item) => item !== value).join(', '),
    }));
  };

  const handlePromptSelect = (value) => {
    if (!value) {
      setPromptText('');
      setForm((prev) => ({ ...prev, promptUsed: '' }));
      return;
    }
    if (value === FREE_WRITE_PROMPT) {
      setPromptText(FREE_WRITE_PROMPT);
      setForm((prev) => ({ ...prev, promptUsed: '' }));
      return;
    }
    setPromptText(value);
    setForm((prev) => ({ ...prev, promptUsed: value }));
  };

  const handleRandomPrompt = () => {
    const pick = PROMPTS[Math.floor(Math.random() * PROMPTS.length)];
    handlePromptSelect(pick.text);
  };

  const handleSave = async () => {
    setStatus({ error: '', busy: true });
    try {
      const payload = {
        title: form.title,
        content: form.content,
        mood: form.mood,
        triggers: form.triggers,
        prompt_used: form.promptUsed,
      };
      let response;
      if (mode === 'edit' && selectedEntry) {
        response = await updateJournalEntry(selectedEntry.id, payload);
      } else {
        response = await createJournalEntry(payload);
      }
      const updatedEntry = response.data;
      setEntries((prev) => {
        const existing = prev.filter((item) => item.id !== updatedEntry.id);
        return [updatedEntry, ...existing];
      });
      setSelectedEntry(updatedEntry);
      setMode('view');
      setShowReflection(true);
      setReflectionAnswers({ feelDifferent: null, wantExercises: null });
    } catch (error) {
      setStatus({ error: 'Unable to save entry.', busy: false });
      return;
    }
    setStatus({ error: '', busy: false });
  };

  const handleDelete = async () => {
    if (!selectedEntry) return;
    setStatus({ error: '', busy: true });
    try {
      await deleteJournalEntry(selectedEntry.id);
      setEntries((prev) => prev.filter((item) => item.id !== selectedEntry.id));
      startNewEntry();
    } catch (error) {
      setStatus({ error: 'Unable to delete entry.', busy: false });
      return;
    }
    setStatus({ error: '', busy: false });
  };

  const handleToggleLock = () => {
    const nextEnabled = !lockEnabled;
    setLockEnabled(nextEnabled);
    const uid = user?.id || 'guest';
    if (nextEnabled) {
      localStorage.setItem(lockKeyFor(uid), 'enabled');
      setLocked(true);
    } else {
      localStorage.removeItem(lockKeyFor(uid));
      setLocked(false);
    }
  };

  const handleUnlock = async () => {
    setUnlockError('');
    if (!user?.email) {
      setUnlockError('Password re-check is only available for email sign-in.');
      return;
    }
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: user.email,
        password: unlockPassword,
      });
      if (error) {
        throw error;
      }
      setLocked(false);
      setShowUnlock(false);
      setUnlockPassword('');
    } catch (error) {
      setUnlockError('Password confirmation failed.');
    }
  };

  const handleVoiceInput = () => {
    if (!speechSupported) return;
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!recognitionRef.current) {
      const recognition = new SpeechRecognition();
      recognition.lang = 'en-US';
      recognition.interimResults = false;
      recognition.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        setForm((prev) => ({
          ...prev,
          content: `${prev.content}\n${transcript}`.trim(),
        }));
      };
      recognitionRef.current = recognition;
    }
    recognitionRef.current.start();
  };

  const exerciseSuggestions = useMemo(() => {
    if (!reflectionAnswers.wantExercises) return [];
    const list = EXERCISE_SUGGESTIONS[form.mood] || EXERCISE_SUGGESTIONS.Stressed || [];
    return list.slice(0, 3);
  }, [reflectionAnswers.wantExercises, form.mood]);

  if (loading) {
    return <div className="journal-page">Loading journal...</div>;
  }

  return (
    <div className="journal-page">
      <aside className="journal-sidebar">
        <div className="journal-sidebar-header">
          <h2>Your entries</h2>
          <button type="button" className="journal-new" onClick={startNewEntry}>
            New Entry
          </button>
        </div>
        <div className="journal-filters">
          <input
            type="search"
            placeholder="Search entries"
            value={filters.query}
            onChange={(e) => setFilters((prev) => ({ ...prev, query: e.target.value }))}
            aria-label="Search entries"
          />
          <select
            value={filters.mood}
            onChange={(e) => setFilters((prev) => ({ ...prev, mood: e.target.value }))}
          >
            <option value="All">All moods</option>
            {MOODS.map((mood) => (
              <option key={mood} value={mood}>
                {mood}
              </option>
            ))}
          </select>
          <div className="journal-date-range">
            <input
              type="date"
              value={filters.startDate}
              onChange={(e) => setFilters((prev) => ({ ...prev, startDate: e.target.value }))}
              aria-label="Start date"
            />
            <input
              type="date"
              value={filters.endDate}
              onChange={(e) => setFilters((prev) => ({ ...prev, endDate: e.target.value }))}
              aria-label="End date"
            />
          </div>
        </div>
        <div className="journal-entry-list">
          {locked ? (
            <p className="journal-empty">Unlock your journal to view entries.</p>
          ) : filteredEntries.length ? (
            filteredEntries.map((entry) => (
              <button
                key={entry.id}
                type="button"
                className={`journal-entry-item ${selectedEntry?.id === entry.id ? 'active' : ''}`}
                onClick={() => handleSelectEntry(entry)}
              >
                <span className="journal-entry-title">{getSummaryLabel(entry)}</span>
                <span className="journal-entry-meta">
                  {formatDate(entry.created_at)} · {entry.mood || 'No mood'}
                </span>
              </button>
            ))
          ) : (
            <p className="journal-empty">No entries yet.</p>
          )}
        </div>
      </aside>

      <section className="journal-main">
        <SectionIntro
          badgeText="Personal Reflection Space"
          heading="Your Private Journal"
          subheading="A safe space to write down your thoughts, emotions, and experiences. Journaling helps you slow down, process feelings, and gain clarity over time."
          supportingText="Writing regularly can improve emotional awareness, reduce stress, and help you recognize patterns in your mood and behavior. Start with a guided prompt or freely express whatever is on your mind."
        />
        <div className="journal-header">
          <div>
            <h1>Journal</h1>
            <p className="journal-subtitle">A private space to write, reflect, and reset.</p>
          </div>
          <div className="journal-lock">
            <label htmlFor="journal-lock">Journal Lock</label>
            <input
              id="journal-lock"
              type="checkbox"
              checked={lockEnabled}
              onChange={handleToggleLock}
            />
            {lockEnabled && locked ? (
              <button type="button" onClick={() => setShowUnlock(true)}>
                Unlock
              </button>
            ) : null}
          </div>
        </div>

        {locked ? (
          <div className="journal-locked">
            <h2>Journal locked</h2>
            <p>Unlock to view and edit your entries.</p>
            <button type="button" onClick={() => setShowUnlock(true)}>
              Unlock Journal
            </button>
          </div>
        ) : (
          <>
            {mode === 'view' && selectedEntry ? (
              <div className="journal-detail-card">
                <div>
                  <h2>{selectedEntry.title || 'Untitled entry'}</h2>
                  <p className="journal-detail-meta">
                    {new Date(selectedEntry.created_at).toLocaleString()} ·{' '}
                    {selectedEntry.mood || 'No mood'}
                  </p>
                </div>
                <p className="journal-detail-content">{selectedEntry.content}</p>
                {selectedEntry.prompt_used ? (
                  <p className="journal-detail-prompt">
                    Prompt: {selectedEntry.prompt_used}
                  </p>
                ) : null}
                <div className="journal-detail-actions">
                  <button type="button" onClick={handleEditEntry}>
                    Edit Entry
                  </button>
                  <button type="button" className="danger" onClick={handleDelete}>
                    Delete Entry
                  </button>
                </div>
              </div>
            ) : null}

            <div className="journal-editor-card">
              <div className="journal-editor-header">
                <h2>{mode === 'edit' ? 'Edit entry' : 'New entry'}</h2>
                <div className="journal-status">{draftStatus}</div>
              </div>

              <div className="journal-prompt">
                <label htmlFor="prompt-select">Guided prompt</label>
                <div className="journal-prompt-controls">
                  <select
                    id="prompt-select"
                    value={promptText}
                    onChange={(e) => handlePromptSelect(e.target.value)}
                  >
                    <option value="">Select a prompt</option>
                    <option value={FREE_WRITE_PROMPT}>{FREE_WRITE_PROMPT}</option>
                    {PROMPTS.map((prompt) => (
                      <option key={prompt.text} value={prompt.text}>
                        {prompt.group} - {prompt.text}
                      </option>
                    ))}
                  </select>
                  <button type="button" onClick={handleRandomPrompt}>
                    Random Prompt
                  </button>
                </div>
                {promptText && promptText !== FREE_WRITE_PROMPT ? (
                  <p className="journal-prompt-text">{promptText}</p>
                ) : null}
              </div>

              <label htmlFor="journal-title">Title (optional)</label>
              <input
                id="journal-title"
                type="text"
                value={form.title}
                onChange={(e) => setForm((prev) => ({ ...prev, title: e.target.value }))}
                placeholder="Give this entry a title"
              />

              <label htmlFor="journal-content">Entry</label>
              <textarea
                id="journal-content"
                rows={10}
                value={form.content}
                onChange={(e) => setForm((prev) => ({ ...prev, content: e.target.value }))}
                placeholder="Let it flow..."
              />

              <div className="journal-editor-row">
                <div>
                  <label htmlFor="journal-mood">Mood</label>
                  <select
                    id="journal-mood"
                    value={form.mood}
                    onChange={(e) => setForm((prev) => ({ ...prev, mood: e.target.value }))}
                  >
                    <option value="">Select mood</option>
                    {MOODS.map((mood) => (
                      <option key={mood} value={mood}>
                        {mood}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="journal-voice">
                  {speechSupported ? (
                    <button type="button" onClick={handleVoiceInput}>
                      🎙️ Speak
                    </button>
                  ) : null}
                </div>
              </div>

              <label htmlFor="journal-triggers">Triggers (comma separated)</label>
              <input
                id="journal-triggers"
                type="text"
                value={form.triggersInput}
                onChange={(e) => setForm((prev) => ({ ...prev, triggersInput: e.target.value }))}
                onBlur={handleTriggerBlur}
                placeholder="e.g. work, family, deadlines"
              />
              <div className="journal-tags">
                {form.triggers.map((trigger) => (
                  <span key={trigger} className="journal-tag">
                    {trigger}
                    <button type="button" onClick={() => removeTrigger(trigger)} aria-label={`Remove ${trigger}`}>
                      ×
                    </button>
                  </span>
                ))}
              </div>

              {status.error ? <p className="journal-error">{status.error}</p> : null}

              <button
                type="button"
                className="journal-save"
                onClick={handleSave}
                disabled={status.busy || !form.content.trim()}
              >
                {status.busy ? 'Saving...' : 'Save Entry'}
              </button>
            </div>

            {showReflection ? (
              <div className="journal-reflection">
                <h3>Reflection check-in</h3>
                <div className="journal-reflection-item">
                  <p>Do you feel differently after writing this?</p>
                  <div className="journal-reflection-actions">
                    <button type="button" onClick={() => setReflectionAnswers((prev) => ({ ...prev, feelDifferent: true }))}>
                      Yes
                    </button>
                    <button type="button" onClick={() => setReflectionAnswers((prev) => ({ ...prev, feelDifferent: false }))}>
                      Not yet
                    </button>
                  </div>
                </div>
                <div className="journal-reflection-item">
                  <p>Would you like a guided exercise suggestion?</p>
                  <div className="journal-reflection-actions">
                    <button type="button" onClick={() => setReflectionAnswers((prev) => ({ ...prev, wantExercises: true }))}>
                      Yes
                    </button>
                    <button type="button" onClick={() => setReflectionAnswers((prev) => ({ ...prev, wantExercises: false }))}>
                      No
                    </button>
                  </div>
                </div>
                {exerciseSuggestions.length ? (
                  <div className="journal-suggestions">
                    <p>Suggested exercises:</p>
                    <ul>
                      {exerciseSuggestions.map((item) => (
                        <li key={item}>{item}</li>
                      ))}
                    </ul>
                  </div>
                ) : null}
              </div>
            ) : null}

            <div className="journal-insights">
              <h3>Weekly insights</h3>
              <div className="journal-insights-grid">
                <div>
                  <span>Entries this week</span>
                  <strong>{weeklyStats.count}</strong>
                </div>
                <div>
                  <span>Most common mood</span>
                  <strong>{weeklyStats.topMood}</strong>
                </div>
                <div>
                  <span>Common trigger</span>
                  <strong>{weeklyStats.topTrigger}</strong>
                </div>
                <div>
                  <span>Current streak</span>
                  <strong>{weeklyStats.streak} days</strong>
                </div>
              </div>
            </div>
          </>
        )}
      </section>

      {showUnlock ? (
        <div className="journal-modal">
          <div className="journal-modal-content">
            <h3>Unlock Journal</h3>
            <p>Confirm your password to continue.</p>
            <input
              type="password"
              value={unlockPassword}
              onChange={(e) => setUnlockPassword(e.target.value)}
              placeholder="Password"
            />
            {unlockError ? <p className="journal-error">{unlockError}</p> : null}
            <div className="journal-modal-actions">
              <button type="button" onClick={handleUnlock}>
                Unlock
              </button>
              <button type="button" className="ghost" onClick={() => setShowUnlock(false)}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
