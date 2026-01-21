import React from 'react';
import { useRouteError } from 'react-router-dom';
import './NotFound.css';

export default function NotFound() {
  const error = useRouteError();

  return (
    <div className="not-found-container">
      <h1>404</h1>
      <h2>Page Not Found</h2>
      <p>The page you're looking for doesn't exist or has been moved.</p>
      <a href="/" className="btn-home">Return Home</a>
    </div>
  );
}
