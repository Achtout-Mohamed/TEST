// import React, { useState, useEffect } from 'react';
// import { Link, useNavigate } from 'react-router-dom';
// import { useAuth } from '../hooks/useAuth';
// import GoogleOAuthButton from '../components/GoogleOAuthButton';
// import './Register.css';

// const Register = () => {
//   const [formData, setFormData] = useState({
//     name: '',
//     email: '',
//     password: '',
//     confirmPassword: '',
//     role: 'technician' // Default role
//   });
//   const [formErrors, setFormErrors] = useState({});
//   const [isSubmitting, setIsSubmitting] = useState(false);
//   const [authError, setAuthError] = useState(null);
  
//   const { register, isAuthenticated, error } = useAuth();
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
    
//     if (!formData.name.trim()) {
//       errors.name = 'Name is required';
//     }
    
//     if (!formData.email.trim()) {
//       errors.email = 'Email is required';
//     } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
//       errors.email = 'Email is invalid';
//     }
    
//     if (!formData.password) {
//       errors.password = 'Password is required';
//     } else if (formData.password.length < 6) {
//       errors.password = 'Password must be at least 6 characters';
//     }
    
//     if (formData.password !== formData.confirmPassword) {
//       errors.confirmPassword = 'Passwords do not match';
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
      
//       const { name, email, password, role } = formData;
//       const result = await register({ name, email, password, role });
      
//       setIsSubmitting(false);
      
//       if (result.success) {
//         navigate('/');
//       } else {
//         setAuthError(result.error?.message || 'Registration failed');
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
//     <div className="register-container">
//       <div className="register-card">
//         <div className="register-header">
//           <h2>Maintenance Chat System</h2>
//           <h3>Create Your Account</h3>
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
//             <span>or register with email</span>
//           </div>
//         </div>
        
//         <form className="register-form" onSubmit={handleSubmit}>
//           <div className="form-group">
//             <label htmlFor="name">Full Name</label>
//             <input
//               type="text"
//               id="name"
//               name="name"
//               value={formData.name}
//               onChange={handleChange}
//               placeholder="Enter your full name"
//               className={formErrors.name ? 'is-invalid' : ''}
//             />
//             {formErrors.name && <div className="invalid-feedback">{formErrors.name}</div>}
//           </div>
          
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
          
//           <div className="form-group">
//             <label htmlFor="confirmPassword">Confirm Password</label>
//             <input
//               type="password"
//               id="confirmPassword"
//               name="confirmPassword"
//               value={formData.confirmPassword}
//               onChange={handleChange}
//               placeholder="Confirm your password"
//               className={formErrors.confirmPassword ? 'is-invalid' : ''}
//             />
//             {formErrors.confirmPassword && <div className="invalid-feedback">{formErrors.confirmPassword}</div>}
//           </div>
          
//           <div className="form-group">
//             <label htmlFor="role">Role</label>
//             <select
//               id="role"
//               name="role"
//               value={formData.role}
//               onChange={handleChange}
//             >
//               <option value="technician">Maintenance Technician</option>
//               <option value="team_lead">Team Lead</option>
//               <option value="engineer">Engineer</option>
//               <option value="knowledge_manager">Knowledge Manager</option>
//             </select>
//           </div>
          
//           <button 
//             type="submit" 
//             className="btn btn-primary btn-block"
//             disabled={isSubmitting}
//           >
//             {isSubmitting ? 'Creating Account...' : 'Register'}
//           </button>
//         </form>
        
//         <div className="register-footer">
//           <p>
//             Already have an account? <Link to="/login">Login</Link>
//           </p>
//         </div>
//       </div>
//     </div>
//   );
// };

// export default Register;


// src/pages/Register.jsx - Updated with beautiful styling and Google OAuth
import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import GoogleOAuthButton from '../components/GoogleOAuthButton';
import './Register.css';

