import React, { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import SectionIntro from '../components/SectionIntro';
import './WellnessAssessment.css';

const QUESTIONS = [
  {
    id: 'q1',
    question: 'How have you been feeling most days recently?',
    options: [
      'Calm and steady',
      'Slightly stressed',
      'Often anxious or overwhelmed',
      'Low or unmotivated',
      'It varies a lot',
    ],
  },
  {
    id: 'q2',
    question: 'How often do you feel stressed or worried?',
    options: ['Rarely', 'Sometimes', 'Often', 'Almost always'],
  },
  {
    id: 'q3',
    question: 'What tends to affect your mood the most?',
    options: [
      'Work or school',
      'Relationships',
      'Health or body',
      'Finances',
      'Uncertainty about the future',
      'Other / not sure',
    ],
  },
  {
    id: 'q4',
    question: 'How well are you sleeping lately?',
    options: [
      'I sleep well most nights',
      'My sleep is okay but inconsistent',
      'I struggle to fall or stay asleep',
      'My sleep feels very disrupted',
    ],
  },
  {
    id: 'q5',
    question: 'When you feel stressed, what do you usually do?',
    options: [
      'Talk to someone',
      'Distract myself (scrolling, games, etc.)',
      'Avoid thinking about it',
      'Use breathing / calming techniques',
      "I'm not sure / nothing helps",
    ],
  },
  {
    id: 'q6',
    question: 'How connected do you feel to others right now?',
    options: ['Very connected', 'Somewhat connected', 'Mostly isolated', 'Very isolated'],
  },
  {
    id: 'q7',
    question:
      'How often do you use substances to relax or cope? (alcohol, cannabis, nicotine, etc.)',
    options: ['Rarely or never', 'Occasionally', 'Frequently', 'Almost daily'],
  },
  {
    id: 'q8',
    question: 'How would you describe yourself in challenging situations?',
    options: [
      'I stay calm and solution-focused',
      'I overthink and worry',
      'I avoid conflict or difficult feelings',
      'I react quickly and emotionally',
      "I'm not sure",
    ],
  },
  {
    id: 'q9',
    question: 'What would you like help with most right now?',
    options: [
      'Reducing stress or anxiety',
      'Feeling more motivated',
      'Improving sleep',
      'Building healthy habits',
      'Understanding my emotions better',
    ],
  },
  {
    id: 'q10',
    question: 'How ready do you feel to try new wellness practices?',
    options: ['Very ready', 'Somewhat ready', 'Not sure', 'Not ready yet'],
  },
];

const LOCAL_STORAGE_KEY = 'wellnessAssessmentLatest';

const FOCUS_DETAILS = {
  'Stress & Overwhelm': 'Try Box Breathing or 5-4-3-2-1 grounding to reset.',
  'Sleep Support': 'Try a calming wind-down ritual or a grounding exercise before bed.',
  'Connection & Support': 'Consider journaling and a gentle chat check-in to feel supported.',
  'Coping Skills': 'Explore breathing and journaling as alternatives to cope with stress.',
};

const FOCUS_PRIORITY_BY_GOAL = {
  'Reducing stress or anxiety': 'Stress & Overwhelm',
  'Improving sleep': 'Sleep Support',
  'Feeling more motivated': null,
  'Building healthy habits': null,
  'Understanding my emotions better': null,
};

function QuestionCard({ stepLabel, question, options, value, onChange }) {
  return (
    <div className="assessment-card">
      <p className="assessment-step">{stepLabel}</p>
      <h2>{question}</h2>
      <div className="assessment-options">
        {options.map((option) => (
          <label key={option} className={`option-card ${value === option ? 'selected' : ''}`}>
            <input
              type="radio"
              name={question}
              value={option}
              checked={value === option}
              onChange={() => onChange(option)}
            />
            <span>{option}</span>
          </label>
        ))}
      </div>
    </div>
  );
}

function ResultsPanel({ summary, focusAreas }) {
  return (
    <div className="assessment-card results-card">
      <h2>Your Wellness Snapshot</h2>
      <p className="results-summary">{summary}</p>
      <div className="results-section">
        <h3>Focus Areas</h3>
        <ul className="results-list">
          {focusAreas.length ? (
            focusAreas.map((area) => (
              <li key={area}>
                <strong>{area}</strong>
                <span>{FOCUS_DETAILS[area]}</span>
              </li>
            ))
          ) : (
            <li>
              <strong>Balance & Maintenance</strong>
              <span>Keep supporting your steady routines and check in as needed.</span>
            </li>
          )}
        </ul>
      </div>
      <div className="results-section">
        <h3>Recommended Next Steps</h3>
        <div className="results-actions">
          <Link to="/chat" className="btn-primary">Start Chat</Link>
          <Link to="/journal" className="btn-secondary">Open Journal</Link>
          <Link to="/exercises" className="btn-secondary">Try Guided Exercises</Link>
        </div>
      </div>
      <p className="results-disclaimer">
        This assessment is for self-reflection and is not a medical diagnosis.
      </p>
      <p className="results-disclaimer">
        If you're in immediate danger or considering self-harm, use Crisis Support.
      </p>
    </div>
  );
}

export default function WellnessAssessmentPage() {
  const [currentStep, setCurrentStep] = useState(0);
  const [answers, setAnswers] = useState(Array(QUESTIONS.length).fill(''));
  const [showResults, setShowResults] = useState(false);
  const isReview = currentStep === QUESTIONS.length;

  const progress = Math.min((currentStep / QUESTIONS.length) * 100, 100);

  const focusAreas = useMemo(() => {
    const q1 = answers[0];
    const q2 = answers[1];
    const q4 = answers[3];
    const q6 = answers[5];
    const q7 = answers[6];
    const q9 = answers[8];

    const areas = [];
    if (q2 === 'Often' || q2 === 'Almost always' || q1 === 'Often anxious or overwhelmed') {
      areas.push('Stress & Overwhelm');
    }
    if (q4 === 'I struggle to fall or stay asleep' || q4 === 'My sleep feels very disrupted') {
      areas.push('Sleep Support');
    }
    if (q6 === 'Mostly isolated' || q6 === 'Very isolated') {
      areas.push('Connection & Support');
    }
    if (q7 === 'Frequently' || q7 === 'Almost daily') {
      areas.push('Coping Skills');
    }

    const priority = FOCUS_PRIORITY_BY_GOAL[q9];
    if (priority && areas.includes(priority)) {
      return [priority, ...areas.filter((area) => area !== priority)].slice(0, 3);
    }
    return areas.slice(0, 3);
  }, [answers]);

  const summary = useMemo(() => {
    const q1 = answers[0];
    const q2 = answers[1];
    const q4 = answers[3];
    const q6 = answers[5];
    const q10 = answers[9];

    const parts = [];
    if (q1 === 'Often anxious or overwhelmed' || q2 === 'Often' || q2 === 'Almost always') {
      parts.push('Stress has been showing up more frequently lately.');
    }
    if (q4 === 'I struggle to fall or stay asleep' || q4 === 'My sleep feels very disrupted') {
      parts.push('Sleep has felt inconsistent and may need extra support.');
    }
    if (q6 === 'Mostly isolated' || q6 === 'Very isolated') {
      parts.push('Connection might feel harder to access right now.');
    }
    if (!parts.length) {
      parts.push('You are noticing a mix of steady and shifting moments.');
    }

    if (q10 === 'Very ready') {
      parts.push('This can be a good time to try one small practice.');
    } else if (q10 === 'Not ready yet') {
      parts.push('Go at your own pace and start with gentle steps when you are ready.');
    } else {
      parts.push('Small, consistent check-ins can help you build momentum.');
    }

    return parts.join(' ');
  }, [answers]);

  const handleAnswer = (value) => {
    setAnswers((prev) => {
      const next = [...prev];
      next[currentStep] = value;
      return next;
    });
  };

  const handleSubmit = () => {
    const payload = {
      answers,
      focus_areas: focusAreas,
      created_at: new Date().toISOString(),
    };
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(payload));
    setShowResults(true);
  };

  if (showResults) {
    return (
      <div className="wellness-page">
        <SectionIntro
          badgeText="Wellness Self-Check"
          heading="Discover Your Wellness Snapshot"
          subheading="A quick self-reflection assessment designed to help you understand your current emotional and mental wellbeing."
          supportingText="This short check-in highlights areas you may want to focus on and suggests personalized next steps. This is not a medical diagnosis - just a tool to guide your self-care journey."
          className="center-card"
        />
        <ResultsPanel summary={summary} focusAreas={focusAreas} />
      </div>
    );
  }

  return (
    <div className="wellness-page">
      <SectionIntro
        badgeText="Wellness Self-Check"
        heading="Discover Your Wellness Snapshot"
        subheading="A quick self-reflection assessment designed to help you understand your current emotional and mental wellbeing."
        supportingText="This short check-in highlights areas you may want to focus on and suggests personalized next steps. This is not a medical diagnosis - just a tool to guide your self-care journey."
        className="center-card"
      />

      <div className="assessment-progress">
        <div className="progress-track">
          <div className="progress-fill" style={{ width: `${progress}%` }} />
        </div>
        <span>
          {isReview ? 'Review' : `Question ${currentStep + 1} of ${QUESTIONS.length}`}
        </span>
      </div>

      {!isReview ? (
        <QuestionCard
          stepLabel={`Question ${currentStep + 1}`}
          question={QUESTIONS[currentStep].question}
          options={QUESTIONS[currentStep].options}
          value={answers[currentStep]}
          onChange={handleAnswer}
        />
      ) : (
        <div className="assessment-card review-card">
          <h2>Review your responses</h2>
          <div className="review-list">
            {QUESTIONS.map((item, index) => (
              <div key={item.id} className="review-item">
                <div>
                  <p className="review-question">{item.question}</p>
                  <p className="review-answer">{answers[index] || 'No response selected'}</p>
                </div>
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => setCurrentStep(index)}
                >
                  Edit
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="assessment-actions">
        <button
          type="button"
          className="btn-secondary"
          onClick={() => setCurrentStep((prev) => Math.max(0, prev - 1))}
          disabled={currentStep === 0}
        >
          Back
        </button>
        {!isReview ? (
          <button
            type="button"
            className="btn-primary"
            onClick={() => setCurrentStep((prev) => Math.min(QUESTIONS.length, prev + 1))}
            disabled={!answers[currentStep]}
          >
            Next
          </button>
        ) : (
          <button type="button" className="btn-primary" onClick={handleSubmit}>
            Submit Assessment
          </button>
        )}
      </div>
    </div>
  );
}
