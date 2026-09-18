import { useState } from 'react';
import { Link } from 'react-router-dom';
import { searchAPI } from '../api/client';
import { Search as SearchIcon, FileText, Clock, CheckCircle, AlertCircle } from 'lucide-react';

export default function SearchScreen() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [pagination, setPagination] = useState(null);

  const handleSearch = async (e) => {
    e?.preventDefault();
    if (!query.trim()) return;

    setLoading(true);
    setSearched(true);
    try {
      const res = await searchAPI.search(query.trim());
      setResults(res.data.results);
      setPagination(res.data.pagination);
    } catch (err) {
      console.error('Search error:', err);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status) => {
    const map = {
      UPLOADED: { cls: 'badge-uploaded', label: 'Uploaded' },
      PROCESSING: { cls: 'badge-processing', label: 'Processing' },
      COMPLETED: { cls: 'badge-completed', label: 'Completed' },
      FAILED: { cls: 'badge-failed', label: 'Failed' },
    };
    const s = map[status] || map.UPLOADED;
    return <span className={`badge ${s.cls}`}>{s.label}</span>;
  };

  return (
    <div className="page">
      <div className="page-header">
        <h1>Search Records</h1>
      </div>

      <form onSubmit={handleSearch}>
        <div className="search-bar">
          <SearchIcon />
          <input
            type="text"
            placeholder="Search by name, text, category..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            autoFocus
          />
        </div>
      </form>

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 16 }}>
        {['glucose', 'hemoglobin', 'blood test', 'prescription', 'cholesterol'].map(term => (
          <button
            key={term}
            className="tag"
            style={{ cursor: 'pointer', border: 'none' }}
            onClick={() => { setQuery(term); setTimeout(() => handleSearch(), 0); }}
          >
            {term}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="loading-container"><div className="spinner" /><p>Searching...</p></div>
      ) : searched && results.length === 0 ? (
        <div className="empty-state">
          <SearchIcon />
          <h3>No results found</h3>
          <p>Try different keywords like "glucose", "blood test", or "prescription"</p>
        </div>
      ) : (
        <>
          {pagination && pagination.total > 0 && (
            <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 12 }}>
              Found {pagination.total} result{pagination.total !== 1 ? 's' : ''}
            </p>
          )}
          {results.map(doc => (
            <Link to={`/documents/${doc.id}`} key={doc.id} className="doc-item">
              <div className={`doc-icon ${doc.fileType?.includes('pdf') ? 'doc-icon-pdf' : 'doc-icon-img'}`}>
                {doc.fileType?.includes('pdf') ? '📄' : '🖼️'}
              </div>
              <div className="doc-info">
                <div className="doc-name">{doc.originalName}</div>
                <div className="doc-meta">
                  {new Date(doc.uploadedAt).toLocaleDateString()}
                  {doc.category && ` • ${doc.category.icon} ${doc.category.name}`}
                </div>
                {doc.extractedText?.snippet && (
                  <div style={{
                    fontSize: 12, color: 'var(--text-secondary)',
                    marginTop: 4, fontStyle: 'italic',
                    overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap'
                  }}>
                    "{doc.extractedText.snippet}"
                  </div>
                )}
              </div>
              {getStatusBadge(doc.processingStatus)}
            </Link>
          ))}
        </>
      )}
    </div>
  );
}
