import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { documentsAPI, categoriesAPI } from '../api/client';
import { ArrowLeft, FileText, Clock, CheckCircle, AlertCircle, Filter } from 'lucide-react';

export default function RecordsScreen() {
  const [documents, setDocuments] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState(null);
  const [filterStatus, setFilterStatus] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    loadDocuments();
  }, [page, filterStatus, filterCategory]);

  useEffect(() => {
    loadCategories();
  }, []);

  const loadCategories = async () => {
    try {
      const res = await categoriesAPI.list();
      setCategories(res.data.categories);
    } catch {}
  };

  const loadDocuments = async () => {
    setLoading(true);
    try {
      const params = { page, limit: 20 };
      if (filterStatus) params.status = filterStatus;
      if (filterCategory) params.categoryId = filterCategory;
      const res = await documentsAPI.list(params);
      setDocuments(res.data.documents);
      setPagination(res.data.pagination);
    } catch (err) {
      console.error('Load docs error:', err);
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

  return (
    <div className="page">
      <div className="page-header">
        <h1>Medical Records</h1>
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 16, overflowX: 'auto' }}>
        <select
          className="form-input form-select"
          style={{ flex: 1, padding: '8px 30px 8px 10px', fontSize: 13 }}
          value={filterStatus}
          onChange={e => { setFilterStatus(e.target.value); setPage(1); }}
        >
          <option value="">All Statuses</option>
          <option value="UPLOADED">Uploaded</option>
          <option value="PROCESSING">Processing</option>
          <option value="COMPLETED">Completed</option>
          <option value="FAILED">Failed</option>
        </select>
        <select
          className="form-input form-select"
          style={{ flex: 1, padding: '8px 30px 8px 10px', fontSize: 13 }}
          value={filterCategory}
          onChange={e => { setFilterCategory(e.target.value); setPage(1); }}
        >
          <option value="">All Categories</option>
          {categories.map(cat => (
            <option key={cat.id} value={cat.id}>{cat.icon} {cat.name}</option>
          ))}
        </select>
      </div>

      {loading ? (
        <div className="loading-container"><div className="spinner" /><p>Loading records...</p></div>
      ) : documents.length === 0 ? (
        <div className="empty-state">
          <FileText />
          <h3>No records found</h3>
          <p>{filterStatus || filterCategory ? 'Try changing filters' : 'Upload your first medical document'}</p>
          <Link to="/upload" className="btn btn-primary" style={{ marginTop: 16 }}>Upload Document</Link>
        </div>
      ) : (
        <>
          {documents.map(doc => (
            <Link to={`/documents/${doc.id}`} key={doc.id} className="doc-item">
              <div className={`doc-icon ${doc.fileType.includes('pdf') ? 'doc-icon-pdf' : 'doc-icon-img'}`}>
                {doc.fileType.includes('pdf') ? '📄' : '🖼️'}
              </div>
              <div className="doc-info">
                <div className="doc-name">{doc.originalName}</div>
                <div className="doc-meta">
                  {new Date(doc.uploadedAt).toLocaleDateString()} • {(doc.fileSize / 1024).toFixed(0)} KB
                  {doc.category && ` • ${doc.category.icon} ${doc.category.name}`}
                </div>
                {doc.tags?.length > 0 && (
                  <div className="tag-list" style={{ marginTop: 4 }}>
                    {doc.tags.slice(0, 3).map(t => <span key={t.id} className="tag">{t.tag}</span>)}
                  </div>
                )}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4 }}>
                {getStatusBadge(doc.processingStatus)}
                {doc._count?.healthMeasurements > 0 && (
                  <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                    {doc._count.healthMeasurements} params
                  </span>
                )}
              </div>
            </Link>
          ))}

          {/* Pagination */}
          {pagination && pagination.pages > 1 && (
            <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginTop: 16 }}>
              <button
                className="btn btn-sm btn-secondary"
                disabled={page === 1}
                onClick={() => setPage(p => p - 1)}
              >Previous</button>
              <span style={{ padding: '8px 12px', fontSize: 13 }}>
                {page} / {pagination.pages}
              </span>
              <button
                className="btn btn-sm btn-secondary"
                disabled={page >= pagination.pages}
                onClick={() => setPage(p => p + 1)}
              >Next</button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
