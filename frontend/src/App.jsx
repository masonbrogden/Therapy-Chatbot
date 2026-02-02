import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { LanguageProvider } from './context/LanguageContext';
import { AuthProvider } from './context/AuthContext';
import AppLayout from './components/AppLayout';
import FullscreenLayout from './components/FullscreenLayout';
import ChatGate from './components/ChatGate';
import ProtectedRoute from './components/ProtectedRoute';
import Home from './pages/Home';
import Chat from './pages/Chat';
import ChatOnboarding from './pages/ChatOnboarding';
import Mood from './pages/Mood';
import Plan from './pages/Plan';
import Exercises from './pages/Exercises';
import Journal from './pages/Journal';
import WellnessAssessment from './pages/WellnessAssessment';
import Crisis from './pages/Crisis';
import Contact from './pages/Contact';
import Privacy from './pages/Privacy';
import Login from './pages/Login';
import AuthCallback from './pages/AuthCallback';
import Signup from './pages/Signup';
import Sessions from './pages/Sessions';
import Profile from './pages/Profile';
import NotFound from './pages/NotFound';
import './App.css';

export default function App() {
  return (
    <Router>
      <AuthProvider>
        <LanguageProvider>
          <Routes>
            <Route path="/auth/callback" element={<AuthCallback />} />
            <Route element={<AppLayout />}>
              <Route path="/" element={<Home />} />
              <Route
                path="/chat"
                element={
                  <ProtectedRoute>
                    <ChatGate />
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
                path="/journal"
                element={
                  <ProtectedRoute>
                    <Journal />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/wellness-assessment"
                element={
                  <ProtectedRoute>
                    <WellnessAssessment />
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
              <Route path="/signup" element={<Signup />} />
              <Route path="*" element={<NotFound />} />
            </Route>
            <Route element={<FullscreenLayout />}>
              <Route
                path="/chat/onboarding"
                element={
                  <ProtectedRoute>
                    <ChatOnboarding />
                  </ProtectedRoute>
                }
              />
            </Route>
          </Routes>
        </LanguageProvider>
      </AuthProvider>
    </Router>
  );
}
