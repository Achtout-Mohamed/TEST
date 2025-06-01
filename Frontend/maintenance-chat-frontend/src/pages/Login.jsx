// import React, { useState, useEffect } from 'react';
// import { Link, useNavigate } from 'react-router-dom';
// import { useAuth } from '../hooks/useAuth';
// import GoogleOAuthButton from '../components/GoogleOAuthButton';
// import './Login.css';

// const Login = () => {
//   const [formData, setFormData] = useState({
//     email: '',
//     password: ''
//   });
//   const [formErrors, setFormErrors] = useState({});
//   const [isSubmitting, setIsSubmitting] = useState(false);
//   const [authError, setAuthError] = useState(null);
  
//   const { login, isAuthenticated, error } = useAuth();
//   const navigate = useNavigate();
  
//   // Redirect if already authenticated
//   useEffect(() => {
//     if (isAuthenticated) {
//       navigate('/');
//     }
//   }, [isAuthenticated, navigate]);
  
//   // Handle input changes
//   const handleChange = (e) => {
//     const { name, value } = e.target;
//     setFormData({ ...formData, [name]: value });
    
//     // Clear error when field is edited
//     if (formErrors[name]) {
//       setFormErrors({ ...formErrors, [name]: '' });
//     }
    
//     // Clear auth error when user starts typing
//     if (authError) {
//       setAuthError(null);
//     }
//   };
  
//   // Validate form
//   const validateForm = () => {
//     const errors = {};
    
//     if (!formData.email.trim()) {
//       errors.email = 'Email is required';
//     } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
//       errors.email = 'Email is invalid';
//     }
    
//     if (!formData.password) {
//       errors.password = 'Password is required';
//     }
    
//     setFormErrors(errors);
//     return Object.keys(errors).length === 0;
//   };
  
//   // Handle form submission
//   const handleSubmit = async (e) => {
//     e.preventDefault();
    
//     if (validateForm()) {
//       setIsSubmitting(true);
//       setAuthError(null);
      
//       const { email, password } = formData;
//       const result = await login(email, password);
      
//       setIsSubmitting(false);
      
//       if (result.success) {
//         navigate('/');
//       } else {
//         setAuthError(result.error?.message || 'Login failed');
//       }
//     }
//   };

//   // Handle Google OAuth success
//   const handleGoogleSuccess = () => {
//     // Navigation is handled in GoogleOAuthButton component
//   };

//   // Handle Google OAuth error
//   const handleGoogleError = (errorMessage) => {
//     setAuthError(errorMessage);
//   };
  
//   return (
//     <div className="login-container">
//       <div className="login-card">
//         <div className="login-header">
//           <h2>Maintenance Chat System</h2>
//           <h3>Login to your Account</h3>
//         </div>
        
//         {(error || authError) && (
//           <div className="alert alert-danger">
//             {error || authError}
//           </div>
//         )}

//         {/* Google OAuth Button */}
//         <div className="oauth-section">
//           <GoogleOAuthButton 
//             onSuccess={handleGoogleSuccess}
//             onError={handleGoogleError}
//           />
          
//           <div className="divider">
//             <span>or continue with email</span>
//           </div>
//         </div>
        
//         <form className="login-form" onSubmit={handleSubmit}>
//           <div className="form-group">
//             <label htmlFor="email">Email Address</label>
//             <input
//               type="email"
//               id="email"
//               name="email"
//               value={formData.email}
//               onChange={handleChange}
//               placeholder="Enter your email"
//               className={formErrors.email ? 'is-invalid' : ''}
//             />
//             {formErrors.email && <div className="invalid-feedback">{formErrors.email}</div>}
//           </div>
          
//           <div className="form-group">
//             <label htmlFor="password">Password</label>
//             <input
//               type="password"
//               id="password"
//               name="password"
//               value={formData.password}
//               onChange={handleChange}
//               placeholder="Enter your password"
//               className={formErrors.password ? 'is-invalid' : ''}
//             />
//             {formErrors.password && <div className="invalid-feedback">{formErrors.password}</div>}
//           </div>
          
//           <button 
//             type="submit" 
//             className="btn btn-primary btn-block"
//             disabled={isSubmitting}
//           >
//             {isSubmitting ? 'Logging in...' : 'Login'}
//           </button>
//         </form>
        
//         <div className="login-footer">
//           <p>
//             Don't have an account? <Link to="/register">Register</Link>
//           </p>
//         </div>
//       </div>
//     </div>
//   );
// };

// export default Login;

// src/pages/Login.jsx - Updated with beautiful styling and Google OAuth
import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import GoogleOAuthButton from '../components/GoogleOAuthButton';
import './Login.css';

