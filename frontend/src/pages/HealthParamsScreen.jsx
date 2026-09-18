import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { healthAPI } from '../api/client';
import { ArrowLeft, Activity, TrendingUp } from 'lucide-react';

const PARAM_ICONS = {
  glucose: '🩸',
  hemoglobin: '🔴',
  systolic_bp: '❤️',
  diastolic_bp: '💙',
  cholesterol: '🟡',
  heart_rate: '💓',
  hba1c: '🧪',
  creatinine: '🟠',
  wbc: '⚪',
  platelets: '🟤',
};

export default function HealthParamsScreen() {
  const [parameters, setParameters] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    loadParameters();
  }, []);

  const loadParameters = async () => {
    try {
      const res = await healthAPI.getParameters();
      setParameters(res.data.parameters);
    } catch (err) {
      console.error('Load params error:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="page"><div className="loading-container"><div className="spinner" /><p>Loading parameters...</p></div></div>;
  }

  const withData = parameters.filter(p => p.measurementCount > 0);
  const withoutData = parameters.filter(p => p.measurementCount === 0);

  return (
    <div className="page">
      <div className="page-header">
        <h1>Health Parameters</h1>
      </div>

      <div className="disclaimer">
        ⚠️ Values are extracted from uploaded medical reports using OCR. Always verify with your healthcare provider.
      </div>

      {withData.length > 0 && (
        <div className="section">
          <div className="section-title">Tracked Parameters ({withData.length})</div>
          {withData.map(p => (
            <div
              key={p.id}
              className="param-card"
              onClick={() => navigate(`/trends/${p.name}`)}
            >
              <div className="param-icon" style={{ background: 'var(--primary-light)', fontSize: 20 }}>
                {PARAM_ICONS[p.name] || '📊'}
              </div>
              <div className="param-info">
                <div className="param-name">{p.displayName}</div>
                <div className="param-date">
                  {p.measurementCount} measurement{p.measurementCount !== 1 ? 's' : ''}
                </div>
              </div>
              <div style={{ textAlign: 'right' }}>
                {p.latestMeasurement ? (
                  <>
                    <div className="param-value">{p.latestMeasurement.value}</div>
                    <div className="param-unit">{p.latestMeasurement.unit}</div>
                  </>
                ) : (
                  <TrendingUp size={16} color="var(--text-muted)" />
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {withoutData.length > 0 && (
        <div className="section">
          <div className="section-title" style={{ color: 'var(--text-muted)' }}>
            No Data Yet ({withoutData.length})
          </div>
          {withoutData.map(p => (
            <div key={p.id} className="param-card" style={{ opacity: 0.6 }}>
              <div className="param-icon" style={{ background: 'var(--bg-input)', fontSize: 20 }}>
                {PARAM_ICONS[p.name] || '📊'}
              </div>
              <div className="param-info">
                <div className="param-name">{p.displayName}</div>
                <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                  Normal: {p.normalMin}–{p.normalMax} {p.defaultUnit}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {parameters.length === 0 && (
        <div className="empty-state">
          <Activity />
          <h3>No parameters available</h3>
          <p>Upload and process medical reports to extract health parameters</p>
        </div>
      )}
    </div>
  );
}
