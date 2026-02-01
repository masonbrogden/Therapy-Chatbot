import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';
import './Home.css';

const LANGUAGE_OPTIONS = [
  { code: 'en', label: 'English' },
  { code: 'es', label: 'Espanol' },
  { code: 'fr', label: 'Francais' },
  { code: 'de', label: 'Deutsch' },
  { code: 'it', label: 'Italiano' },
  { code: 'pt', label: 'Portugues' },
  { code: 'nl', label: 'Nederlands' },
  { code: 'sv', label: 'Svenska' },
  { code: 'pl', label: 'Polski' },
  { code: 'hu', label: 'Magyar' },
  { code: 'cs', label: 'Cestina' },
  { code: 'ro', label: 'Romana' },
  { code: 'el', label: 'Greek' },
  { code: 'tr', label: 'Turkish' },
  { code: 'ru', label: 'Russian' },
  { code: 'uk', label: 'Ukrainian' },
  { code: 'ar', label: 'Arabic' },
  { code: 'he', label: 'Hebrew' },
  { code: 'hi', label: 'Hindi' },
  { code: 'bn', label: 'Bengali' },
  { code: 'ja', label: 'Japanese' },
  { code: 'ko', label: 'Korean' },
  { code: 'zh', label: 'Chinese' },
  { code: 'vi', label: 'Vietnamese' },
  { code: 'id', label: 'Indonesian' },
  { code: 'tl', label: 'Tagalog' },
];

const SUPPORT_TOPICS = [
  {
    title: 'Anxiety & Stress',
    copy: 'Grounding prompts, breathwork, and worry mapping.',
    href: '/#topics',
  },
  {
    title: 'Depression / Low Mood',
    copy: 'Gentle check-ins and reactivation micro-goals.',
    href: '/#topics',
  },
  {
    title: 'Work-Life Balance',
    copy: 'Burnout signals, pacing, and reset plans.',
    href: '/#topics',
  },
  {
    title: 'Relationships',
    copy: 'Perspective-taking, boundaries, and repair scripts.',
    href: '/#topics',
  },
  {
    title: 'Trauma',
    copy: 'Safety-first reflections and steadying rituals.',
    href: '/#topics',
  },
  {
    title: 'Recovery & Habits',
    copy: 'Track wins, reduce triggers, and keep momentum.',
    href: '/#topics',
  },
];

const APPROACHES = [
  { title: 'CBT', copy: 'Reframe automatic thoughts into calmer actions.' },
  { title: 'DBT', copy: 'Practice mindfulness, tolerance, and wise mind.' },
  { title: 'Psychodynamic', copy: 'Notice patterns and hidden drivers.' },
  { title: 'ACT', copy: 'Commit to values while making room for emotions.' },
];

const TESTIMONIALS = [
  {
    quote:
      'On my hardest days, EchoMind helps me slow down and organize everything in my head. The prompts feel thoughtful and I leave each chat with a clearer plan and a calmer mindset.',
    name: 'Maya Collins',
    photo: '/head%204.webp',
    source: 'Early beta feedback',
  },
  {
    quote:
      'It feels like a calm, private space where I can talk things through without judgment. The guidance is gentle but practical, and it helps me find words for what I am feeling.',
    name: 'Evan Brooks',
    photo: '/2%20head-photoaidcom-cropped.webp',
    source: 'Early beta feedback',
  },
  {
    quote:
      'The check-ins keep me grounded and the daily prompts help me build small habits that actually stick. I feel more consistent and supported even when my week is hectic.',
    name: 'James Carter',
    photo: '/3%20head-photoaidcom-cropped.webp',
    source: 'Early beta feedback',
  },
];

const FAQS = [
  {
    question: 'Is EchoMind a replacement for therapy?',
    answer:
      'No. EchoMind offers supportive guidance and is not a substitute for professional care.',
  },
  {
    question: 'What happens if I am in crisis?',
    answer:
      'Use Crisis Support for immediate resources and hotlines.',
  },
  {
    question: 'How private are my conversations?',
    answer:
      'We keep privacy top-of-mind and only ask for what is needed to help you.',
  },
];

const PRIVACY_FAQS = [
  {
    question: 'What does EchoMind remember about me?',
    answer:
      'We focus on what is needed to guide the conversation and avoid collecting unnecessary personal details.',
  },
  {
    question: 'Are my chats shared with anyone?',
    answer:
      'No. Conversations stay private and are not shared or sold.',
  },
  {
    question: 'Can I delete my data?',
    answer:
      'Yes. You can request data removal at any time.',
  },
];



