import React, { useState, useEffect } from 'react';
import ExerciseCard from '../components/ExerciseCard';
import LoadingSpinner from '../components/LoadingSpinner';
import * as api from '../services/api';
import { getSessionId } from '../utils/session';
import './Exercises.css';

const FALLBACK_EXERCISES = [
  {
    id: 1,
    slug: 'box-breathing',
    title: 'Box Breathing',
    category: 'Breathing',
    duration_minutes: 5,
    description:
      'A calming breathing technique: inhale, hold, exhale, hold in equal counts.',
    steps: [
      {
        number: 1,
        instruction: 'Find a comfortable seated position. You can close your eyes if comfortable.',
      },
      {
        number: 2,
        instruction: 'Breathe in slowly through your nose for a count of 4.',
      },
      {
        number: 3,
        instruction: 'Hold your breath for a count of 4.',
      },
      {
        number: 4,
        instruction: 'Exhale slowly through your mouth for a count of 4.',
      },
      {
        number: 5,
        instruction: 'Hold the empty breath for a count of 4.',
      },
      {
        number: 6,
        instruction: 'Repeat this cycle 5-10 times, or until you feel calmer.',
      },
    ],
  },
  {
    id: 2,
    slug: '5-4-3-2-1-grounding',
    title: '5-4-3-2-1 Grounding Technique',
    category: 'Grounding',
    duration_minutes: 5,
    description:
      'Engage all five senses to anchor yourself in the present moment.',
    steps: [
      {
        number: 1,
        instruction: 'Identify 5 things you can SEE around you. Name them silently.',
      },
      {
        number: 2,
        instruction: 'Identify 4 things you can TOUCH. Feel their texture.',
      },
      {
        number: 3,
        instruction: 'Identify 3 things you can HEAR. Listen carefully.',
      },
      {
        number: 4,
        instruction: 'Identify 2 things you can SMELL (or imagine).',
      },
      {
        number: 5,
        instruction: 'Identify 1 thing you can TASTE.',
      },
    ],
  },
  {
    id: 3,
    slug: 'gratitude-journaling',
    title: 'Gratitude Journaling',
    category: 'Journaling',
    duration_minutes: 10,
    description: 'Reflect on things you are grateful for, no matter how small.',
    steps: [
      {
        number: 1,
        instruction: 'Find a quiet space and a notebook or device where you can write.',
      },
      {
        number: 2,
        instruction: 'Write at the top: "Today I am grateful for..."',
      },
      {
        number: 3,
        instruction: 'List 3 things you are grateful for. They can be big or small.',
      },
      {
        number: 4,
        instruction: 'For each item, write a sentence about why you are grateful for it.',
      },
      {
        number: 5,
        instruction: 'Pause and notice how you feel. Gratitude shifts our perspective.',
      },
    ],
  },
  {
    id: 4,
    slug: 'cbt-thought-reframe',
    title: 'CBT Thought Reframe',
    category: 'Cognitive',
    duration_minutes: 10,
    description: 'Challenge unhelpful thoughts by examining evidence and reframing.',
    steps: [
      {
        number: 1,
        instruction: 'Identify a negative thought you are having. Write it down.',
      },
      {
        number: 2,
        instruction: 'Ask: "What evidence do I have for this thought?"',
      },
      {
        number: 3,
        instruction: 'Ask: "What evidence do I have against this thought?"',
      },
      {
        number: 4,
        instruction:
          'Create a more balanced thought. Example: instead of "I always fail," try "I am learning and sometimes struggle."',
      },
      {
        number: 5,
        instruction: 'Repeat the balanced thought. Notice how it feels different.',
      },
    ],
  },
  {
    id: 5,
    slug: 'dbt-wise-mind',
    title: 'DBT Wise Mind Exercise',
    category: 'Emotion Regulation',
    duration_minutes: 10,
    description: 'Balance emotion and logic to access your inner wisdom.',
    steps: [
      {
        number: 1,
        instruction: 'Sit comfortably. Place your hand on your heart.',
      },
      {
        number: 2,
        instruction: 'Notice your emotion mind: "What do I feel right now?"',
      },
      {
        number: 3,
        instruction: 'Notice your logical mind: "What do the facts say?"',
      },
      {
        number: 4,
        instruction:
          'Now access your wise mind, the balance of both. Ask: "What is my wisest choice right now?"',
      },
      {
        number: 5,
        instruction: 'Trust that answer. Your wise mind integrates emotion and logic.',
      },
    ],
  },
  {
    id: 6,
    slug: 'progressive-muscle-relaxation',
    title: 'Progressive Muscle Relaxation',
    category: 'Relaxation',
    duration_minutes: 10,
    description: 'Release tension by tightening and relaxing muscle groups in sequence.',
    steps: [
      {
        number: 1,
        instruction: 'Sit or lie down comfortably. Take a slow breath in and out.',
      },
      {
        number: 2,
        instruction: 'Tighten the muscles in your feet for 5 seconds, then release.',
      },
      {
        number: 3,
        instruction: 'Tighten your calves for 5 seconds, then release.',
      },
      {
        number: 4,
        instruction: 'Tighten your thighs and hips for 5 seconds, then release.',
      },
      {
        number: 5,
        instruction: 'Tighten your shoulders, arms, and hands for 5 seconds, then release.',
      },
      {
        number: 6,
        instruction: 'Tighten your jaw and face for 5 seconds, then release and breathe slowly.',
      },
    ],
  },
];

