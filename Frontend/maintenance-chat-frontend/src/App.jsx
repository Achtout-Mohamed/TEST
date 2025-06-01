//  import React from 'react';
// import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
// import { AuthProvider } from './contexts/AuthContext';
// import { ChatProvider } from './contexts/ChatContext';
// import { SocketProvider } from './contexts/SocketContext'; // Import SocketProvider
// import LandingPage from './pages/LandingPage';
// import Login from './pages/Login';
// import Register from './pages/Register';
// import Dashboard from './pages/Dashboard';
// import ConversationPage from './pages/ConversationPage';
// import { useAuth } from './hooks/useAuth';

// const ProtectedRoute = ({ children }) => {
//   const { isAuthenticated, loading } = useAuth();
  
//   if (loading) {
//     return <div>Loading...</div>;
//   }
  
//   if (!isAuthenticated) {
//     return <Navigate to="/login" />;
//   }
  
//   return children;
// };

// const App = () => {
//   // Move AppRoutes inside App component
//   const AppRoutes = () => {
//     const { isAuthenticated, loading } = useAuth();

//     if (loading) {
//       return <div>Loading...</div>;
//     }

//     return (
//       <Routes>
//         <Route path="/login" element={isAuthenticated ? <Navigate to="/dashboard" /> : <Login />} />
//         <Route path="/register" element={isAuthenticated ? <Navigate to="/dashboard" /> : <Register />} />
//         <Route 
//           path="/dashboard" 
//           element={
//             <ProtectedRoute>
//               <Dashboard />
//             </ProtectedRoute>
//           } 
//         />
//         <Route 
//           path="/" 
//           element={
//             isAuthenticated ? <Navigate to="/dashboard" /> : <LandingPage />
//           } 
//         />
//         <Route path="/conversations" element={<ProtectedRoute><ConversationPage /></ProtectedRoute>} />
//         <Route path="/conversations/:conversationId" element={<ProtectedRoute><ConversationPage /></ProtectedRoute>} />
//       </Routes>
//     );
//   };

//   return (
//     <Router>
//       <AuthProvider>
//         <SocketProvider> {/* Add SocketProvider */}
//           <ChatProvider>
//             <AppRoutes />
//           </ChatProvider>
//         </SocketProvider>
//       </AuthProvider>
//     </Router>
//   );
// };

// export default App;
// Frontend/maintenance-chat-frontend/src/App.jsx - Updated with role selection flow

import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { GoogleOAuthProvider } from '@react-oauth/google';
import { AuthProvider } from './contexts/AuthContext';
import { ChatProvider } from './contexts/ChatContext';
import { SocketProvider } from './contexts/SocketContext';
import LandingPage from './pages/LandingPage';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import ConversationPage from './pages/ConversationPage';
import RoleSelection from './components/RoleSelection';
import { useAuth } from './hooks/useAuth';

const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, loading, needsRoleSelection } = useAuth();
  
  if (loading) {
    return (
      <div className="loading-container" style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh',
        fontSize: '1.2rem',
        color: '#666'
      }}>
        Loading...
      </div>
    );
  }
  
  if (!isAuthenticated) {
    return <Navigate to="/login" />;
  }

  // If user needs to select a role, redirect to role selection
  if (needsRoleSelection) {
    return <Navigate to="/select-role" />;
  }
  
  return children;
};

const RoleSelectionRoute = () => {
  const { isAuthenticated, loading, needsRoleSelection, user, updateUserRole } = useAuth();
  
  if (loading) {
    return (
      <div className="loading-container" style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh',
        fontSize: '1.2rem',
        color: '#666'
      }}>
        Loading...
      </div>
    );
  }
  
  if (!isAuthenticated) {
    return <Navigate to="/login" />;
  }

  // If user doesn't need role selection, redirect to dashboard
  if (!needsRoleSelection) {
    return <Navigate to="/dashboard" />;
  }

  const handleRoleSelect = async (selectedRole) => {
    const result = await updateUserRole(selectedRole);
    if (result.success) {
      // User will be redirected to dashboard automatically
      // due to needsRoleSelection becoming false
    }
    return result;
  };

  return (
    <RoleSelection 
      userInfo={user}
      onRoleSelect={handleRoleSelect}
    />
  );
};