const Register = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: 'technician' // Default role
  });
  const [formErrors, setFormErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [authError, setAuthError] = useState(null);
  
  const { register, isAuthenticated, error } = useAuth();
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
    
    if (!formData.name.trim()) {
      errors.name = 'Name is required';
    }
    
    if (!formData.email.trim()) {
      errors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      errors.email = 'Email is invalid';
    }
    
    if (!formData.password) {
      errors.password = 'Password is required';
    } else if (formData.password.length < 6) {
      errors.password = 'Password must be at least 6 characters';
    }
    
    if (formData.password !== formData.confirmPassword) {
      errors.confirmPassword = 'Passwords do not match';
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
      
      const { name, email, password, role } = formData;
      const result = await register({ name, email, password, role });
      
      setIsSubmitting(false);
      
      if (result.success) {
        navigate('/');
      } else {
        setAuthError(result.error?.message || 'Registration failed');
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
    <div className="register-container">
      {/* Animated background shapes */}
      <div className="geometric-shapes">
        <div className="shape"></div>
        <div className="shape"></div>
        <div className="shape"></div>
      </div>

      {/* Left Panel - Welcome */}
      <div className="register-left">
        <div className="welcome-content">
          <h1>HELLO!</h1>
          <p>
            To keep connected with us please login with your personal info
          </p>
          <Link to="/login" className="signin-cta">SIGN IN</Link>
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

      {/* Right Panel - Register Form */}
      <div className="register-right">
        <div className="register-card">
          <div className="logo-section">
            <div className="logo-icon">
              <svg viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M20 3C10.6 3 3 10.6 3 20C3 29.4 10.6 37 20 37C29.4 37 37 29.4 37 20C37 10.6 29.4 3 20 3ZM11 16C11 14.9 11.9 14 13 14C14.1 14 15 14.9 15 16C15 17.1 14.1 18 13 18C11.9 18 11 17.1 11 16ZM20 26C17.2 26 14.8 24.4 13.8 22H26.2C25.2 24.4 22.8 26 20 26ZM27 18C25.9 18 25 17.1 25 16C25 14.9 25.9 14 27 14C28.1 14 29 14.9 29 16C29 17.1 28.1 18 27 18Z" fill="currentColor"/>
              </svg>
            </div>
            <h1 className="logo-text">Ovivia</h1>
          </div>

          <div className="register-header">
            <h2>Create Account</h2>
            <p>Enter your personal details and start journey with us</p>
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
          
          <form className="register-form" onSubmit={handleSubmit}>
            <div className="form-group">
              <label htmlFor="name">Full Name</label>
              <div className="input-wrapper">
                <svg className="input-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                  <circle cx="12" cy="7" r="4"/>
                </svg>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="John Doe"
                  className={formErrors.name ? 'is-invalid' : ''}
                />
              </div>
              {formErrors.name && (
                <div className="invalid-feedback">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="10"/>
                    <line x1="15" y1="9" x2="9" y2="15"/>
                    <line x1="9" y1="9" x2="15" y2="15"/>
                  </svg>
                  {formErrors.name}
                </div>
              )}
            </div>
            
            <div className="form-group">
              <label htmlFor="email">Email Address</label>
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
                  placeholder="john@example.com"
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

            <div className="form-row">
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
                    placeholder="••••••••"
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
              
              <div className="form-group">
                <label htmlFor="confirmPassword">Confirm Password</label>
                <div className="input-wrapper">
                  <svg className="input-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                    <circle cx="12" cy="16" r="1"/>
                    <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                  </svg>
                  <input
                    type="password"
                    id="confirmPassword"
                    name="confirmPassword"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    placeholder="••••••••"
                    className={formErrors.confirmPassword ? 'is-invalid' : ''}
                  />
                </div>
                {formErrors.confirmPassword && (
                  <div className="invalid-feedback">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <circle cx="12" cy="12" r="10"/>
                      <line x1="15" y1="9" x2="9" y2="15"/>
                      <line x1="9" y1="9" x2="15" y2="15"/>
                    </svg>
                    {formErrors.confirmPassword}
                  </div>
                )}
              </div>
            </div>
            
            <div className="form-group">
              <label htmlFor="role">Role</label>
              <div className="input-wrapper">
                <svg className="input-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
                  <circle cx="8.5" cy="7" r="4"/>
                  <path d="M20 8v6M23 11h-6"/>
                </svg>
                <select
                  id="role"
                  name="role"
                  value={formData.role}
                  onChange={handleChange}
                >
                  <option value="technician">Maintenance Technician</option>
                  <option value="team_lead">Team Lead</option>
                  <option value="engineer">Engineer</option>
                  <option value="knowledge_manager">Knowledge Manager</option>
                </select>
              </div>
            </div>
            
            <button 
              type="submit" 
              className="btn btn-primary"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Creating Account...' : 'SIGN UP'}
            </button>
          </form>
          
          <div className="register-footer">
            <p>
              Already have an account? <Link to="/login">Sign In</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Register;