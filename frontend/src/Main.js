import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Welcome from './pages/Welcome';
import Login from './pages/Login';
import Signup from './pages/Signup';
import App from './App';
import SharePage from './pages/SharePage';

const Main = () => {
  return (
    <BrowserRouter>
      <Routes>
        {/* Welcome Page - Landing */}
        <Route path="/" element={<Welcome />} />
        
        {/* Login/Signup Pages */}
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        
        {/* Editor - Main App */}
        <Route path="/editor" element={<App />} />
        
        {/* share URL that redirects into editor */}
        <Route path="/share/:id" element={<SharePage />} />

        {/* Redirect any unknown routes to welcome */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
};

export default Main;