const App = () => {
  // Move AppRoutes inside App component
  const AppRoutes = () => {
    const { isAuthenticated, loading, needsRoleSelection } = useAuth();

    if (loading) {
      return (
        <div className="loading-container" style={{ 
          display: 'flex', 
          justifyContent: 'center', 
          alignItems: 'center', 
          height: '100vh',
          fontSize: '1.2rem',
          color: '#666'
        }}>
          Loading...
        </div>
      );
    }

    return (
      <Routes>
        {/* Public routes */}
        <Route 
          path="/login" 
          element={isAuthenticated ? 
            (needsRoleSelection ? <Navigate to="/select-role" /> : <Navigate to="/dashboard" />) 
            : <Login />
          } 
        />
        <Route 
          path="/register" 
          element={isAuthenticated ? 
            (needsRoleSelection ? <Navigate to="/select-role" /> : <Navigate to="/dashboard" />) 
            : <Register />
          } 
        />
        
        {/* Role selection route */}
        <Route 
          path="/select-role" 
          element={<RoleSelectionRoute />} 
        />
        
        {/* Protected routes */}
        <Route 
          path="/dashboard" 
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/conversations" 
          element={
            <ProtectedRoute>
              <ConversationPage />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/conversations/:conversationId" 
          element={
            <ProtectedRoute>
              <ConversationPage />
            </ProtectedRoute>
          } 
        />
        
        {/* Landing page / root route */}
        <Route 
          path="/" 
          element={
            isAuthenticated ? 
              (needsRoleSelection ? <Navigate to="/select-role" /> : <Navigate to="/dashboard" />) 
              : <LandingPage />
          } 
        />
        
        {/* Catch all route - redirect to appropriate page */}
        <Route 
          path="*" 
          element={
            isAuthenticated ? 
              (needsRoleSelection ? <Navigate to="/select-role" replace /> : <Navigate to="/dashboard" replace />) 
              : <Navigate to="/" replace />
          } 
        />
      </Routes>
    );
  };

  // Get Google Client ID from environment variables
  const googleClientId = process.env.REACT_APP_GOOGLE_CLIENT_ID;
  
  // If Google Client ID is not configured, show a warning in development
  if (!googleClientId && process.env.NODE_ENV === 'development') {
    console.warn('Google OAuth Client ID not configured. Please set REACT_APP_GOOGLE_CLIENT_ID in your .env file.');
  }

  return (
    <GoogleOAuthProvider clientId={googleClientId || ''}>
      <Router>
        <AuthProvider>
          <SocketProvider>
            <ChatProvider>
              <AppRoutes />
            </ChatProvider>
          </SocketProvider>
        </AuthProvider>
      </Router>
    </GoogleOAuthProvider>
  );
};

export default App;

// // src/App.js
// import React from 'react';
// import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
// import { GoogleOAuthProvider } from '@react-oauth/google';
// import { AuthProvider } from './contexts/AuthContext';
// import { ChatProvider } from './contexts/ChatContext';
// import Login from './pages/Login';
// import Register from './pages/Register';
// import Dashboard from './pages/Dashboard';

// function App() {
//   const googleClientId = process.env.REACT_APP_GOOGLE_CLIENT_ID;

//   return (
//     <GoogleOAuthProvider clientId={googleClientId}>
//       <AuthProvider>
//         <ChatProvider>
//           <Router>
//             <div className="App">
//               <Routes>
//                 <Route path="/login" element={<Login />} />
//                 <Route path="/register" element={<Register />} />
//                 <Route path="/" element={<Dashboard />} />
//                 <Route path="*" element={<Navigate to="/" replace />} />
//               </Routes>
//             </div>
//           </Router>
//         </ChatProvider>
//       </AuthProvider>
//     </GoogleOAuthProvider>
//   );
// }

// export default App;

