import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { healthAPI } from '../api/client';
import { ArrowLeft, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  ReferenceLine, Area, AreaChart
} from 'recharts';

export default function HealthTrendsScreen() {
  const { parameter } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadTrends();
  }, [parameter]);

  const loadTrends = async () => {
    setLoading(true);
    try {
      const res = await healthAPI.getTrends(parameter);
      setData(res.data);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to load trend data');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="page"><div className="loading-container"><div className="spinner" /><p>Loading trends...</p></div></div>;
  }

  if (error) {
    return (
      <div className="page">
        <div className="page-header">
          <button className="back-btn" onClick={() => navigate(-1)}><ArrowLeft size={20} /></button>
          <h1>Health Trends</h1>
        </div>
        <div className="alert alert-error">{error}</div>
      </div>
    );
  }

  const chartData = data.measurements.map(m => ({
    date: new Date(m.measuredAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    fullDate: new Date(m.measuredAt).toLocaleDateString(),
    value: m.value,
    confidence: m.confidence,
    isManual: m.isManualEntry,
  }));

  const values = data.measurements.map(m => m.value);
  const latest = values[values.length - 1];
  const previous = values.length > 1 ? values[values.length - 2] : null;
  const min = Math.min(...values);
  const max = Math.max(...values);
  const avg = values.length > 0 ? (values.reduce((a, b) => a + b, 0) / values.length).toFixed(1) : 0;

  const getTrend = () => {
    if (!previous) return { icon: <Minus size={16} />, label: 'First reading', color: 'var(--text-muted)' };
    const diff = latest - previous;
    if (diff > 0) return { icon: <TrendingUp size={16} />, label: `+${diff.toFixed(1)}`, color: 'var(--warning)' };
    if (diff < 0) return { icon: <TrendingDown size={16} />, label: `${diff.toFixed(1)}`, color: 'var(--success)' };
    return { icon: <Minus size={16} />, label: 'No change', color: 'var(--text-muted)' };
  };

  const trend = getTrend();

  return (
    <div className="page">
      <div className="page-header">
        <button className="back-btn" onClick={() => navigate(-1)}><ArrowLeft size={20} /></button>
        <h1>{data.parameter.displayName} Trends</h1>
      </div>

      <div className="disclaimer">
        ⚠️ For informational purposes only. This is not a medical diagnosis. Consult your healthcare provider for interpretation.
      </div>

      {data.dataPoints === 0 ? (
        <div className="empty-state">
          <TrendingUp />
          <h3>No data available</h3>
          <p>Upload medical reports containing {data.parameter.displayName.toLowerCase()} values to see trends</p>
        </div>
      ) : (
        <>
          {/* Summary Stats */}
          <div className="stats-grid" style={{ marginBottom: 16 }}>
            <div className="stat-card">
              <div className="stat-value">{latest}</div>
              <div className="stat-label">Latest ({data.parameter.defaultUnit})</div>
            </div>
            <div className="stat-card">
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4, color: trend.color }}>
                {trend.icon}
                <span style={{ fontSize: 16, fontWeight: 700 }}>{trend.label}</span>
              </div>
              <div className="stat-label">Trend</div>
            </div>
            <div className="stat-card">
              <div className="stat-value" style={{ fontSize: 18 }}>{avg}</div>
              <div className="stat-label">Average</div>
            </div>
            <div className="stat-card">
              <div className="stat-value" style={{ fontSize: 18 }}>{data.dataPoints}</div>
              <div className="stat-label">Readings</div>
            </div>
          </div>

          {/* Normal Range */}
          {data.parameter.normalMin != null && data.parameter.normalMax != null && (
            <div className="alert alert-info" style={{ fontSize: 12 }}>
              Normal range: {data.parameter.normalMin}–{data.parameter.normalMax} {data.parameter.defaultUnit}
            </div>
          )}

          {/* Chart */}
          <div className="chart-container">
            <div className="chart-title">
              <TrendingUp size={16} color="var(--primary)" />
              {data.parameter.displayName} Over Time
            </div>

            {chartData.length < 2 ? (
              <div style={{ textAlign: 'center', padding: 20, color: 'var(--text-muted)', fontSize: 13 }}>
                <p>Only {chartData.length} data point{chartData.length !== 1 ? 's' : ''}. Upload more reports to see trends.</p>
                <div style={{ marginTop: 16, fontSize: 24, fontWeight: 700, color: 'var(--primary)' }}>
                  {chartData[0]?.value} {data.parameter.defaultUnit}
                </div>
                <div style={{ fontSize: 12 }}>{chartData[0]?.fullDate}</div>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={250}>
                <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="var(--primary)" stopOpacity={0.2} />
                      <stop offset="95%" stopColor="var(--primary)" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                  <XAxis
                    dataKey="date"
                    tick={{ fontSize: 11, fill: 'var(--text-muted)' }}
                    tickLine={false}
                  />
                  <YAxis
                    tick={{ fontSize: 11, fill: 'var(--text-muted)' }}
                    tickLine={false}
                    domain={['auto', 'auto']}
                  />
                  <Tooltip
                    contentStyle={{
                      background: 'var(--bg-card)',
                      border: '1px solid var(--border)',
                      borderRadius: 8,
                      fontSize: 12,
                    }}
                    formatter={(value) => [`${value} ${data.parameter.defaultUnit}`, data.parameter.displayName]}
                    labelFormatter={(label) => `Date: ${label}`}
                  />
                  {data.parameter.normalMin != null && (
                    <ReferenceLine
                      y={data.parameter.normalMin}
                      stroke="var(--success)"
                      strokeDasharray="5 5"
                      label={{ value: 'Min', fontSize: 10, fill: 'var(--success)' }}
                    />
                  )}
                  {data.parameter.normalMax != null && (
                    <ReferenceLine
                      y={data.parameter.normalMax}
                      stroke="var(--warning)"
                      strokeDasharray="5 5"
                      label={{ value: 'Max', fontSize: 10, fill: 'var(--warning)' }}
                    />
                  )}
                  <Area
                    type="monotone"
                    dataKey="value"
                    stroke="var(--primary)"
                    strokeWidth={2}
                    fill="url(#colorValue)"
                    dot={{ fill: 'var(--primary)', r: 4 }}
                    activeDot={{ r: 6, fill: 'var(--primary)' }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>

          {/* Measurement History */}
          <div className="section">
            <div className="section-title">Measurement History</div>
            {data.measurements.slice().reverse().map((m, i) => (
              <div key={m.id} className="param-card">
                <div style={{ width: 40, textAlign: 'center' }}>
                  <span style={{ fontSize: 18, fontWeight: 700, color: 'var(--primary)' }}>{m.value}</span>
                </div>
                <div className="param-info">
                  <div className="param-unit">{m.unit}</div>
                  <div className="param-date">{new Date(m.measuredAt).toLocaleDateString()}</div>
                </div>
                <div>
                  {m.isManualEntry && <span className="badge badge-completed" style={{ fontSize: 9 }}>Corrected</span>}
                  {m.confidence && (
                    <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>
                      {(m.confidence * 100).toFixed(0)}% conf.
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
