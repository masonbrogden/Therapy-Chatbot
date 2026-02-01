import React, { useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';
import { useAuth } from '../context/AuthContext';
import './Login.css';

export default function Signup() {
  const { user, loading, authError } = useAuth();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [status, setStatus] = useState({ error: '', success: '', busy: false });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const validate = () => {
    if (!formData.fullName.trim() || !formData.email.trim() || !formData.password) {
      return 'Full name, email, and password are required.';
    }
    if (formData.password !== formData.confirmPassword) {
      return 'Passwords do not match.';
    }
    return '';
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const validationError = validate();
    if (validationError) {
      setStatus({ error: validationError, success: '', busy: false });
      return;
    }

    setStatus({ error: '', success: '', busy: true });
    const { data, error } = await supabase.auth.signUp({
      email: formData.email,
      password: formData.password,
    });

    if (error) {
      setStatus({ error: error.message, success: '', busy: false });
      return;
    }

    if (data?.user?.id) {
      const { error: profileError } = await supabase.from('profiles').upsert({
        id: data.user.id,
        full_name: formData.fullName.trim(),
      });
      if (profileError) {
        const missingTable =
          profileError.message &&
          profileError.message.toLowerCase().includes("could not find the table 'public.profiles'");
        if (!missingTable) {
          setStatus({
            error: profileError.message,
            success: '',
            busy: false,
          });
          return;
        }
      }
    }

    if (!data?.session) {
      setStatus({
        error: '',
        success: 'Check your email to confirm your account.',
        busy: false,
      });
      return;
    }

    navigate('/chat', { replace: true });
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
      <h1>Create your account</h1>
      <p className="login-subtitle">Start your journey with a secure account.</p>

      <form className="login-form" onSubmit={handleSubmit}>
        <label htmlFor="fullName">Full name</label>
        <input
          id="fullName"
          name="fullName"
          type="text"
          value={formData.fullName}
          onChange={handleChange}
          placeholder="Your name"
          autoComplete="name"
          required
        />

        <label htmlFor="signupEmail">Email</label>
        <input
          id="signupEmail"
          name="email"
          type="email"
          value={formData.email}
          onChange={handleChange}
          placeholder="you@example.com"
          autoComplete="email"
          required
        />

        <label htmlFor="signupPassword">Password</label>
        <input
          id="signupPassword"
          name="password"
          type="password"
          value={formData.password}
          onChange={handleChange}
          placeholder="Password"
          autoComplete="new-password"
          required
        />

        <label htmlFor="confirmPassword">Confirm password</label>
        <input
          id="confirmPassword"
          name="confirmPassword"
          type="password"
          value={formData.confirmPassword}
          onChange={handleChange}
          placeholder="Repeat password"
          autoComplete="new-password"
          required
        />

        {status.error || authError ? (
          <div className="login-error">{status.error || authError}</div>
        ) : null}
        {status.success ? <div className="login-success">{status.success}</div> : null}

        <button className="login-button" type="submit" disabled={status.busy}>
          {status.busy ? 'Creating account...' : 'Create account'}
        </button>
      </form>

      <button className="login-link" type="button" onClick={() => navigate('/login')}>
        Already have an account? Sign in
      </button>
    </div>
  );
}
