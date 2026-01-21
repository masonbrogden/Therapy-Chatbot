import React, { useState, useEffect } from 'react';
import Disclaimer from '../components/Disclaimer';
import MoodChart from '../components/MoodChart';
import LoadingSpinner from '../components/LoadingSpinner';
import * as api from '../services/api';
import { getSessionId } from '../utils/session';
import './Mood.css';

const MOOD_TAGS = [
  'anxiety',
  'sleep',
  'stress',
  'relationships',
  'work',
  'self-care',
  'sadness',
  'anger',
  'calm',
  'hopeful',
  'overwhelmed',
];

const MOOD_LABELS = [
  'Very low :(',
  'Low :(',
  'Low :/',
  'Below average :/',
  'Neutral :|',
  'Okay :|',
  'Good :)',
  'Great :)',
  'Very good :D',
  'Excellent :D',
];

export default function Mood() {
  const sessionId = getSessionId();
  const [moodScore, setMoodScore] = useState(5);
  const [selectedTags, setSelectedTags] = useState([]);
  const [note, setNote] = useState('');
  const [entries, setEntries] = useState([]);
  const [range, setRange] = useState('7d');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState(null);
  const [error, setError] = useState('');
  const [filterTags, setFilterTags] = useState([]);
  const [saveMessage, setSaveMessage] = useState('');

  useEffect(() => {
    loadMoodEntries();
  }, [range, startDate, endDate, filterTags]);

  const loadMoodEntries = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await api.getMoodEntries(sessionId, {
        range,
        start_date: startDate || undefined,
        end_date: endDate || undefined,
        tags: filterTags.length ? filterTags.join(',') : undefined,
      });
      setEntries(response.data.entries);
      if (response.data.stats) {
        setStats(response.data.stats);
      } else {
        const summary = await api.getMoodSummary(sessionId, {
          start_date: startDate || undefined,
          end_date: endDate || undefined,
          tags: filterTags.length ? filterTags.join(',') : undefined,
        });
        setStats(summary.data);
      }
    } catch (error) {
      console.error('Failed to load mood entries:', error);
      setError('Unable to load mood history.');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.createMoodEntry(sessionId, moodScore, selectedTags, note);
      setMoodScore(5);
      setSelectedTags([]);
      setNote('');
      setSaveMessage('Saved today\'s check-in.');
      setTimeout(() => setSaveMessage(''), 3000);
      loadMoodEntries();
    } catch (error) {
      console.error('Failed to save mood:', error);
    }
  };

  const toggleTag = (tag) => {
    setSelectedTags(selectedTags.includes(tag) ? selectedTags.filter(t => t !== tag) : [...selectedTags, tag]);
  };

  const toggleFilterTag = (tag) => {
    setFilterTags(filterTags.includes(tag) ? filterTags.filter(t => t !== tag) : [...filterTags, tag]);
  };

  const getMoodEmoji = (score) => {
    if (score <= 2) return ':(';
    if (score <= 4) return ':/';
    if (score <= 6) return ':|';
    if (score <= 8) return ':)';
    return ':D';
  };

  const deleteMood = async () => {
    if (window.confirm('Delete all mood entries? This cannot be undone.')) {
      try {
        await api.deleteMoodEntries(sessionId);
        loadMoodEntries();
      } catch (error) {
        console.error('Failed to delete entries:', error);
      }
    }
  };

  return (
    <div className="mood-container">
      <Disclaimer />
      
      <h1>Daily Check-In</h1>

      <form onSubmit={handleSubmit} className="mood-form">
        <div className="form-group">
          <label>How are you feeling today? {getMoodEmoji(moodScore)}</label>
          <div className="mood-slider">
            <input
              type="range"
              min="1"
              max="10"
              value={moodScore}
              onChange={(e) => setMoodScore(Number(e.target.value))}
            />
            <span className="mood-value">{moodScore}/10</span>
          </div>
          <div className="mood-scale">
            <span>{MOOD_LABELS[moodScore - 1]}</span>
          </div>
        </div>

        <div className="form-group">
          <label>Optional tags</label>
          <div className="tags">
            {MOOD_TAGS.map(tag => (
              <button
                key={tag}
                type="button"
                className={`tag ${selectedTags.includes(tag) ? 'active' : ''}`}
                onClick={() => toggleTag(tag)}
              >
                {tag}
              </button>
            ))}
          </div>
        </div>

        <div className="form-group">
          <label htmlFor="note">Journal (Optional, max 500 chars)</label>
          <textarea
            id="note"
            value={note}
            onChange={(e) => setNote(e.target.value.slice(0, 500))}
            placeholder="What's on your mind?"
            rows="4"
          />
          <small>{note.length}/500</small>
        </div>

        <button type="submit" className="btn-submit">Save Entry</button>
        {saveMessage && <p className="save-message">{saveMessage}</p>}
      </form>

      <div className="mood-stats">
        <h2>Your Mood Insights</h2>
        {stats && (
          <div className="stats-grid">
            <div className="stat">
              <strong>Entries</strong>
              <p>{stats.count}</p>
            </div>
            <div className="stat">
              <strong>Average</strong>
              <p>{stats.average_mood ? stats.average_mood.toFixed(1) : 'N/A'}</p>
            </div>
            <div className="stat">
              <strong>Highest</strong>
              <p>{stats.max_mood || 'N/A'}</p>
            </div>
            <div className="stat">
              <strong>Lowest</strong>
              <p>{stats.min_mood || 'N/A'}</p>
            </div>
            <div className="stat">
              <strong>Streak</strong>
              <p>{stats.streak_days || 0} days</p>
            </div>
            <div className="stat">
              <strong>Trend</strong>
              <p>
                {stats.trend
                  ? `${stats.trend.direction} (${stats.trend.delta >= 0 ? '+' : ''}${stats.trend.delta})`
                  : 'N/A'}
              </p>
            </div>
          </div>
        )}
      </div>

      <div className="mood-history">
        <h2>History & Trends</h2>
        <div className="range-selector">
          <button
            onClick={() => {
              setRange('7d');
              setStartDate('');
              setEndDate('');
            }}
            className={range === '7d' ? 'active' : ''}
          >
            Last 7 Days
          </button>
          <button
            onClick={() => {
              setRange('30d');
              setStartDate('');
              setEndDate('');
            }}
            className={range === '30d' ? 'active' : ''}
          >
            Last 30 Days
          </button>
          <button
            onClick={() => {
              setRange('all');
              setStartDate('');
              setEndDate('');
            }}
            className={range === 'all' ? 'active' : ''}
          >
            All Time
          </button>
        </div>
        <div className="date-range">
          <label>
            Start
            <input
              type="date"
              value={startDate}
              onChange={(e) => {
                setStartDate(e.target.value);
                setRange('all');
              }}
            />
          </label>
          <label>
            End
            <input
              type="date"
              value={endDate}
              onChange={(e) => {
                setEndDate(e.target.value);
                setRange('all');
              }}
            />
          </label>
          <button
            type="button"
            className="clear-range"
            onClick={() => {
              setStartDate('');
              setEndDate('');
            }}
          >
            Clear Dates
          </button>
        </div>

        {loading ? (
          <LoadingSpinner />
        ) : error ? (
          <p className="mood-error">{error}</p>
        ) : (
          <>
            <div className="tag-filters">
              <span className="tag-filter-label">Filter tags:</span>
              {MOOD_TAGS.map(tag => (
                <button
                  key={tag}
                  type="button"
                  className={`tag ${filterTags.includes(tag) ? 'active' : ''}`}
                  onClick={() => toggleFilterTag(tag)}
                >
                  {tag}
                </button>
              ))}
            </div>
            <MoodChart
              entries={entries}
            />
            <div className="mood-timeline">
              {entries.length === 0 ? (
                <p className="no-data">No check-ins for this range.</p>
              ) : (
                entries
                  .slice()
                  .sort((a, b) => new Date(b.entry_date) - new Date(a.entry_date))
                  .map((entry) => (
                    <div key={entry.id} className="timeline-entry">
                      <div className="timeline-date">
                        {entry.entry_date
                          ? new Date(entry.entry_date).toLocaleDateString()
                          : 'Unknown date'}
                      </div>
                      <div className="timeline-score">
                        {entry.mood_score}/10 {getMoodEmoji(entry.mood_score)}
                      </div>
                      {entry.tags && entry.tags.length > 0 && (
                        <div className="timeline-tags">
                          {entry.tags.map((tag) => (
                            <span key={`${entry.id}-${tag}`} className="timeline-tag">
                              {tag}
                            </span>
                          ))}
                        </div>
                      )}
                      {entry.note && <p className="timeline-note">{entry.note}</p>}
                    </div>
                  ))
              )}
            </div>
          </>
        )}
      </div>

      {entries.length > 0 && (
        <button onClick={deleteMood} className="btn-delete-mood">
          Delete All Entries
        </button>
      )}
    </div>
  );
}