const Login = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [formErrors, setFormErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [authError, setAuthError] = useState(null);
  
  const { login, isAuthenticated, error } = useAuth();
  const navigate = useNavigate();
  
  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      navigate('/');
    }
  }, [isAuthenticated, navigate]);
  
  // Handle input changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
    
    // Clear error when field is edited
    if (formErrors[name]) {
      setFormErrors({ ...formErrors, [name]: '' });
    }
    
    // Clear auth error when user starts typing
    if (authError) {
      setAuthError(null);
    }
  };
  
  // Validate form
  const validateForm = () => {
    const errors = {};
    
    if (!formData.email.trim()) {
      errors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      errors.email = 'Email is invalid';
    }
    
    if (!formData.password) {
      errors.password = 'Password is required';
    }
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };
  
  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (validateForm()) {
      setIsSubmitting(true);
      setAuthError(null);
      
      const { email, password } = formData;
      const result = await login(email, password);
      
      setIsSubmitting(false);
      
      if (result.success) {
        navigate('/');
      } else {
        setAuthError(result.error?.message || 'Login failed');
      }
    }
  };

  // Handle Google OAuth success
  const handleGoogleSuccess = () => {
    // Navigation is handled in GoogleOAuthButton component
  };

  // Handle Google OAuth error
  const handleGoogleError = (errorMessage) => {
    setAuthError(errorMessage);
  };
  
  return (
    <div className="login-container">
      {/* Animated background shapes */}
      <div className="geometric-shapes">
        <div className="shape"></div>
        <div className="shape"></div>
        <div className="shape"></div>
      </div>

      {/* Left Panel - Login Form */}
      <div className="login-left">
        <div className="login-card">
          <div className="logo-section">
            <div className="logo-icon">
              <svg viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M20 3C10.6 3 3 10.6 3 20C3 29.4 10.6 37 20 37C29.4 37 37 29.4 37 20C37 10.6 29.4 3 20 3ZM11 16C11 14.9 11.9 14 13 14C14.1 14 15 14.9 15 16C15 17.1 14.1 18 13 18C11.9 18 11 17.1 11 16ZM20 26C17.2 26 14.8 24.4 13.8 22H26.2C25.2 24.4 22.8 26 20 26ZM27 18C25.9 18 25 17.1 25 16C25 14.9 25.9 14 27 14C28.1 14 29 14.9 29 16C29 17.1 28.1 18 27 18Z" fill="currentColor"/>
              </svg>
            </div>
            <h1 className="logo-text">Ovivia</h1>
          </div>

          <div className="login-header">
            <h2>Welcome Back</h2>
            <p>Sign in to your account</p>
          </div>
          
          {(error || authError) && (
            <div className="alert alert-danger">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10"/>
                <line x1="15" y1="9" x2="9" y2="15"/>
                <line x1="9" y1="9" x2="15" y2="15"/>
              </svg>
              {error || authError}
            </div>
          )}

          {/* Google OAuth Button */}
          <div className="social-login">
            <GoogleOAuthButton 
              onSuccess={handleGoogleSuccess}
              onError={handleGoogleError}
            />
          </div>

          <div className="divider">
            <span>OR</span>
          </div>
          
          <form className="login-form" onSubmit={handleSubmit}>
            <div className="form-group">
              <label htmlFor="email">Email</label>
              <div className="input-wrapper">
                <svg className="input-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
                  <polyline points="22,6 12,13 2,6"/>
                </svg>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="demo@example.com"
                  className={formErrors.email ? 'is-invalid' : ''}
                />
              </div>
              {formErrors.email && (
                <div className="invalid-feedback">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="10"/>
                    <line x1="15" y1="9" x2="9" y2="15"/>
                    <line x1="9" y1="9" x2="15" y2="15"/>
                  </svg>
                  {formErrors.email}
                </div>
              )}
            </div>
            
            <div className="form-group">
              <label htmlFor="password">Password</label>
              <div className="input-wrapper">
                <svg className="input-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                  <circle cx="12" cy="16" r="1"/>
                  <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                </svg>
                <input
                  type="password"
                  id="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="••••••••••••"
                  className={formErrors.password ? 'is-invalid' : ''}
                />
              </div>
              {formErrors.password && (
                <div className="invalid-feedback">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="10"/>
                    <line x1="15" y1="9" x2="9" y2="15"/>
                    <line x1="9" y1="9" x2="15" y2="15"/>
                  </svg>
                  {formErrors.password}
                </div>
              )}
            </div>

            <div className="forgot-password">
              <a href="#forgot">Forgot your password?</a>
            </div>
            
            <button 
              type="submit" 
              className="btn btn-primary"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Signing in...' : 'SIGN IN'}
            </button>
          </form>
          
          <div className="login-footer">
            <p>
              Don't have an account? <Link to="/register">Sign Up</Link>
            </p>
          </div>
        </div>
      </div>

      {/* Right Panel - Welcome */}
      <div className="login-right">
        <div className="welcome-content">
          <h1>Welcome Back!</h1>
          <p>
            Enter your personal details and start your journey with us
          </p>
          <Link to="/register" className="signup-cta">SIGN UP</Link>
        </div>

        <div className="welcome-visual">
          <div className="floating-icons">
            <div className="floating-icon">🔧</div>
            <div className="floating-icon">⚙️</div>
            <div className="floating-icon">🤖</div>
            <div className="floating-icon">💬</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;