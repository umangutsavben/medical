import { BrowserRouter, Routes, Route, Navigate, NavLink, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import SplashScreen from './pages/SplashScreen';
import LoginScreen from './pages/LoginScreen';
import SignupScreen from './pages/SignupScreen';
import HomeScreen from './pages/HomeScreen';
import ProfileScreen from './pages/ProfileScreen';
import UploadScreen from './pages/UploadScreen';
import RecordsScreen from './pages/RecordsScreen';
import DocumentDetailScreen from './pages/DocumentDetailScreen';
import SearchScreen from './pages/SearchScreen';
import HealthParamsScreen from './pages/HealthParamsScreen';
import HealthTrendsScreen from './pages/HealthTrendsScreen';
import { Home, FileText, Upload, Activity, Search, User } from 'lucide-react';

function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) {
    return (
      <div className="loading-container" style={{ minHeight: '100vh' }}>
        <div className="spinner" />
        <p>Loading...</p>
      </div>
    );
  }
  if (!user) return <Navigate to="/login" replace />;
  return children;
}

function BottomNav() {
  const location = useLocation();
  const { user } = useAuth();

  // Hide nav on auth screens and splash
  const hideOn = ['/', '/login', '/signup'];
  if (hideOn.includes(location.pathname) || !user) return null;

  return (
    <nav className="bottom-nav">
      <NavLink to="/home" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
        <Home size={22} />
        <span>Home</span>
      </NavLink>
      <NavLink to="/records" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
        <FileText size={22} />
        <span>Records</span>
      </NavLink>
      <NavLink to="/upload" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
        <Upload size={22} />
        <span>Upload</span>
      </NavLink>
      <NavLink to="/health" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
        <Activity size={22} />
        <span>Health</span>
      </NavLink>
      <NavLink to="/profile" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
        <User size={22} />
        <span>Profile</span>
      </NavLink>
    </nav>
  );
}

function AppRoutes() {
  return (
    <div className="app-container">
      <Routes>
        <Route path="/" element={<SplashScreen />} />
        <Route path="/login" element={<LoginScreen />} />
        <Route path="/signup" element={<SignupScreen />} />
        <Route path="/home" element={<ProtectedRoute><HomeScreen /></ProtectedRoute>} />
        <Route path="/profile" element={<ProtectedRoute><ProfileScreen /></ProtectedRoute>} />
        <Route path="/upload" element={<ProtectedRoute><UploadScreen /></ProtectedRoute>} />
        <Route path="/records" element={<ProtectedRoute><RecordsScreen /></ProtectedRoute>} />
        <Route path="/documents/:id" element={<ProtectedRoute><DocumentDetailScreen /></ProtectedRoute>} />
        <Route path="/search" element={<ProtectedRoute><SearchScreen /></ProtectedRoute>} />
        <Route path="/health" element={<ProtectedRoute><HealthParamsScreen /></ProtectedRoute>} />
        <Route path="/trends/:parameter" element={<ProtectedRoute><HealthTrendsScreen /></ProtectedRoute>} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      <BottomNav />
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  );
}