const normalizeExercises = (data) => {
  if (Array.isArray(data)) return data;
  if (data && Array.isArray(data.exercises)) return data.exercises;
  return [];
};

const getFallbackExercise = (slug) =>
  FALLBACK_EXERCISES.find((exercise) => exercise.slug === slug) || null;

export default function Exercises() {
  const sessionId = getSessionId();
  const [exercises, setExercises] = useState([]);
  const [selectedExercise, setSelectedExercise] = useState(null);
  const [loading, setLoading] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [completed, setCompleted] = useState(false);
  const [mode, setMode] = useState('scripted');
  const [guidedStep, setGuidedStep] = useState(null);
  const [progress, setProgress] = useState([]);
  const [error, setError] = useState('');

  useEffect(() => {
    loadExercises();
    loadProgress();
  }, []);

  const loadExercises = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await api.getAllExercises();
      const exercisesData = normalizeExercises(response.data);
      setExercises(exercisesData.length ? exercisesData : FALLBACK_EXERCISES);
    } catch (error) {
      console.error('Failed to load exercises:', error);
      setError('');
      setExercises(FALLBACK_EXERCISES);
    } finally {
      setLoading(false);
    }
  };

  const loadProgress = async () => {
    try {
      const response = await api.getExerciseProgress();
      setProgress(response.data || []);
    } catch (error) {
      setProgress([]);
    }
  };

  const openExercise = async (slug) => {
    const fallbackExercise = getFallbackExercise(slug);
    try {
      setLoading(true);
      setError('');
      const response = await api.getExerciseDetail(slug);
      const detail = response.data || fallbackExercise;
      const detailWithSteps =
        detail && detail.steps && detail.steps.length
          ? detail
          : fallbackExercise || detail;
      if (!detailWithSteps) {
        throw new Error('Exercise details missing.');
      }
      setSelectedExercise(detailWithSteps);
      setCurrentStep(0);
      setCompleted(false);
      setGuidedStep(null);
    } catch (error) {
      console.error('Failed to load exercise:', error);
      if (fallbackExercise) {
        setSelectedExercise(fallbackExercise);
        setCurrentStep(0);
        setCompleted(false);
        setGuidedStep(null);
      } else {
        setError('Unable to load this exercise.');
      }
    } finally {
      setLoading(false);
    }
  };

  const loadGuidedStep = async (index) => {
    if (!selectedExercise) return;
    try {
      const response = await api.getGuidedExerciseStep(selectedExercise.slug, index, mode);
      setGuidedStep(response.data);
    } catch (error) {
      const fallbackStep = (selectedExercise.steps || [])[index];
      if (fallbackStep) {
        setGuidedStep({
          title: `Step ${fallbackStep.number}`,
          text: fallbackStep.instruction,
          timer_seconds: null,
        });
      } else {
        setGuidedStep(null);
      }
    }
  };

  useEffect(() => {
    if (selectedExercise && mode === 'ai') {
      loadGuidedStep(currentStep);
    }
  }, [selectedExercise, currentStep, mode]);

  const markComplete = async () => {
    if (!selectedExercise) return;
    try {
      await api.completeExercise(selectedExercise.slug, sessionId);
      setCompleted(true);
      loadProgress();
    } catch (error) {
      console.error('Failed to record completion:', error);
      setError('Unable to mark this exercise complete. Please try again.');
    }
  };

  if (selectedExercise) {
    const steps = selectedExercise.steps || [];
    const currentStepData = steps[currentStep];

    return (
      <div className="exercise-detail">
        <button onClick={() => setSelectedExercise(null)} className="btn-back">
          Back to Exercises
        </button>
        {error && <p className="exercise-error">{error}</p>}

        <div className="exercise-header">
          <h1>{selectedExercise.title}</h1>
          <p>{selectedExercise.description}</p>
          <span className="exercise-badge">{selectedExercise.category}</span>
          <div className="exercise-mode">
            <button
              className={mode === 'scripted' ? 'active' : ''}
              onClick={() => {
                setMode('scripted');
                setGuidedStep(null);
              }}
            >
              Scripted
            </button>
          </div>
        </div>

        <div className="exercise-progress">
          <div className="progress-bar">
            <div
              className="progress-fill"
              style={{ width: `${steps.length ? ((currentStep + 1) / steps.length) * 100 : 0}%` }}
            ></div>
          </div>
          <p>Step {steps.length ? currentStep + 1 : 0} of {steps.length}</p>
        </div>

        <div className="exercise-step">
          {mode === 'ai' ? (
            <div className="guided-step">
              <h2>{guidedStep?.title || `Step ${currentStep + 1}`}</h2>
              <p className="step-instruction">
                {guidedStep?.text || 'Preparing your guided step...'}
              </p>
            </div>
          ) : currentStepData ? (
            <>
              <h2>Step {currentStepData.number}</h2>
              <p className="step-instruction">{currentStepData.instruction}</p>
              {selectedExercise.slug === 'box-breathing' && currentStepData.number === 1 ? (
                <img
                  className="step-image"
                  src="/eyesclose.jpg"
                  alt="Relaxed person with eyes closed"
                  loading="lazy"
                />
              ) : null}
              {selectedExercise.slug === 'box-breathing' && currentStepData.number === 2 ? (
                <img
                  className="step-image"
                  src="/breathe.jpg"
                  alt="Breathing guidance"
                  loading="lazy"
                />
              ) : null}
              {selectedExercise.slug === 'box-breathing' && currentStepData.number === 3 ? (
                <img
                  className="step-image"
                  src="/hold.webp"
                  alt="Hold the breath"
                  loading="lazy"
                />
              ) : null}
              {selectedExercise.slug === 'box-breathing' && currentStepData.number === 4 ? (
                <img
                  className="step-image"
                  src="/breathe%20out.jpg"
                  alt="Breathe out slowly"
                  loading="lazy"
                />
              ) : null}
              {selectedExercise.slug === 'box-breathing' && currentStepData.number === 5 ? (
                <img
                  className="step-image"
                  src="/holdd2.avif"
                  alt="Hold the empty breath"
                  loading="lazy"
                />
              ) : null}
              {selectedExercise.slug === 'box-breathing' && currentStepData.number === 6 ? (
                <img
                  className="step-image"
                  src="/repeat.png"
                  alt="Repeat the breathing cycle"
                  loading="lazy"
                />
              ) : null}
              {selectedExercise.slug === '5-4-3-2-1-grounding' && currentStepData.number === 1 ? (
                <img
                  className="step-image"
                  src="/looka.jpg"
                  alt="Look around"
                  loading="lazy"
                />
              ) : null}
              {selectedExercise.slug === '5-4-3-2-1-grounding' && currentStepData.number === 2 ? (
                <img
                  className="step-image"
                  src="/touch.webp"
                  alt="Touch something nearby"
                  loading="lazy"
                />
              ) : null}
              {selectedExercise.slug === '5-4-3-2-1-grounding' && currentStepData.number === 3 ? (
                <img
                  className="step-image"
                  src="/hear2.jpg"
                  alt="Listen carefully"
                  loading="lazy"
                />
              ) : null}
              {selectedExercise.slug === '5-4-3-2-1-grounding' && currentStepData.number === 4 ? (
                <img
                  className="step-image"
                  src="/smell.jpg"
                  alt="Notice a scent"
                  loading="lazy"
                />
              ) : null}
              {selectedExercise.slug === '5-4-3-2-1-grounding' && currentStepData.number === 5 ? (
                <img
                  className="step-image"
                  src="/taste.avif"
                  alt="Notice a taste"
                  loading="lazy"
                />
              ) : null}
              {selectedExercise.slug === 'gratitude-journaling' && currentStepData.number === 1 ? (
                <img
                  className="step-image"
                  src="/notebook.png"
                  alt="Open a notebook for journaling"
                  loading="lazy"
                />
              ) : null}
              {selectedExercise.slug === 'gratitude-journaling' && currentStepData.number === 2 ? (
                <img
                  className="step-image"
                  src="/top.jpeg"
                  alt="Write the gratitude prompt at the top"
                  loading="lazy"
                />
              ) : null}
              {selectedExercise.slug === 'gratitude-journaling' && currentStepData.number === 3 ? (
                <img
                  className="step-image"
                  src="/three.jpg"
                  alt="List three things you are grateful for"
                  loading="lazy"
                />
              ) : null}
              {selectedExercise.slug === 'gratitude-journaling' && currentStepData.number === 4 ? (
                <img
                  className="step-image"
                  src="/grateful.jpg"
                  alt="Write why each item matters"
                  loading="lazy"
                />
              ) : null}
              {selectedExercise.slug === 'gratitude-journaling' && currentStepData.number === 5 ? (
                <img
                  className="step-image"
                  src="/lastjj.jpg"
                  alt="Pause and notice how you feel"
                  loading="lazy"
                />
              ) : null}
              {selectedExercise.slug === 'cbt-thought-reframe' && currentStepData.number === 1 ? (
                <img
                  className="step-image"
                  src="/1.webp"
                  alt="Identify the negative thought"
                  loading="lazy"
                />
              ) : null}
              {selectedExercise.slug === 'cbt-thought-reframe' && currentStepData.number === 2 ? (
                <img
                  className="step-image"
                  src="/2.jpg"
                  alt="Evidence for the thought"
                  loading="lazy"
                />
              ) : null}
              {selectedExercise.slug === 'cbt-thought-reframe' && currentStepData.number === 3 ? (
                <img
                  className="step-image"
                  src="/3.webp"
                  alt="Evidence against the thought"
                  loading="lazy"
                />
              ) : null}
              {selectedExercise.slug === 'cbt-thought-reframe' && currentStepData.number === 4 ? (
                <img
                  className="step-image"
                  src="/4.jpg"
                  alt="Create a balanced thought"
                  loading="lazy"
                />
              ) : null}
              {selectedExercise.slug === 'cbt-thought-reframe' && currentStepData.number === 5 ? (
                <img
                  className="step-image"
                  src="/5.webp"
                  alt="Repeat the balanced thought"
                  loading="lazy"
                />
              ) : null}
              {selectedExercise.slug === 'dbt-wise-mind' && currentStepData.number === 1 ? (
                <img
                  className="step-image"
                  src="/heart.jpg"
                  alt="Place a hand on your heart"
                  loading="lazy"
                />
              ) : null}
              {selectedExercise.slug === 'dbt-wise-mind' && currentStepData.number === 2 ? (
                <img
                  className="step-image"
                  src="/feel.webp"
                  alt="Notice how you feel"
                  loading="lazy"
                />
              ) : null}
              {selectedExercise.slug === 'dbt-wise-mind' && currentStepData.number === 3 ? (
                <img
                  className="step-image"
                  src="/mind.png"
                  alt="Notice the facts"
                  loading="lazy"
                />
              ) : null}
              {selectedExercise.slug === 'dbt-wise-mind' && currentStepData.number === 4 ? (
                <img
                  className="step-image"
                  src="/wise.png"
                  alt="Access wise mind"
                  loading="lazy"
                />
              ) : null}
              {selectedExercise.slug === 'dbt-wise-mind' && currentStepData.number === 5 ? (
                <img
                  className="step-image"
                  src="/last2.jpg"
                  alt="Trust the answer"
                  loading="lazy"
                />
              ) : null}
              {selectedExercise.slug === 'progressive-muscle-relaxation' &&
              currentStepData.number === 1 ? (
                <img
                  className="step-image"
                  src="/11.jpg"
                  alt="Settle into a comfortable position"
                  loading="lazy"
                />
              ) : null}
              {selectedExercise.slug === 'progressive-muscle-relaxation' &&
              currentStepData.number === 2 ? (
                <img
                  className="step-image"
                  src="/22.jpg"
                  alt="Tighten and release the feet"
                  loading="lazy"
                />
              ) : null}
              {selectedExercise.slug === 'progressive-muscle-relaxation' &&
              currentStepData.number === 3 ? (
                <img
                  className="step-image"
                  src="/33.jpeg"
                  alt="Tighten and release the calves"
                  loading="lazy"
                />
              ) : null}
              {selectedExercise.slug === 'progressive-muscle-relaxation' &&
              currentStepData.number === 4 ? (
                <img
                  className="step-image"
                  src="/44.jpg"
                  alt="Tighten and release the thighs and hips"
                  loading="lazy"
                />
              ) : null}
              {selectedExercise.slug === 'progressive-muscle-relaxation' &&
              currentStepData.number === 5 ? (
                <img
                  className="step-image"
                  src="/55.png"
                  alt="Release tension and breathe slowly"
                  loading="lazy"
                />
              ) : null}
              {selectedExercise.slug === 'progressive-muscle-relaxation' &&
              currentStepData.number === 6 ? (
                <img
                  className="step-image"
                  src="/66.webp"
                  alt="Relax your face and breathe"
                  loading="lazy"
                />
              ) : null}
            </>
          ) : (
            <p className="step-instruction">No steps available for this exercise.</p>
          )}
        </div>

        <div className="exercise-controls">
          <button
            onClick={() => setCurrentStep(Math.max(0, currentStep - 1))}
            disabled={currentStep === 0}
            className="btn-nav"
          >
            Previous
          </button>
          {currentStep < steps.length - 1 ? (
            <button
              onClick={() => setCurrentStep(currentStep + 1)}
              className="btn-nav"
            >
              Next
            </button>
          ) : (
            <div className="completion-message">
              <p>Great job! You've completed this exercise.</p>
              <button onClick={markComplete} className="btn-nav" disabled={completed}>
                {completed ? 'Completed' : 'Mark Complete'}
              </button>
            </div>
          )}
        </div>
      </div>
    );
  }

  const streak = (() => {
    if (!progress.length) return 0;
    const dates = progress
      .map((item) => item.completion_date || item.completed_at || item.created_at)
      .filter(Boolean)
      .map((value) => {
        if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value)) {
          const [year, month, day] = value.split('-').map(Number);
          return new Date(year, month - 1, day);
        }
        return new Date(value);
      });
    const dateSet = new Set(dates.map((d) => d.toDateString()));
    let count = 0;
    let current = new Date();
    while (dateSet.has(current.toDateString())) {
      count += 1;
      current.setDate(current.getDate() - 1);
    }
    return count;
  })();

  return (
    <div className="exercises-container">
      <h1>Guided Exercises</h1>
      <p>
        These guided exercises provide a safe space to reflect, reset, and build healthier
        habits. By practicing small, intentional activities, you can develop stronger
        emotional awareness, reduce anxiety, and create lasting positive change over time.
      </p>

      <div className="exercise-progress-summary">
        <div>
          <strong>Completed</strong>
          <span>{progress.length}</span>
        </div>
        <div>
          <strong>Streak</strong>
          <span>{streak} days</span>
        </div>
      </div>
      <p>Choose an exercise to get started on your wellness journey.</p>

      {loading ? (
        <LoadingSpinner />
      ) : error ? (
        <p className="exercise-error">{error}</p>
      ) : exercises.length === 0 ? (
        <p className="exercise-error">No exercises available yet.</p>
      ) : (
        <div className="exercises-grid">
          {exercises.map((exercise) => (
            <ExerciseCard
              key={exercise.slug}
              exercise={exercise}
              onClick={() => openExercise(exercise.slug)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