export default function Home() {
  const { language, changeLanguage } = useLanguage();
  const location = useLocation();
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);
  const [privacyIndex, setPrivacyIndex] = useState(0);
  const videoRef = useRef(null);

  const currentLanguage = useMemo(
    () => LANGUAGE_OPTIONS.find((option) => option.code === language),
    [language]
  );

  useEffect(() => {
    if (!location.hash) return;
    const target = document.querySelector(location.hash);
    if (target) {
      target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, [location.hash]);

  useEffect(() => {
    if (!window.matchMedia) return;
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    const updatePreference = () => setPrefersReducedMotion(mediaQuery.matches);
    updatePreference();
    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener('change', updatePreference);
      return () => mediaQuery.removeEventListener('change', updatePreference);
    }
    mediaQuery.addListener(updatePreference);
    return () => mediaQuery.removeListener(updatePreference);
  }, []);

  useEffect(() => {
    if (!videoRef.current) return;
    const video = videoRef.current;
    const tryPlay = () => {
      video.muted = true;
      video.playsInline = true;
      video.autoplay = true;
      video.loop = true;
      const playPromise = video.play();
      if (playPromise && typeof playPromise.catch === 'function') {
        playPromise.catch(() => {});
      }
    };
    video.addEventListener('canplay', tryPlay);
    tryPlay();
    return () => {
      video.removeEventListener('canplay', tryPlay);
    };
  }, []);


  return (
    <div className="home-page">
      <section className="home-hero">
        <video
          className="hero-video"
          autoPlay
          muted
          loop
          playsInline
          preload="auto"
          aria-hidden="true"
          tabIndex={-1}
          ref={videoRef}
        >
          <source src="/hero-video2.mp4" type="video/mp4" />
        </video>
        <div className="hero-overlay" aria-hidden="true" />
        <div className="hero-copy">
          <div className="hero-pill">Private. Supportive. Always on.</div>
          <h1>EchoMind - A safe space to reflect, heal, and grow.</h1>
          <p>
            Calm, guided conversations that help you steady your thoughts, practice
            healthier habits, and feel supported between therapy.
          </p>
          <div className="hero-actions">
            <Link to="/chat" className="btn-primary">
              Start Chatting
            </Link>
            <Link to="/#how-it-works" className="btn-secondary">
              See How It Works
            </Link>
          </div>
          <div className="hero-trust">
            <span>Private</span>
            <span>Anonymous</span>
            <span>Available 24/7</span>
          </div>
        </div>
        <div className="hero-card" aria-label="Today's check-in preview">
          <p className="card-title">Today's Check-in</p>
          <div className="card-snippet">
            <p>"I felt overwhelmed before my meeting."</p>
            <span>You</span>
          </div>
          <div className="card-snippet bot">
            <p>"Let's slow it down and build a small plan together."</p>
            <span>EchoMind AI</span>
          </div>
          <Link to="/mood" className="btn-primary full">
            Check in now
          </Link>
        </div>
      </section>


      <section id="how-it-works" className="home-section">
        <div className="section-header">
          <h2>How it works</h2>
          <p>Three simple steps to steady your day.</p>
        </div>
        <div className="card-grid three">
          <article className="info-card">
            <div className="card-icon">1</div>
            <h3>Share what's on your mind</h3>
            <p>Start with a feeling, a worry, or a goal for today.</p>
          </article>
          <article className="info-card">
            <div className="card-icon">2</div>
            <h3>EchoMind listens and guides</h3>
            <p>Get reflective questions, grounding, and gentle direction.</p>
          </article>
          <article className="info-card">
            <div className="card-icon">3</div>
            <h3>Build habits and track progress</h3>
            <p>Use daily check-ins and practice routines that stick.</p>
          </article>
        </div>
      </section>


      <section id="topics" className="home-section alt">
        <div className="section-header">
          <h2>Core support areas</h2>
          <p>Choose a focus and get a tailored path forward.</p>
        </div>
        <div className="support-areas-body">
          <div className="support-video-card">
            <video
              className="support-video"
              autoPlay
              muted
              loop
              playsInline
              preload="auto"
              aria-hidden="true"
            >
              <source src="/depressed.mp4" type="video/mp4" />
            </video>
          </div>
          <div className="card-grid three support-grid">
            {SUPPORT_TOPICS.map((topic) => (
              <Link key={topic.title} to={topic.href} className="info-card link-card">
                <h3>{topic.title}</h3>
                <p>{topic.copy}</p>
                <span className="card-link">Explore Topics</span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section id="therapy" className="home-section">
        <div className="section-header">
          <h2>Therapy approaches</h2>
          <p>Evidence-informed styles that match your needs.</p>
        </div>
        <div className="card-grid four">
          {APPROACHES.map((approach) => (
            <Link key={approach.title} to="/plan" className="info-card link-card">
              <h3>{approach.title}</h3>
              <p>{approach.copy}</p>
              <span className="card-link">See Therapy Plan</span>
            </Link>
          ))}
        </div>
      </section>


      <section className="home-section alt privacy">
        <div className="section-header">
          <h2>How privacy works</h2>
          <p>Clear, transparent answers before you begin.</p>
        </div>
        <div className="privacy-accordion">
          {PRIVACY_FAQS.map((item, index) => {
            const isOpen = privacyIndex === index;
            return (
              <div key={item.question} className={`privacy-item ${isOpen ? 'open' : ''}`}>
                <button
                  type="button"
                  className="privacy-toggle"
                  onClick={() => setPrivacyIndex(isOpen ? -1 : index)}
                  aria-expanded={isOpen}
                >
                  <span>{item.question}</span>
                  <span className="privacy-icon" aria-hidden="true">
                    {isOpen ? '-' : '+'}
                  </span>
                </button>
                {isOpen && <p className="privacy-answer">{item.answer}</p>}
              </div>
            );
          })}
        </div>
      </section>

      <section id="enterprise" className="home-section alt">
        <div className="section-header">
          <h2>EchoMind for teams</h2>
          <p>Bring a compassionate companion to your community.</p>
        </div>
        <div className="card-grid four">
          <article className="info-card">
            <h3>Workplaces</h3>
            <p>Offer on-demand emotional support to reduce burnout.</p>
          </article>
          <article className="info-card">
            <h3>Schools</h3>
            <p>Give students a safe check-in space outside office hours.</p>
          </article>
          <article className="info-card">
            <h3>Healthcare</h3>
            <p>Support frontline teams with reflective decompression.</p>
          </article>
          <article className="info-card">
            <h3>Community orgs</h3>
            <p>Extend care access with accessible, anonymous support.</p>
          </article>
        </div>
      </section>

      <section className="home-section">
        <div className="section-header">
          <h2>What people say</h2>
          <p>Early beta feedback from real users.</p>
        </div>
        <div className="card-grid three">
          {TESTIMONIALS.map((item, index) => (
            <article key={`${item.quote}-${index}`} className="info-card testimonial-card">
              <img
                className="testimonial-avatar"
                src={item.photo}
                alt={`Headshot of ${item.name}`}
                loading="lazy"
              />
              <h3 className="testimonial-name">{item.name}</h3>
              <p className="quote">"{item.quote}"</p>
              <span className="caption">{item.source}</span>
            </article>
          ))}
        </div>
      </section>

      <section id="languages" className="home-section alt">
        <div className="language-visual">
          <img
            src="/language%20keyboard.jpg"
            alt="Language keyboard"
            loading="lazy"
          />
          <div className="language-overlay">
            <h2>Available in 26 languages</h2>
            <p>Switch instantly for a more authentic conversation.</p>
          </div>
        </div>
        <div className="language-panel">
          <div className="language-copy">
            <p>
              Current experience language:{' '}
              <strong>{currentLanguage ? currentLanguage.label : 'English'}</strong>
            </p>
            <p className="caption">
              Your selection updates how EchoMind responds in chat.
            </p>
          </div>
          <div className="language-grid">
            {LANGUAGE_OPTIONS.map((option) => (
              <button
                key={option.code}
                type="button"
                className={`language-chip ${language === option.code ? 'active' : ''}`}
                onClick={() => changeLanguage(option.code)}
                aria-pressed={language === option.code}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>
      </section>

      <section id="faq" className="home-section">
        <div className="section-header">
          <h2>Frequently asked questions</h2>
          <p>Quick answers before you dive in.</p>
        </div>
        <div className="faq-list">
          {FAQS.map((faq) => (
            <div key={faq.question} className="faq-item">
              <h3>{faq.question}</h3>
              <p>{faq.answer}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="home-section faq-strip">
        <div>
          <h3>Need immediate help?</h3>
          <p>Visit Crisis Support for hotline resources and guidance.</p>
        </div>
        <Link to="/crisis" className="btn-secondary">
          Crisis Support
        </Link>
      </section>

      <section className="home-cta">
        <div>
          <h2>Start your first conversation with EchoMind today.</h2>
          <p>Take the first step toward steadier days.</p>
        </div>
        <div className="hero-actions">
          <Link to="/chat" className="btn-primary">
            Talk Now
          </Link>
          <Link to="/#how-it-works" className="btn-secondary">
            How it works
          </Link>
        </div>
      </section>
    </div>
  );
}
