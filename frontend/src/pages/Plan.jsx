import React, { useState, useEffect } from 'react';
import Disclaimer from '../components/Disclaimer';
import LoadingSpinner from '../components/LoadingSpinner';
import * as api from '../services/api';
import { getSessionId } from '../utils/session';
import './Plan.css';

const CONCERNS = ['anxiety', 'depression', 'stress', 'grief', 'trauma'];
const APPROACHES = ['cbt', 'dbt', 'psychodynamic', 'gestalt', 'adlerian'];
const FOCUS_AREAS = ['stress', 'relationships', 'sleep', 'habits', 'trauma', 'self-esteem', 'work'];

export default function Plan() {
  const sessionId = getSessionId();
  const [profile, setProfile] = useState(null);
  const [formData, setFormData] = useState({
    main_concern: 'anxiety',
    concern_extra: '',
    approach: 'cbt',
    goals: '',
    minutes_per_day: 10,
    primary_goals: '',
    preferred_approaches: '',
    frequency_preference: 'weekly',
    focus_areas: [],
  });
  const [plan, setPlan] = useState(null);
  const [planHistory, setPlanHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      setError('');
      const response = await api.getTherapyProfile(sessionId);
      if (response.data) {
        setProfile(response.data);
        setFormData(response.data);
        await loadPlan();
        await loadPlanHistory();
      } else {
        setEditMode(true);
      }
    } catch (err) {
      console.error('Failed to load profile:', err);
      setEditMode(true);
      setError('Unable to load your plan details.');
    }
  };

  const loadPlan = async () => {
    try {
      const response = await api.getLatestTherapyPlan(sessionId);
      if (response.data) {
        setPlan(response.data);
      }
    } catch (err) {
      console.error('Failed to load plan:', err);
    }
  };

  const loadPlanHistory = async () => {
    try {
      const response = await api.getPlanHistory();
      setPlanHistory(response.data || []);
    } catch (err) {
      console.error('Failed to load plan history:', err);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: name === 'minutes_per_day' ? Number(value) : value,
    });
  };

  const toggleFocus = (area) => {
    setFormData((prev) => ({
      ...prev,
      focus_areas: prev.focus_areas.includes(area)
        ? prev.focus_areas.filter((item) => item !== area)
        : [...prev.focus_areas, area],
    }));
  };

  const saveProfile = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      await api.upsertTherapyProfile(sessionId, formData);
      setProfile(formData);
      setEditMode(false);
      await loadPlan();
      await loadPlanHistory();
    } catch (err) {
      console.error('Failed to save profile:', err);
    } finally {
      setLoading(false);
    }
  };

  const generateNewPlan = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await api.generateTherapyPlan(sessionId);
      setPlan(response.data);
      await loadPlanHistory();
    } catch (err) {
      console.error('Failed to generate plan:', err);
      setError('Plan generation is limited. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  const toggleCompletion = async (dayIndex, completed) => {
    if (!plan?.id) return;
    try {
      const response = await api.updatePlanCompletion(plan.id, dayIndex, completed);
      setPlan(response.data);
    } catch (err) {
      console.error('Failed to update completion:', err);
    }
  };

  if (editMode || !profile) {
    return (
      <div className="plan-container">
        <Disclaimer />
        <h1>Build Your Therapy Plan</h1>
        <p>Tell us about your goals and preferences so we can create a personalized plan.</p>

        <form onSubmit={saveProfile} className="plan-form">
          <div className="form-group">
            <label htmlFor="main_concern">Main Concern</label>
            <select
              id="main_concern"
              name="main_concern"
              value={formData.main_concern}
              onChange={handleInputChange}
            >
              {CONCERNS.map((c) => (
                <option key={c} value={c}>
                  {c.charAt(0).toUpperCase() + c.slice(1)}
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="concern_extra">Tell us more (optional)</label>
            <textarea
              id="concern_extra"
              name="concern_extra"
              value={formData.concern_extra}
              onChange={handleInputChange}
              placeholder="What specifically would you like help with?"
              rows="3"
            />
          </div>

          <div className="form-group">
            <label htmlFor="approach">Preferred Therapy Approach</label>
            <select
              id="approach"
              name="approach"
              value={formData.approach}
              onChange={handleInputChange}
            >
              {APPROACHES.map((a) => (
                <option key={a} value={a}>
                  {a.charAt(0).toUpperCase() + a.slice(1)}
                </option>
              ))}
            </select>
            <small>Not sure? CBT is widely effective.</small>
          </div>

          <div className="form-group">
            <label htmlFor="goals">Your Goals</label>
            <textarea
              id="goals"
              name="goals"
              value={formData.goals}
              onChange={handleInputChange}
              placeholder="What do you hope to achieve?"
              rows="3"
            />
          </div>

          <div className="form-group">
            <label htmlFor="primary_goals">Primary Goals (Short list)</label>
            <input
              id="primary_goals"
              name="primary_goals"
              value={formData.primary_goals}
              onChange={handleInputChange}
              placeholder="Example: Better sleep, less anxiety"
            />
          </div>

          <div className="form-group">
            <label htmlFor="preferred_approaches">Preferred Approaches</label>
            <input
              id="preferred_approaches"
              name="preferred_approaches"
              value={formData.preferred_approaches}
              onChange={handleInputChange}
              placeholder="Example: CBT, mindfulness"
            />
          </div>

          <div className="form-group">
            <label htmlFor="frequency_preference">Check-in Frequency</label>
            <select
              id="frequency_preference"
              name="frequency_preference"
              value={formData.frequency_preference}
              onChange={handleInputChange}
            >
              <option value="daily">Daily</option>
              <option value="weekly">Weekly</option>
            </select>
          </div>

          <div className="form-group">
            <label>Areas of Focus</label>
            <div className="focus-tags">
              {FOCUS_AREAS.map((area) => (
                <button
                  key={area}
                  type="button"
                  className={`tag ${formData.focus_areas.includes(area) ? 'active' : ''}`}
                  onClick={() => toggleFocus(area)}
                >
                  {area}
                </button>
              ))}
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="minutes_per_day">Time Available Per Day</label>
            <select
              id="minutes_per_day"
              name="minutes_per_day"
              value={formData.minutes_per_day}
              onChange={handleInputChange}
            >
              <option value={5}>5 minutes</option>
              <option value={10}>10 minutes</option>
              <option value={15}>15 minutes</option>
            </select>
          </div>

          <button type="submit" disabled={loading} className="btn-generate">
            {loading ? 'Creating...' : 'Create My Plan'}
          </button>
        </form>
      </div>
    );
  }

  return (
    <div className="plan-container">
      <Disclaimer />
      <h1>Your Therapy Plan</h1>
      {error && <p className="plan-error">{error}</p>}

      {!plan ? (
        <div className="no-plan">
          <p>Generate your first plan to get started.</p>
          <button onClick={generateNewPlan} disabled={loading} className="btn-generate">
            {loading ? 'Generating...' : 'Generate Plan'}
          </button>
        </div>
      ) : (
        <div className="plan-display">
          {loading && <LoadingSpinner />}
          {plan.plan && (
            <>
              <div className="plan-header">
                <h2>{plan.plan.theme}</h2>
                <p className="plan-focus">{plan.plan.focus}</p>
                <p className="plan-note">{plan.plan.note}</p>
              </div>

              <div className="plan-highlights">
                <div>
                  <h3>Reflection Prompt</h3>
                  <p>{plan.plan.reflection_prompt}</p>
                </div>
                <div>
                  <h3>Coping Exercise</h3>
                  <p>{plan.plan.coping_exercise}</p>
                </div>
                <div>
                  <h3>Micro-Goals</h3>
                  <ul>
                    {(plan.plan.micro_goals || []).map((goal, idx) => (
                      <li key={idx}>{goal}</li>
                    ))}
                  </ul>
                </div>
                <div>
                  <h3>Action Items</h3>
                  <ul>
                    {(plan.plan.action_items || []).map((item, idx) => (
                      <li key={idx}>{item}</li>
                    ))}
                  </ul>
                </div>
              </div>

              <div className="weekly-plan">
                <h3>Your Weekly Plan</h3>
                <div className="days-grid">
                  {plan.plan.weekly_plan &&
                    plan.plan.weekly_plan.map((day, idx) => (
                      <div key={idx} className="day-card">
                        <h4>{day.day}</h4>
                        <p className="daily-goal">{day.daily_goal}</p>
                        <p className="reflection">- {day.reflection_question}</p>
                        <label className="completion-toggle">
                          <input
                            type="checkbox"
                            checked={!!day.completed}
                            onChange={(e) => toggleCompletion(idx, e.target.checked)}
                          />
                          Mark complete
                        </label>
                      </div>
                    ))}
                </div>
              </div>

              <div className="plan-actions">
                <button onClick={generateNewPlan} disabled={loading} className="btn-regenerate">
                  Regenerate Plan
                </button>
                <button onClick={() => setEditMode(true)} className="btn-edit">
                  Edit Profile
                </button>
              </div>
            </>
          )}
        </div>
      )}

      {planHistory.length > 1 && (
        <div className="plan-history">
          <h2>Plan History</h2>
          <ul>
            {planHistory.map((item) => (
              <li key={item.id}>
                Version {item.version} - {new Date(item.created_at).toLocaleDateString()}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
