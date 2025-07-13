import { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import useAuthStore from './store/authStore';
import useChatStore from './store/chatStore';
import Login from './pages/Login';
import Register from './pages/Register';
import Chat from './pages/Chat';
import ProtectedRoute from './components/ProtectedRoute';
import './App.css';

function App() {
  const { isAuthenticated, token, initializeSocket } = useAuthStore();
  const { isConnected, initializeSocket: initChatSocket } = useChatStore();

  useEffect(() => {
    if (isAuthenticated && token && !isConnected) {
      try {
        initChatSocket(token);
      } catch (error) {
        console.error('Failed to initialize socket:', error);
      }
    }
  }, [isAuthenticated, token, isConnected, initChatSocket]);

  return (
    <Router>
      <div className="App">
        <Routes>
          <Route 
            path="/login" 
            element={
              isAuthenticated ? <Navigate to="/chat" replace /> : <Login />
            } 
          />
          <Route 
            path="/register" 
            element={
              isAuthenticated ? <Navigate to="/chat" replace /> : <Register />
            } 
          />
          <Route 
            path="/chat" 
            element={
              <ProtectedRoute>
                <Chat />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/" 
            element={<Navigate to={isAuthenticated ? "/chat" : "/login"} replace />} 
          />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
