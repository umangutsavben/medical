import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { documentsAPI } from '../api/client';
import { ArrowLeft, Upload, FileText, Camera, X } from 'lucide-react';

export default function UploadScreen() {
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(null);
  const [dragging, setDragging] = useState(false);
  const fileInputRef = useRef(null);
  const cameraInputRef = useRef(null);
  const navigate = useNavigate();

  const MAX_SIZE = 10 * 1024 * 1024; // 10MB
  const ALLOWED = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png'];

  const validateFile = (f) => {
    if (!ALLOWED.includes(f.type)) {
      setError('Invalid file type. Allowed: PDF, JPG, JPEG, PNG');
      return false;
    }
    if (f.size > MAX_SIZE) {
      setError('File too large. Maximum: 10MB');
      return false;
    }
    return true;
  };

  const handleFile = (f) => {
    setError('');
    if (validateFile(f)) {
      setFile(f);
    }
  };

  const handleUpload = async () => {
    if (!file) return;
    setUploading(true);
    setProgress(0);
    setError('');

    try {
      const res = await documentsAPI.upload(file, (e) => {
        if (e.total) {
          setProgress(Math.round((e.loaded * 100) / e.total));
        }
      });

      setSuccess(res.data.document);

      // Auto-trigger OCR processing
      try {
        await documentsAPI.process(res.data.document.id);
      } catch (processErr) {
        console.log('Auto-process queued or error:', processErr);
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragging(false);
    const f = e.dataTransfer.files[0];
    if (f) handleFile(f);
  };

  const resetUpload = () => {
    setFile(null);
    setSuccess(null);
    setProgress(0);
    setError('');
  };

  if (success) {
    return (
      <div className="page">
        <div className="page-header">
          <button className="back-btn" onClick={() => navigate(-1)}><ArrowLeft size={20} /></button>
          <h1>Upload Document</h1>
        </div>

        <div style={{ textAlign: 'center', padding: 40 }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>✅</div>
          <h2 style={{ fontSize: 18, marginBottom: 8 }}>Upload Successful!</h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: 14, marginBottom: 8 }}>
            {success.originalName}
          </p>
          <p style={{ color: 'var(--text-muted)', fontSize: 13, marginBottom: 24 }}>
            OCR processing has been started automatically. You can check the results in the document details.
          </p>
          <div style={{ display: 'flex', gap: 10, flexDirection: 'column' }}>
            <button className="btn btn-primary btn-full" onClick={() => navigate(`/documents/${success.id}`)}>
              View Document
            </button>
            <button className="btn btn-secondary btn-full" onClick={resetUpload}>
              Upload Another
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="page">
      <div className="page-header">
        <button className="back-btn" onClick={() => navigate(-1)}><ArrowLeft size={20} /></button>
        <h1>Upload Document</h1>
      </div>

      <div className="alert alert-info">
        📋 Upload medical reports (PDF, JPG, PNG). OCR processing will extract text and health parameters automatically.
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      {!file ? (
        <>
          <div
            className={`upload-area ${dragging ? 'dragging' : ''}`}
            onClick={() => fileInputRef.current?.click()}
            onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
            onDragLeave={() => setDragging(false)}
            onDrop={handleDrop}
          >
            <Upload />
            <h3>Tap to select a file</h3>
            <p>or drag and drop here</p>
            <p style={{ marginTop: 8 }}>PDF, JPG, PNG • Max 10MB</p>
          </div>

          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf,.jpg,.jpeg,.png"
            style={{ display: 'none' }}
            onChange={(e) => e.target.files[0] && handleFile(e.target.files[0])}
          />

          <div style={{ marginTop: 16 }}>
            <button
              className="btn btn-secondary btn-full"
              onClick={() => cameraInputRef.current?.click()}
            >
              <Camera size={16} /> Take Photo
            </button>
            <input
              ref={cameraInputRef}
              type="file"
              accept="image/*"
              capture="environment"
              style={{ display: 'none' }}
              onChange={(e) => e.target.files[0] && handleFile(e.target.files[0])}
            />
          </div>
        </>
      ) : (
        <div className="card">
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
            <div className={`doc-icon ${file.type.includes('pdf') ? 'doc-icon-pdf' : 'doc-icon-img'}`}>
              {file.type.includes('pdf') ? '📄' : '🖼️'}
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 14, fontWeight: 600, wordBreak: 'break-all' }}>{file.name}</div>
              <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                {(file.size / 1024).toFixed(0)} KB • {file.type}
              </div>
            </div>
            <button className="btn btn-icon btn-secondary" onClick={resetUpload}>
              <X size={16} />
            </button>
          </div>

          {uploading && (
            <div style={{ marginBottom: 16 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: 'var(--text-muted)', marginBottom: 4 }}>
                <span>Uploading...</span>
                <span>{progress}%</span>
              </div>
              <div className="progress-bar">
                <div className="progress-fill" style={{ width: `${progress}%` }} />
              </div>
            </div>
          )}

          <button
            className="btn btn-primary btn-full"
            onClick={handleUpload}
            disabled={uploading}
          >
            <Upload size={16} /> {uploading ? `Uploading... ${progress}%` : 'Upload Document'}
          </button>
        </div>
      )}
    </div>
  );
}
