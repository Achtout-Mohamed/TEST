// // Frontend/maintenance-chat-frontend/src/components/GoogleOAuthButton.jsx - Updated with better error handling

// import React from 'react';
// import { GoogleLogin } from '@react-oauth/google';
// import { useAuth } from '../hooks/useAuth';
// import { useNavigate } from 'react-router-dom';

// const GoogleOAuthButton = ({ onSuccess, onError }) => {
//   const { googleLogin } = useAuth();
//   const navigate = useNavigate();

//   // Check if Google Client ID is configured
//   const googleClientId = process.env.REACT_APP_GOOGLE_CLIENT_ID;

//   const handleGoogleSuccess = async (credentialResponse) => {
//     try {
//       console.log('Google OAuth Success:', credentialResponse);
      
//       if (!credentialResponse.credential) {
//         throw new Error('No credential received from Google');
//       }

//       const result = await googleLogin(credentialResponse.credential);
      
//       if (result.success) {
//         if (onSuccess) onSuccess(result);
//         navigate('/');
//       } else {
//         console.error('Login failed:', result.error);
//         if (onError) onError(result.error || 'Google authentication failed');
//       }
//     } catch (error) {
//       console.error('Google login error:', error);
//       if (onError) onError('Google authentication failed: ' + error.message);
//     }
//   };

//   const handleGoogleError = () => {
//     console.error('Google OAuth error occurred');
//     if (onError) onError('Google authentication failed');
//   };

//   // Don't render if Google Client ID is not configured
//   if (!googleClientId) {
//     console.warn('Google OAuth not available: REACT_APP_GOOGLE_CLIENT_ID not configured');
//     return (
//       <div className="google-oauth-unavailable" style={{
//         padding: '12px',
//         border: '1px solid #ffa500',
//         borderRadius: '8px',
//         backgroundColor: '#fff8e1',
//         color: '#e65100',
//         fontSize: '14px',
//         textAlign: 'center',
//         marginBottom: '16px'
//       }}>
//         Google Sign-In is currently unavailable
//       </div>
//     );
//   }

//   return (
//     <div className="google-oauth-container">
//       <GoogleLogin
//         onSuccess={handleGoogleSuccess}
//         onError={handleGoogleError}
//         theme="outline"
//         size="large"
//         text="signin_with"
//         shape="rectangular"
//         logo_alignment="left"
//         width="100%"
//         useOneTap={false} // Disable one-tap for better debugging
//       />
//     </div>
//   );
// };

// export default GoogleOAuthButton;


// src/components/GoogleOAuthButton.jsx - Fixed version

import React from 'react';
import { GoogleLogin } from '@react-oauth/google';
import { useAuth } from '../hooks/useAuth';
import { useNavigate } from 'react-router-dom';

const GoogleOAuthButton = ({ onSuccess, onError }) => {
  const { googleLogin } = useAuth();
  const navigate = useNavigate();

  // Check if Google Client ID is configured
  const googleClientId = process.env.REACT_APP_GOOGLE_CLIENT_ID;

  console.log('Google Client ID:', googleClientId ? 'Configured' : 'Missing');

  const handleGoogleSuccess = async (credentialResponse) => {
    try {
      console.log('Google OAuth Success:', credentialResponse);
      
      if (!credentialResponse.credential) {
        throw new Error('No credential received from Google');
      }

      const result = await googleLogin(credentialResponse.credential);
      
      if (result.success) {
        console.log('Login successful, redirecting...');
        if (onSuccess) onSuccess(result);
        navigate('/');
      } else {
        console.error('Login failed:', result.error);
        if (onError) onError(result.error?.message || 'Google authentication failed');
      }
    } catch (error) {
      console.error('Google login error:', error);
      if (onError) onError('Google authentication failed: ' + error.message);
    }
  };

  const handleGoogleError = (error) => {
    console.error('Google OAuth error:', error);
    if (onError) onError('Google authentication failed. Please check your configuration.');
  };

  // Don't render if Google Client ID is not configured
  if (!googleClientId) {
    console.error('REACT_APP_GOOGLE_CLIENT_ID environment variable is not set');
    return (
      <div className="google-oauth-error" style={{
        padding: '12px',
        border: '1px solid #f44336',
        borderRadius: '8px',
        backgroundColor: '#ffebee',
        color: '#c62828',
        fontSize: '14px',
        textAlign: 'center',
        marginBottom: '16px'
      }}>
        Google Sign-In configuration missing. Please contact administrator.
      </div>
    );
  }

  return (
    <div className="google-oauth-container">
      <GoogleLogin
        onSuccess={handleGoogleSuccess}
        onError={handleGoogleError}
        theme="outline"
        size="large"
        text="signin_with"
        shape="rectangular"
        logo_alignment="left"
        width="100%"
        useOneTap={false}
        auto_select={false}
      />
    </div>
  );
};

export default GoogleOAuthButton;