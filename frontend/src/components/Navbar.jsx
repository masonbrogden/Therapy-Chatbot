import React, { useEffect, useRef, useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import './Navbar.css';

export default function Navbar() {
  const { language, changeLanguage } = useLanguage();
  const { user, signOut } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);
  const navigate = useNavigate();
  const languageOptions = [
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

  const dropdownItems = [
    { to: '/sessions', label: 'Sessions' },
    { to: '/mood', label: 'Check-In' },
    { to: '/plan', label: 'My Plan' },
    { to: '/exercises', label: 'Exercises' },
    { to: '/contact', label: 'Contact' },
    { to: '/privacy', label: 'Privacy' },
    { to: '/profile', label: 'Profile' },
  ];

  useEffect(() => {
    if (!menuOpen) return undefined;
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setMenuOpen(false);
      }
    };
    const handleEscape = (event) => {
      if (event.key === 'Escape') {
        setMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEscape);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [menuOpen]);

  const getLinkClass = ({ isActive }) => (isActive ? 'nav-link active' : 'nav-link');
  const getDropdownClass = ({ isActive }) =>
    isActive ? 'dropdown-link active' : 'dropdown-link';

  const handleSignOut = async () => {
    await signOut();
    navigate('/login', { replace: true });
  };

  return (
    <nav className="navbar">
      <div className="navbar-container">
        <div className="navbar-left">
          <Link to="/" className="navbar-logo">
            <img className="navbar-logo-img" src="/logo.png" alt="EchoMind logo" />
            <span>EchoMind</span>
          </Link>
          <ul className="nav-menu">
            <li className="nav-item">
              <NavLink to="/chat" className={getLinkClass}>
                Chat
              </NavLink>
            </li>
            <li className="nav-item">
              <NavLink to="/journal" className={getLinkClass}>
                Journal
              </NavLink>
            </li>
            <li className="nav-item">
              <NavLink to="/wellness-assessment" className={getLinkClass}>
                Wellness Assessment
              </NavLink>
            </li>
            <li className="nav-item">
              <NavLink to="/crisis" className={getLinkClass}>
                Crisis Support
              </NavLink>
            </li>
          </ul>
        </div>

        <div className="navbar-actions">
          {user ? (
            <div className="navbar-auth">
              <span className="navbar-user">{user.email || 'Signed in'}</span>
              <button type="button" className="navbar-auth-btn" onClick={handleSignOut}>
                Sign Out
              </button>
            </div>
          ) : (
            <Link to="/login" className="navbar-auth-link">Sign In</Link>
          )}

          <div className="navbar-language">
            <select value={language} onChange={(e) => changeLanguage(e.target.value)}>
              {languageOptions.map((option) => (
                <option key={option.code} value={option.code}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          <div className="navbar-menu" ref={menuRef}>
            <button
              type="button"
              className="hamburger-btn"
              aria-haspopup="menu"
              aria-expanded={menuOpen}
              aria-controls="navbar-dropdown"
              onClick={() => setMenuOpen((prev) => !prev)}
            >
              <span aria-hidden="true">☰</span>
              <span className="sr-only">Open menu</span>
            </button>
            <div
              id="navbar-dropdown"
              className={`nav-dropdown ${menuOpen ? 'open' : ''}`}
              role="menu"
            >
              <div className="dropdown-section mobile-only">
                <NavLink
                  to="/chat"
                  className={getDropdownClass}
                  role="menuitem"
                  onClick={() => setMenuOpen(false)}
                >
                  Chat
                </NavLink>
                <NavLink
                  to="/crisis"
                  className="dropdown-link emphasis"
                  role="menuitem"
                  onClick={() => setMenuOpen(false)}
                >
                  Crisis Support
                </NavLink>
              </div>
              <div className="dropdown-section">
                {dropdownItems.map((item) => (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    className={getDropdownClass}
                    role="menuitem"
                    onClick={() => setMenuOpen(false)}
                  >
                    {item.label}
                  </NavLink>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
}
