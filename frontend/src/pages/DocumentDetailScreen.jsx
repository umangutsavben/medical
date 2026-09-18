import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { documentsAPI, categoriesAPI, healthAPI } from '../api/client';
import { ArrowLeft, RefreshCw, Trash2, FileText, Activity, Tag, Clock, CheckCircle, AlertCircle, Edit3 } from 'lucide-react';

export default function DocumentDetailScreen() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [doc, setDoc] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [tab, setTab] = useState('info');
  const [processing, setProcessing] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [categories, setCategories] = useState([]);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [editingMeasurement, setEditingMeasurement] = useState(null);
  const [correctionValue, setCorrectionValue] = useState('');
  const [correctionDate, setCorrectionDate] = useState('');

  useEffect(() => {
    loadDocument();
    loadCategories();
  }, [id]);

  // Auto-refresh when processing
  useEffect(() => {
    if (doc?.processingStatus === 'PROCESSING') {
      const interval = setInterval(loadDocument, 3000);
      return () => clearInterval(interval);
    }
  }, [doc?.processingStatus]);

  const loadDocument = async () => {
    try {
      const res = await documentsAPI.get(id);
      setDoc(res.data.document);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to load document');
    } finally {
      setLoading(false);
    }
  };

  const loadCategories = async () => {
    try {
      const res = await categoriesAPI.list();
      setCategories(res.data.categories);
    } catch {}
  };

  const handleProcess = async () => {
    setProcessing(true);
    try {
      await documentsAPI.process(id);
      setDoc(prev => ({ ...prev, processingStatus: 'PROCESSING' }));
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to start processing');
    } finally {
      setProcessing(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('Delete this document? This cannot be undone.')) return;
    setDeleting(true);
    try {
      await documentsAPI.delete(id);
      navigate('/records', { replace: true });
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to delete');
      setDeleting(false);
    }
  };

  const handleCategoryChange = async (categoryId) => {
    try {
      await documentsAPI.updateCategory(id, categoryId);
      loadDocument();
      setShowCategoryModal(false);
    } catch (err) {
      setError('Failed to update category');
    }
  };

  const handleCorrection = async (measurementId) => {
    try {
      const data = { value: parseFloat(correctionValue) };
      if (correctionDate) data.measuredAt = correctionDate;
      
      await healthAPI.correctMeasurement(measurementId, data);
      setEditingMeasurement(null);
      setCorrectionValue('');
      setCorrectionDate('');
      loadDocument();
    } catch (err) {
      setError('Failed to correct measurement');
    }
  };

  const getStatusInfo = (status) => {
    const map = {
      UPLOADED: { cls: 'badge-uploaded', icon: <Clock size={12} />, label: 'Uploaded - Pending processing' },
      PROCESSING: { cls: 'badge-processing', icon: <RefreshCw size={12} className="spinning" />, label: 'Processing...' },
      COMPLETED: { cls: 'badge-completed', icon: <CheckCircle size={12} />, label: 'Processing completed' },
      FAILED: { cls: 'badge-failed', icon: <AlertCircle size={12} />, label: 'Processing failed' },
    };
    return map[status] || map.UPLOADED;
  };

  if (loading) {
    return <div className="page"><div className="loading-container"><div className="spinner" /><p>Loading document...</p></div></div>;
  }

  if (error && !doc) {
    return (
      <div className="page">
        <div className="page-header">
          <button className="back-btn" onClick={() => navigate(-1)}><ArrowLeft size={20} /></button>
          <h1>Document</h1>
        </div>
        <div className="alert alert-error">{error}</div>
      </div>
    );
  }

  const statusInfo = getStatusInfo(doc.processingStatus);

  return (
    <div className="page">
      <div className="page-header">
        <button className="back-btn" onClick={() => navigate(-1)}><ArrowLeft size={20} /></button>
        <h1 style={{ flex: 1, fontSize: 16 }}>{doc.originalName}</h1>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      {/* Status Banner */}
      <div className={`alert ${statusInfo.cls.replace('badge-', 'alert-')}`} style={{ marginBottom: 16 }}>
        {statusInfo.icon} {statusInfo.label}
        {doc.processingError && <div style={{ fontSize: 12, marginTop: 4 }}>{doc.processingError}</div>}
      </div>

      {/* Actions */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
        {(doc.processingStatus === 'UPLOADED' || doc.processingStatus === 'FAILED') && (
          <button className="btn btn-primary btn-sm" onClick={handleProcess} disabled={processing}>
            <RefreshCw size={14} /> {processing ? 'Starting...' : 'Process OCR'}
          </button>
        )}
        <button className="btn btn-secondary btn-sm" onClick={() => setShowCategoryModal(true)}>
          <Tag size={14} /> Category
        </button>
        <button className="btn btn-danger btn-sm" onClick={handleDelete} disabled={deleting} style={{ marginLeft: 'auto' }}>
          <Trash2 size={14} />
        </button>
      </div>

      {/* Tabs */}
      <div className="tabs">
        <button className={`tab ${tab === 'info' ? 'active' : ''}`} onClick={() => setTab('info')}>Info</button>
        <button className={`tab ${tab === 'text' ? 'active' : ''}`} onClick={() => setTab('text')}>OCR Text</button>
        <button className={`tab ${tab === 'params' ? 'active' : ''}`} onClick={() => setTab('params')}>Parameters</button>
      </div>

      {/* Tab Content */}
      {tab === 'info' && (
        <div className="card">
          <InfoRow label="File Name" value={doc.originalName} />
          <InfoRow label="File Type" value={doc.fileType} />
          <InfoRow label="File Size" value={`${(doc.fileSize / 1024).toFixed(1)} KB`} />
          <InfoRow label="Uploaded" value={new Date(doc.uploadedAt).toLocaleString()} />
          <InfoRow label="Category" value={doc.category ? `${doc.category.icon} ${doc.category.name}` : 'Not categorized'} />
          <InfoRow label="Status" value={doc.processingStatus} />
          {doc.extractedText && (
            <InfoRow label="OCR Confidence" value={`${doc.extractedText.confidence?.toFixed(1) || '?'}%`} />
          )}
          {doc.tags?.length > 0 && (
            <div style={{ padding: '10px 0' }}>
              <div style={{ fontSize: 14, color: 'var(--text-secondary)', marginBottom: 6 }}>Tags</div>
              <div className="tag-list">
                {doc.tags.map(t => <span key={t.id} className="tag">{t.tag}</span>)}
              </div>
            </div>
          )}
        </div>
      )}

      {tab === 'text' && (
        <div>
          {doc.extractedText ? (
            <>
              <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 8 }}>
                Confidence: {doc.extractedText.confidence?.toFixed(1)}%
              </div>
              <div className="extracted-text">{doc.extractedText.text || 'No text extracted'}</div>
            </>
          ) : (
            <div className="empty-state">
              <FileText />
              <h3>No text extracted</h3>
              <p>Process this document to extract text using OCR</p>
            </div>
          )}
        </div>
      )}

      {tab === 'params' && (
        <div>
          <div className="disclaimer">
            Values are extracted automatically and may need review. Tap a measurement to correct it.
          </div>
          {doc.healthMeasurements?.length > 0 ? (
            doc.healthMeasurements.map(m => (
              <div key={m.id} className="param-card" onClick={() => {
                setEditingMeasurement(m);
                setCorrectionValue(String(m.value));
                setCorrectionDate(m.measuredAt?.split('T')[0] || '');
              }}>
                <div className="param-icon" style={{ background: 'var(--primary-light)' }}>
                  <Activity size={18} color="var(--primary)" />
                </div>
                <div className="param-info">
                  <div className="param-name">{m.parameter?.displayName || m.parameterId}</div>
                  <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                    {m.originalText && `"${m.originalText}"`}
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div className="param-value">{m.value}</div>
                  <div className="param-unit">{m.unit}</div>
                  {m.isManualEntry && <span className="badge badge-completed" style={{ fontSize: 9 }}>Corrected</span>}
                </div>
              </div>
            ))
          ) : (
            <div className="empty-state">
              <Activity />
              <h3>No parameters extracted</h3>
              <p>{doc.processingStatus === 'COMPLETED' ? 'No health parameters found in this document' : 'Process the document first'}</p>
            </div>
          )}
        </div>
      )}

      {/* Category Modal */}
      {showCategoryModal && (
        <div className="modal-overlay" onClick={() => setShowCategoryModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Select Category</h2>
              <button className="btn btn-icon btn-secondary" onClick={() => setShowCategoryModal(false)}>✕</button>
            </div>
            {categories.map(cat => (
              <div
                key={cat.id}
                className="param-card"
                onClick={() => handleCategoryChange(cat.id)}
                style={{ cursor: 'pointer' }}
              >
                <span style={{ fontSize: 20 }}>{cat.icon}</span>
                <div className="param-info">
                  <div className="param-name">{cat.name}</div>
                  <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{cat.description}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Correction Modal */}
      {editingMeasurement && (
        <div className="modal-overlay" onClick={() => setEditingMeasurement(null)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Correct Measurement</h2>
              <button className="btn btn-icon btn-secondary" onClick={() => setEditingMeasurement(null)}>✕</button>
            </div>
            <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 16 }}>
              {editingMeasurement.parameter?.displayName} — Original: "{editingMeasurement.originalText}"
            </p>
            <div className="form-group">
              <label className="form-label">Value</label>
              <input
                type="number"
                step="any"
                className="form-input"
                value={correctionValue}
                onChange={e => setCorrectionValue(e.target.value)}
              />
            </div>
            <div className="form-group">
              <label className="form-label">Measurement Date</label>
              <input
                type="date"
                className="form-input"
                value={correctionDate}
                onChange={e => setCorrectionDate(e.target.value)}
              />
            </div>
            <button
              className="btn btn-primary btn-full"
              onClick={() => handleCorrection(editingMeasurement.id)}
            >
              <Edit3 size={14} /> Save Correction
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function InfoRow({ label, value }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid var(--border)' }}>
      <span style={{ fontSize: 14, color: 'var(--text-secondary)' }}>{label}</span>
      <span style={{ fontSize: 14, fontWeight: 500, maxWidth: '60%', textAlign: 'right', wordBreak: 'break-all' }}>{value}</span>
    </div>
  );
}
