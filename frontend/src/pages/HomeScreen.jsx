import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { documentsAPI, healthAPI } from '../api/client';
import { FileText, Upload, Activity, Search, TrendingUp, Clock, CheckCircle, AlertCircle } from 'lucide-react';

export default function HomeScreen() {
  const { user } = useAuth();
  const [stats, setStats] = useState({ documents: 0, processed: 0, parameters: 0, measurements: 0 });
  const [recentDocs, setRecentDocs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboard();
  }, []);

  const loadDashboard = async () => {
    try {
      const [docsRes, paramsRes] = await Promise.all([
        documentsAPI.list({ limit: 5 }),
        healthAPI.getParameters(),
      ]);

      const docs = docsRes.data.documents;
      const params = paramsRes.data.parameters;
      const totalMeasurements = params.reduce((sum, p) => sum + p.measurementCount, 0);
      const processedDocs = docs.filter(d => d.processingStatus === 'COMPLETED').length;

      setStats({
        documents: docsRes.data.pagination.total,
        processed: processedDocs,
        parameters: params.filter(p => p.measurementCount > 0).length,
        measurements: totalMeasurements,
      });
      setRecentDocs(docs);
    } catch (err) {
      console.error('Dashboard load error:', err);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status) => {
    const map = {
      UPLOADED: { cls: 'badge-uploaded', icon: <Clock size={10} />, label: 'Uploaded' },
      PROCESSING: { cls: 'badge-processing', icon: <Clock size={10} />, label: 'Processing' },
      COMPLETED: { cls: 'badge-completed', icon: <CheckCircle size={10} />, label: 'Completed' },
      FAILED: { cls: 'badge-failed', icon: <AlertCircle size={10} />, label: 'Failed' },
    };
    const s = map[status] || map.UPLOADED;
    return <span className={`badge ${s.cls}`}>{s.icon} {s.label}</span>;
  };

  if (loading) {
    return (
      <div className="page">
        <div className="loading-container">
          <div className="spinner" />
          <p>Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="page">
      <div style={{ marginBottom: 20 }}>
        <h1 style={{ fontSize: 22, fontWeight: 700 }}>
          Hello, {user?.name?.split(' ')[0] || 'User'} 👋
        </h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: 14 }}>
          Manage your medical records securely
        </p>
      </div>

      <div className="disclaimer">
        ⚠️ This app helps organize medical records. It does not provide medical diagnoses or replace medical professionals.
      </div>

      {/* Stats Grid */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-value">{stats.documents}</div>
          <div className="stat-label">Documents</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{stats.processed}</div>
          <div className="stat-label">Processed</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{stats.parameters}</div>
          <div className="stat-label">Parameters</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{stats.measurements}</div>
          <div className="stat-label">Measurements</div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="section">
        <div className="section-title">Quick Actions</div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          <Link to="/upload" className="btn btn-primary" style={{ fontSize: 13 }}>
            <Upload size={16} /> Upload Report
          </Link>
          <Link to="/search" className="btn btn-secondary" style={{ fontSize: 13 }}>
            <Search size={16} /> Search
          </Link>
        </div>
      </div>

      {/* Recent Documents */}
      <div className="section">
        <div className="section-title">
          Recent Documents
          <Link to="/records">View All</Link>
        </div>

        {recentDocs.length === 0 ? (
          <div className="empty-state">
            <FileText />
            <h3>No documents yet</h3>
            <p>Upload your first medical report to get started</p>
          </div>
        ) : (
          recentDocs.map(doc => (
            <Link to={`/documents/${doc.id}`} key={doc.id} className="doc-item">
              <div className={`doc-icon ${doc.fileType.includes('pdf') ? 'doc-icon-pdf' : 'doc-icon-img'}`}>
                {doc.fileType.includes('pdf') ? '📄' : '🖼️'}
              </div>
              <div className="doc-info">
                <div className="doc-name">{doc.originalName}</div>
                <div className="doc-meta">
                  {new Date(doc.uploadedAt).toLocaleDateString()} • {(doc.fileSize / 1024).toFixed(0)} KB
                  {doc.category && ` • ${doc.category.name}`}
                </div>
              </div>
              {getStatusBadge(doc.processingStatus)}
            </Link>
          ))
        )}
      </div>
    </div>
  );
}
