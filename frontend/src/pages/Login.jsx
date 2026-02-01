import React, { useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './Login.css';

export default function Login() {
  const { user, loading, signIn, signInWithGooglePopup, authError } = useAuth();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [status, setStatus] = useState({ error: '', busy: false });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleAuth = async () => {
    if (!formData.email.trim() || !formData.password) {
      setStatus({ error: 'Email and password are required.', busy: false });
      return;
    }
    setStatus({ error: '', busy: true });
    try {
      const { error } = await signIn(formData.email, formData.password);
      if (error) throw error;
    } catch (err) {
      setStatus({ error: err.message || 'Authentication failed.', busy: false });
      return;
    }
    setStatus({ error: '', busy: false });
  };

  const handleGoogleSignIn = async () => {
    setStatus({ error: '', busy: true });
    try {
      await signInWithGooglePopup();
    } catch (err) {
      setStatus({ error: err.message || 'Google sign-in failed.', busy: false });
      return;
    }
    setStatus({ error: '', busy: false });
  };

  if (loading) {
    return (
      <div className="login-container">
        <h1>Loading...</h1>
      </div>
    );
  }

  if (user) {
    return <Navigate to="/chat" replace />;
  }

  return (
    <div className="login-container">
      <h1>Welcome back</h1>
      <p className="login-subtitle">Sign in or create a new account to continue.</p>

      <form className="login-form" onSubmit={(e) => e.preventDefault()}>
        <label htmlFor="email">Email</label>
        <input
          id="email"
          name="email"
          type="email"
          value={formData.email}
          onChange={handleChange}
          placeholder="you@example.com"
          autoComplete="email"
          required
        />

        <label htmlFor="password">Password</label>
        <input
          id="password"
          name="password"
          type="password"
          value={formData.password}
          onChange={handleChange}
          placeholder="Password"
          autoComplete="current-password"
          required
        />

        {status.error || authError ? (
          <div className="login-error">{status.error || authError}</div>
        ) : null}

        <div className="login-actions">
          <button
            className="login-button"
            type="button"
            onClick={handleAuth}
            disabled={status.busy}
          >
            {status.busy ? 'Please wait...' : 'Sign In'}
          </button>
          <button
            className="login-button"
            type="button"
            onClick={() => navigate('/signup')}
            disabled={status.busy}
          >
            Sign Up
          </button>
        </div>
      </form>

      <div className="login-divider">or</div>

      <button
        className="login-button login-button-google"
        type="button"
        onClick={handleGoogleSignIn}
        disabled={status.busy}
      >
        Continue with Google
      </button>
    </div>
  );
}
