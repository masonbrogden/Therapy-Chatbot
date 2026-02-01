import React, { useMemo, useState } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import * as api from '../services/api';
import {
  getCachedChatProfile,
  normalizeChatProfile,
  setCachedChatProfile,
} from '../utils/chatProfile';
import './ChatOnboarding.css';

const STEPS = [
  {
    id: 'displayName',
    type: 'text',
    question: 'What name should I call you?',
    helper: 'Optional',
  },
  {
    id: 'tone',
    type: 'choice',
    question: 'What tone should I use?',
    options: ['Professional', 'Friendly', 'Supportive', 'Direct', 'Calm / gentle'],
    required: true,
  },
  {
    id: 'goal',
    type: 'choice',
    question: 'What do you want most right now?',
    options: [
      'To vent and feel heard',
      'Practical steps and a plan',
      'Coping tools (quick relief)',
      'Perspective / reframing',
      'Not sure',
    ],
    required: true,
  },
  {
    id: 'focusArea',
    type: 'choice',
    question: 'What would you like to focus on today?',
    options: [
      'Stress / anxiety',
      'Low mood / motivation',
      'Relationships',
      'Self-esteem',
      'Work/school pressure',
      'Other',
    ],
    required: true,
  },
  {
    id: 'responseLength',
    type: 'choice',
    question: 'How do you want responses?',
    options: ['Short and direct', 'Balanced', 'Detailed and thorough'],
    required: true,
  },
  {
    id: 'boundaries',
    type: 'text',
    question: 'Anything you want me to avoid or be mindful of?',
    helper: 'Optional (max 200 chars)',
    placeholder: 'Avoid religion, No tough love, Ask before giving advice',
    maxLength: 200,
  },
];

const buildInitialForm = (profile) => ({
  displayName: profile?.displayName || '',
  tone: profile?.tone || '',
  goal: profile?.goal || '',
  focusArea: profile?.focusArea || '',
  responseLength: profile?.responseLength || '',
  boundaries: profile?.boundaries || '',
});

export default function ChatOnboarding() {
  const navigate = useNavigate();
  const prefersReducedMotion = useReducedMotion();
  const cachedProfile = useMemo(() => getCachedChatProfile(), []);
  const [form, setForm] = useState(buildInitialForm(cachedProfile));
  const [stepIndex, setStepIndex] = useState(0);
  const [direction, setDirection] = useState(0);
  const [status, setStatus] = useState({ loading: false, error: '' });

  const step = STEPS[stepIndex];
  const totalSteps = STEPS.length;
  const progress = Math.round(((stepIndex + 1) / totalSteps) * 100);

  const isStepValid = () => {
    if (!step.required) return true;
    return Boolean(form[step.id]);
  };

  const handleNext = () => {
    if (!isStepValid()) return;
    setDirection(1);
    setStepIndex((prev) => Math.min(totalSteps - 1, prev + 1));
  };

  const handleBack = () => {
    setDirection(-1);
    setStepIndex((prev) => Math.max(0, prev - 1));
  };

  const handleSave = async () => {
    setStatus({ loading: true, error: '' });
    const payload = {
      display_name: form.displayName || null,
      tone: form.tone,
      goal: form.goal,
      focus_area: form.focusArea,
      response_length: form.responseLength,
      boundaries: form.boundaries || null,
      onboarding_completed: true,
    };

    try {
      const response = await api.updateChatProfile(payload);
      const profile = normalizeChatProfile(response.data || {});
      setCachedChatProfile(profile);
      navigate('/chat', { replace: true });
    } catch (error) {
      const fallbackProfile = {
        displayName: form.displayName || '',
        tone: form.tone,
        goal: form.goal,
        focusArea: form.focusArea,
        responseLength: form.responseLength,
        boundaries: form.boundaries || '',
        onboardingCompleted: true,
        updatedAt: new Date().toISOString(),
      };
      setCachedChatProfile(fallbackProfile);
      navigate('/chat', { replace: true });
    }
  };

  const variants = {
    enter: (dir) => ({
      x: prefersReducedMotion ? 0 : dir > 0 ? 40 : -40,
      opacity: 0,
    }),
    center: { x: 0, opacity: 1 },
    exit: (dir) => ({
      x: prefersReducedMotion ? 0 : dir > 0 ? -40 : 40,
      opacity: 0,
    }),
  };

  return (
    <div className="onboarding-page">
      <div className="onboarding-card">
        <div className="onboarding-header">
          <span className="onboarding-pill">Chat Onboarding Assessment</span>
          <h1>Help us tailor your chat experience</h1>
          <p>
            Answer a few quick questions so your conversations feel more personal and supportive.
          </p>
        </div>

        <div className="onboarding-progress">
          <div className="progress-track">
            <div className="progress-fill" style={{ width: `${progress}%` }} />
          </div>
          <span>
            Step {stepIndex + 1} of {totalSteps}
          </span>
        </div>

        <div className="onboarding-body">
          <AnimatePresence mode="wait" custom={direction}>
            <motion.div
              key={step.id}
              className="onboarding-step"
              custom={direction}
              variants={variants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: prefersReducedMotion ? 0 : 0.25 }}
            >
              <div className="step-header">
                <h2>{step.question}</h2>
                {step.helper ? <span>{step.helper}</span> : null}
              </div>

              {step.type === 'choice' ? (
                <div className="step-options">
                  {step.options.map((option) => (
                    <button
                      key={option}
                      type="button"
                      className={`option-btn ${form[step.id] === option ? 'active' : ''}`}
                      onClick={() => setForm((prev) => ({ ...prev, [step.id]: option }))}
                    >
                      {option}
                    </button>
                  ))}
                </div>
              ) : (
                <div className="step-inputs">
                  <input
                    type="text"
                    value={form[step.id]}
                    maxLength={step.maxLength}
                    placeholder={step.placeholder || 'Type here...'}
                    onChange={(e) =>
                      setForm((prev) => ({ ...prev, [step.id]: e.target.value }))
                    }
                  />
                  {step.id === 'displayName' ? (
                    <button
                      type="button"
                      className="ghost-btn"
                      onClick={() => {
                        setForm((prev) => ({ ...prev, displayName: '' }));
                        if (stepIndex < totalSteps - 1) {
                          handleNext();
                        }
                      }}
                    >
                      Prefer not to say
                    </button>
                  ) : null}
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>

        {status.error ? <p className="onboarding-error">{status.error}</p> : null}

        <div className="onboarding-actions">
          <button
            type="button"
            className="btn-secondary"
            onClick={handleBack}
            disabled={stepIndex === 0 || status.loading}
          >
            Back
          </button>
          {stepIndex < totalSteps - 1 ? (
            <button
              type="button"
              className="btn-primary"
              onClick={handleNext}
              disabled={!isStepValid() || status.loading}
            >
              Next
            </button>
          ) : (
            <button
              type="button"
              className="btn-primary"
              onClick={handleSave}
              disabled={status.loading}
            >
              {status.loading ? 'Saving...' : 'Finish'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
