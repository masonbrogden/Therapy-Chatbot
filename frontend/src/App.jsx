import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { LanguageProvider } from './context/LanguageContext';
import { AuthProvider } from './context/AuthContext';
import Navbar from './components/Navbar';
import CrisisFloatingBtn from './components/CrisisFloatingBtn';
import ProtectedRoute from './components/ProtectedRoute';
import Home from './pages/Home';
import Chat from './pages/Chat';
import Mood from './pages/Mood';
import Plan from './pages/Plan';
import Exercises from './pages/Exercises';
import Crisis from './pages/Crisis';
import Contact from './pages/Contact';
import Privacy from './pages/Privacy';
import Login from './pages/Login';
import Sessions from './pages/Sessions';
import Profile from './pages/Profile';
import NotFound from './pages/NotFound';
import './App.css';

export default function App() {
  return (
    <Router>
      <AuthProvider>
        <LanguageProvider>
          <Navbar />
          <main className="main-content">
            <Routes>
              <Route path="/" element={<Home />} />
              <Route
                path="/chat"
                element={
                  <ProtectedRoute>
                    <Chat />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/mood"
                element={
                  <ProtectedRoute>
                    <Mood />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/plan"
                element={
                  <ProtectedRoute>
                    <Plan />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/exercises"
                element={
                  <ProtectedRoute>
                    <Exercises />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/sessions"
                element={
                  <ProtectedRoute>
                    <Sessions />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/profile"
                element={
                  <ProtectedRoute>
                    <Profile />
                  </ProtectedRoute>
                }
              />
              <Route path="/crisis" element={<Crisis />} />
              <Route
                path="/contact"
                element={
                  <ProtectedRoute>
                    <Contact />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/privacy"
                element={
                  <ProtectedRoute>
                    <Privacy />
                  </ProtectedRoute>
                }
              />
              <Route path="/login" element={<Login />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </main>
          <CrisisFloatingBtn />
        </LanguageProvider>
      </AuthProvider>
    </Router>
  );
}
