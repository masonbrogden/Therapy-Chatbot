import React, { useEffect, useRef, useState } from 'react';
import { RecaptchaVerifier } from 'firebase/auth';
import { useAuth } from '../context/AuthContext';
import { auth } from '../firebase';
import './Login.css';

export default function Login() {
  const {
    user,
    loading,
    signIn,
    signInWithGoogle,
    signInWithPhone,
    signUp,
    signOutUser,
  } = useAuth();
  const [isSignUp, setIsSignUp] = useState(false);
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [phoneData, setPhoneData] = useState({ phone: '', code: '' });
  const [confirmation, setConfirmation] = useState(null);
  const [status, setStatus] = useState({ error: '', busy: false });
  const recaptchaRef = useRef(null);

  useEffect(() => {
    if (loading || user || !auth || recaptchaRef.current) {
      return undefined;
    }
    recaptchaRef.current = new RecaptchaVerifier(auth, 'phone-recaptcha', {
      size: 'normal',
    });
    recaptchaRef.current.render().catch(() => {});
    return () => {
      if (recaptchaRef.current) {
        recaptchaRef.current.clear();
        recaptchaRef.current = null;
      }
    };
  }, [loading, user]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus({ error: '', busy: true });
    try {
      if (isSignUp) {
        await signUp(formData.email, formData.password);
      } else {
        await signIn(formData.email, formData.password);
      }
    } catch (err) {
      setStatus({ error: err.message || 'Authentication failed.', busy: false });
      return;
    }
    setStatus({ error: '', busy: false });
  };

  const handleGoogleSignIn = async () => {
    setStatus({ error: '', busy: true });
    try {
      await signInWithGoogle();
    } catch (err) {
      setStatus({ error: err.message || 'Google sign-in failed.', busy: false });
      return;
    }
    setStatus({ error: '', busy: false });
  };

  const handlePhoneChange = (e) => {
    const { name, value } = e.target;
    setPhoneData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSendCode = async () => {
    setStatus({ error: '', busy: true });
    try {
      if (!recaptchaRef.current) {
        throw new Error('reCAPTCHA not ready. Please try again.');
      }
      const result = await signInWithPhone(phoneData.phone, recaptchaRef.current);
      setConfirmation(result);
    } catch (err) {
      setStatus({ error: err.message || 'Phone sign-in failed.', busy: false });
      return;
    }
    setStatus({ error: '', busy: false });
  };

  const handleVerifyCode = async () => {
    setStatus({ error: '', busy: true });
    try {
      if (!confirmation) {
        throw new Error('Please request a verification code first.');
      }
      await confirmation.confirm(phoneData.code);
      setConfirmation(null);
      setPhoneData({ phone: '', code: '' });
    } catch (err) {
      setStatus({ error: err.message || 'Code verification failed.', busy: false });
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
    return (
      <div className="login-container">
        <h1>Account</h1>
        <p className="login-subtitle">Signed in as {user.email || 'User'}.</p>
        <button className="login-button" onClick={signOutUser}>
          Sign Out
        </button>
      </div>
    );
  }

  return (
    <div className="login-container">
      <h1>{isSignUp ? 'Create Account' : 'Sign In'}</h1>
      <p className="login-subtitle">
        {isSignUp
          ? 'Create an account to keep your session across devices.'
          : 'Sign in to continue your journey.'}
      </p>

      <form className="login-form" onSubmit={handleSubmit}>
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
          autoComplete={isSignUp ? 'new-password' : 'current-password'}
          required
        />

        {status.error ? <div className="login-error">{status.error}</div> : null}

        <button className="login-button" type="submit" disabled={status.busy}>
          {status.busy ? 'Please wait...' : isSignUp ? 'Create Account' : 'Sign In'}
        </button>
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

      <div className="login-divider">or</div>

      <div className="login-phone">
        <label htmlFor="phone">Phone number</label>
        <input
          id="phone"
          name="phone"
          type="tel"
          value={phoneData.phone}
          onChange={handlePhoneChange}
          placeholder="+1 555 123 4567"
          autoComplete="tel"
          required
        />
        <div className="login-phone-actions">
          <button
            className="login-button"
            type="button"
            onClick={handleSendCode}
            disabled={status.busy || !phoneData.phone}
          >
            Send code
          </button>
        </div>
        <div id="phone-recaptcha" className="recaptcha-container" />
        {confirmation ? (
          <>
            <label htmlFor="code">Verification code</label>
            <input
              id="code"
              name="code"
              type="text"
              value={phoneData.code}
              onChange={handlePhoneChange}
              placeholder="123456"
              autoComplete="one-time-code"
            />
            <button
              className="login-button"
              type="button"
              onClick={handleVerifyCode}
              disabled={status.busy || !phoneData.code}
            >
              Verify code
            </button>
          </>
        ) : null}
      </div>

      <button
        className="login-link"
        type="button"
        onClick={() => setIsSignUp((prev) => !prev)}
      >
        {isSignUp ? 'Already have an account? Sign in' : 'New here? Create an account'}
      </button>
    </div>
  );
}
