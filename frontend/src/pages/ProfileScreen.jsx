import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { profileAPI } from '../api/client';
import { ArrowLeft, LogOut, Save } from 'lucide-react';

export default function ProfileScreen() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      const res = await profileAPI.get();
      setProfile(res.data.profile);
      setForm({
        name: res.data.profile.name || '',
        phone: res.data.profile.phone || '',
        dateOfBirth: res.data.profile.dateOfBirth || '',
        gender: res.data.profile.gender || '',
      });
    } catch (err) {
      setError('Failed to load profile');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    setError('');
    setMessage('');
    try {
      await profileAPI.update(form);
      setMessage('Profile updated successfully');
      setEditing(false);
      loadProfile();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = async () => {
    await logout();
    navigate('/login', { replace: true });
  };

  if (loading) {
    return (
      <div className="page">
        <div className="loading-container"><div className="spinner" /><p>Loading profile...</p></div>
      </div>
    );
  }

  return (
    <div className="page">
      <div className="page-header">
        <button className="back-btn" onClick={() => navigate(-1)}><ArrowLeft size={20} /></button>
        <h1>Profile</h1>
      </div>

      {/* Profile Header */}
      <div className="profile-header">
        <div className="profile-avatar">
          {profile?.name?.charAt(0)?.toUpperCase() || '?'}
        </div>
        <div className="profile-name">{profile?.name}</div>
        <div className="profile-email">{profile?.email}</div>
        {profile?._count && (
          <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>
            {profile._count.documents} documents • {profile._count.healthMeasurements} measurements
          </p>
        )}
      </div>

      {message && <div className="alert alert-success">{message}</div>}
      {error && <div className="alert alert-error">{error}</div>}

      {/* Profile Form */}
      <div className="card" style={{ marginBottom: 16 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <h3 style={{ fontSize: 16, fontWeight: 600 }}>Personal Information</h3>
          {!editing && (
            <button className="btn btn-sm btn-outline" onClick={() => setEditing(true)}>Edit</button>
          )}
        </div>

        {editing ? (
          <>
            <div className="form-group">
              <label className="form-label">Full Name</label>
              <input className="form-input" value={form.name} onChange={e => setForm({...form, name: e.target.value})} />
            </div>
            <div className="form-group">
              <label className="form-label">Phone</label>
              <input className="form-input" value={form.phone} onChange={e => setForm({...form, phone: e.target.value})} placeholder="Optional" />
            </div>
            <div className="form-group">
              <label className="form-label">Date of Birth</label>
              <input type="date" className="form-input" value={form.dateOfBirth} onChange={e => setForm({...form, dateOfBirth: e.target.value})} />
            </div>
            <div className="form-group">
              <label className="form-label">Gender</label>
              <select className="form-input form-select" value={form.gender} onChange={e => setForm({...form, gender: e.target.value})}>
                <option value="">Prefer not to say</option>
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="other">Other</option>
              </select>
            </div>
            <div style={{ display: 'flex', gap: 10 }}>
              <button className="btn btn-primary btn-full" onClick={handleSave} disabled={saving}>
                <Save size={16} /> {saving ? 'Saving...' : 'Save Changes'}
              </button>
              <button className="btn btn-secondary" onClick={() => setEditing(false)}>Cancel</button>
            </div>
          </>
        ) : (
          <div>
            <InfoRow label="Email" value={profile?.email} />
            <InfoRow label="Phone" value={profile?.phone || 'Not set'} />
            <InfoRow label="Date of Birth" value={profile?.dateOfBirth || 'Not set'} />
            <InfoRow label="Gender" value={profile?.gender ? profile.gender.charAt(0).toUpperCase() + profile.gender.slice(1) : 'Not set'} />
            <InfoRow label="Member since" value={new Date(profile?.createdAt).toLocaleDateString()} />
          </div>
        )}
      </div>

      <button className="btn btn-danger btn-full" onClick={handleLogout}>
        <LogOut size={16} /> Sign Out
      </button>
    </div>
  );
}

function InfoRow({ label, value }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid var(--border)' }}>
      <span style={{ fontSize: 14, color: 'var(--text-secondary)' }}>{label}</span>
      <span style={{ fontSize: 14, fontWeight: 500 }}>{value}</span>
    </div>
  );
}
