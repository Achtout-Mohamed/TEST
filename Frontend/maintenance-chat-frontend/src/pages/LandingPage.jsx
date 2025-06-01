// src/pages/LandingPage.jsx
import React from 'react';
import { Link } from 'react-router-dom';
import './LandingPage.css';

const LandingPage = () => {
  return (
    <div className="landing-container">
      {/* Animated background shapes */}
      <div className="geometric-shapes">
        <div className="shape"></div>
        <div className="shape"></div>
        <div className="shape"></div>
      </div>

      <header className="landing-header">
        <div className="logo-container">
          <div className="logo-icon">
            <svg viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M20 3C10.6 3 3 10.6 3 20C3 29.4 10.6 37 20 37C29.4 37 37 29.4 37 20C37 10.6 29.4 3 20 3ZM11 16C11 14.9 11.9 14 13 14C14.1 14 15 14.9 15 16C15 17.1 14.1 18 13 18C11.9 18 11 17.1 11 16ZM20 26C17.2 26 14.8 24.4 13.8 22H26.2C25.2 24.4 22.8 26 20 26ZM27 18C25.9 18 25 17.1 25 16C25 14.9 25.9 14 27 14C28.1 14 29 14.9 29 16C29 17.1 28.1 18 27 18Z" fill="currentColor"/>
            </svg>
          </div>
          <h1 className="logo-text">Ovivia</h1>
        </div>
        <nav className="landing-nav">
          <Link to="/about" className="nav-link">About Us</Link>
          <Link to="/register" className="signup-button">Sign Up</Link>
          <Link to="/login" className="login-button">Login</Link>
        </nav>
      </header>

      <main className="landing-content">
        <div className="hero-text">
          <h2 className="hero-title">OVIVIA AI</h2>
          <h3 className="hero-subtitle">Maintenance Intelligence Platform</h3>
          <p className="hero-description">
            Transform your maintenance operations with AI-powered assistance. Get instant technical guidance, 
            streamline team communication, and preserve critical maintenance knowledg all through an 
            intelligent chat interface designed for technicians and maintenance professionals.
          </p>
          <div className="cta-buttons">
            <Link to="/register" className="primary-cta">Get Started Free</Link>
            <Link to="/about" className="secondary-cta">Learn More</Link>
          </div>
        </div>

        <div className="hero-visual">
          {/* <div className="phone-mockup">
            <div className="phone-screen">
              <div className="chat-interface">
                <div className="chat-header">
                  <div className="ai-avatar">🤖</div>
                  <div className="chat-info">
                    <h4>Ovivia AI Assistant</h4>
                    <p>Maintenance Expert • Online</p>
                  </div>
                </div>
                
                <div className="chat-messages">
                  <div className="message user">
                    How do I diagnose a pump vibration issue?
                  </div>
                  <div className="message ai">
                    I'll help you diagnose pump vibration. First, check these key areas:
                    
                    • Alignment between motor and pump
                    • Bearing condition and lubrication
                    • Impeller balance and clearances
                    
                    What type of pump are you working with?
                  </div>
                  <div className="message user">
                    Centrifugal pump, 50HP motor
                  </div>
                  <div className="typing-indicator">
                    <div className="typing-dot"></div>
                    <div className="typing-dot"></div>
                    <div className="typing-dot"></div>
                  </div>
                </div>
              </div>
            </div>
          </div> */}

          {/* Floating chat bubbles */}
          <div className="floating-bubble bubble-1">
            "Instant technical guidance"
          </div>
          <div className="floating-bubble bubble-2">
            "24/7 AI support"
          </div>
          <div className="floating-bubble bubble-3">
            "Knowledge retention"
          </div>
        </div>
      </main>
    </div>
  );
};

export default LandingPage;