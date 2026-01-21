import React from 'react';
import './ExerciseCard.css';

export default function ExerciseCard({ exercise, onClick }) {
  return (
    <div className="exercise-card" onClick={onClick}>
      <h3>{exercise.title}</h3>
      <p className="exercise-category">{exercise.category}</p>
      <p className="exercise-description">{exercise.description}</p>
      <p className="exercise-duration">{exercise.duration_minutes} minutes</p>
      <button className="btn-start">Start Exercise</button>
    </div>
  );
}
