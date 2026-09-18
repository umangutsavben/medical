import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function SplashScreen() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const timer = setTimeout(() => {
      if (!loading) {
        navigate(user ? '/home' : '/login', { replace: true });
      }
    }, 1500);
    return () => clearTimeout(timer);
  }, [user, loading, navigate]);

  return (
    <div className="splash-screen">
      <div className="splash-logo">🏥</div>
      <h1>MedRecord</h1>
      <p>Smart Medical Record Manager</p>
      <div style={{ marginTop: 32 }}>
        <div className="spinner" style={{ borderColor: 'rgba(255,255,255,0.3)', borderTopColor: 'white' }} />
      </div>
    </div>
  );
}
