import React, { useState, useEffect, useRef } from 'react';

const Library = () => {
    const [videos, setVideos] = useState([]);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState(null);

    // Upload States
    const [showUpload, setShowUpload] = useState(false);
    const [file, setFile] = useState(null);
    const [uploadStatus, setUploadStatus] = useState('');
    const [uploading, setUploading] = useState(false);
    const [dragOver, setDragOver] = useState(false);
    const fileInputRef = useRef(null);

    const fetchVideos = async () => {
        try {
            const response = await fetch('http://localhost:8000/api/videos');
            if (response.ok) {
                const data = await response.json();
                setVideos(data.videos || []);
            }
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchVideos();
        const interval = setInterval(fetchVideos, 5000);
        return () => clearInterval(interval);
    }, []);

    const handleDelete = async (videoId, filename) => {
        if (!confirm(`Delete "${filename}"? This cannot be undone.`)) return;

        setActionLoading(videoId);
        try {
            const response = await fetch(`http://localhost:8000/api/videos/${videoId}`, {
                method: 'DELETE'
            });
            if (response.ok) {
                setVideos(videos.filter(v => v.video_id !== videoId));
            } else {
                alert('Failed to delete video');
            }
        } catch (error) {
            console.error(error);
            alert('Failed to delete video');
        } finally {
            setActionLoading(null);
        }
    };

    const handleRetry = async (videoId) => {
        setActionLoading(videoId);
        try {
            const response = await fetch(`http://localhost:8000/api/videos/${videoId}/retry`, {
                method: 'POST'
            });
            if (response.ok) {
                fetchVideos();
            } else {
                alert('Failed to retry indexing');
            }
        } catch (error) {
            console.error(error);
            alert('Failed to retry indexing');
        } finally {
            setActionLoading(null);
        }
    };

    // Upload Handlers
    const handleFileChange = (e) => {
        if (e.target.files && e.target.files[0]) {
            setFile(e.target.files[0]);
            setUploadStatus('');
        }
    };

    const handleDrop = (e) => {
        e.preventDefault();
        setDragOver(false);
        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            setFile(e.dataTransfer.files[0]);
            setUploadStatus('');
        }
    };

    const handleDragOver = (e) => {
        e.preventDefault();
        setDragOver(true);
    };

    const handleDragLeave = () => {
        setDragOver(false);
    };

    const handleUpload = async () => {
        if (!file) return;

        setUploading(true);
        setUploadStatus('uploading');

        const formData = new FormData();
        formData.append('file', file);

        try {
            const response = await fetch('http://localhost:8000/api/upload', {
                method: 'POST',
                body: formData,
            });

            if (response.ok) {
                setUploadStatus('success');
                setFile(null);
                setTimeout(() => {
                    setShowUpload(false);
                    setUploadStatus('');
                    fetchVideos();
                }, 2000);
            } else {
                setUploadStatus('error');
            }
        } catch (error) {
            setUploadStatus('error');
            console.error(error);
        } finally {
            setUploading(false);
        }
    };

    const formatFileSize = (bytes) => {
        if (bytes < 1024) return bytes + ' B';
        if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
        return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
    };

    const formatDate = (isoString) => {
        if (!isoString || isoString === 'unknown') return 'Unknown';
        try {
            const date = new Date(isoString);
            return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
        } catch {
            return isoString;
        }
    };

    const getStatusClass = (status) => {
        const map = { completed: 'completed', processing: 'processing', failed: 'failed' };
        return map[status] || 'processing';
    };

    const getStatusText = (status) => {
        const map = { completed: 'Indexed', processing: 'Processing', failed: 'Failed' };
        return map[status] || 'Processing';
    };

    // Calculate stats
    const stats = {
        total: videos.length,
        indexed: videos.filter(v => v.status === 'completed').length,
        processing: videos.filter(v => v.status === 'processing').length
    };

    return (
        <div className="library-page fade-in">
            {/* Page Header */}
            <div className="page-header">
                <div className="page-header-content">
                    <div>
                        <h1 className="page-title">Video Library</h1>
                        <p className="page-subtitle">Manage and monitor your indexed video collection</p>
                    </div>
                    <div style={{ display: 'flex', gap: '0.75rem' }}>
                        <button
                            onClick={() => setShowUpload(!showUpload)}
                            className={`search-chip ${showUpload ? 'active' : ''}`}
                            style={{
                                padding: '0.75rem 1.25rem',
                                background: showUpload ? 'var(--primary)' : 'var(--primary-light)',
                                color: showUpload ? 'white' : 'var(--primary)',
                                border: 'none'
                            }}
                        >
                            {showUpload ? '✕ Close Upload' : '➕ Add Video'}
                        </button>
                        <button onClick={fetchVideos} className="search-chip" style={{ padding: '0.75rem 1.25rem' }}>
                            ↻ Refresh
                        </button>
                    </div>
                </div>
            </div>

            {/* Collapsible Upload Section */}
            {showUpload && (
                <div className="upload-container fade-in" style={{ marginBottom: '2.5rem', maxWidth: '100%' }}>
                    <div
                        className={`upload-dropzone ${dragOver ? 'dragover' : ''}`}
                        onDrop={handleDrop}
                        onDragOver={handleDragOver}
                        onDragLeave={handleDragLeave}
                        onClick={() => fileInputRef.current?.click()}
                        style={{ background: 'white' }}
                    >
                        <input
                            type="file"
                            ref={fileInputRef}
                            onChange={handleFileChange}
                            accept="video/*"
                            style={{ display: 'none' }}
                        />

                        <div className="upload-icon">
                            <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                                <polyline points="17 8 12 3 7 8" />
                                <line x1="12" y1="3" x2="12" y2="15" />
                            </svg>
                        </div>

                        {file ? (
                            <>
                                <h3 className="upload-title">{file.name}</h3>
                                <p className="upload-subtitle">
                                    {(file.size / (1024 * 1024)).toFixed(2)} MB • Click to change
                                </p>
                            </>
                        ) : (
                            <>
                                <h3 className="upload-title">Drop your video here</h3>
                                <p className="upload-subtitle">or click to browse from your computer</p>
                            </>
                        )}
                        <p className="upload-formats">Supports MP4, AVI, MOV, MKV</p>
                    </div>

                    {file && (
                        <div style={{ textAlign: 'center', marginTop: '1.5rem' }}>
                            <button
                                onClick={handleUpload}
                                disabled={uploading}
                                className="upload-button"
                                style={{ width: '240px' }}
                            >
                                {uploading ? 'Uploading...' : 'Start Indexing'}
                            </button>
                        </div>
                    )}

                    {uploadStatus === 'uploading' && (
                        <div className="upload-progress">
                            <div className="progress-bar-wrapper">
                                <div className="progress-bar" style={{ width: '60%' }}></div>
                            </div>
                            <p className="progress-text">Uploading and processing video...</p>
                        </div>
                    )}

                    {uploadStatus === 'success' && (
                        <div className="upload-progress" style={{ borderColor: 'var(--success)', background: 'var(--success-bg)' }}>
                            <p style={{ color: '#047857', fontWeight: 600, textAlign: 'center' }}>
                                ✓ Video uploaded successfully! Indexing has started.
                            </p>
                        </div>
                    )}

                    {uploadStatus === 'error' && (
                        <div className="upload-progress" style={{ borderColor: 'var(--danger)', background: 'var(--danger-bg)' }}>
                            <p style={{ color: '#b91c1c', fontWeight: 600, textAlign: 'center' }}>
                                ✗ Upload failed. Please try again.
                            </p>
                        </div>
                    )}
                </div>
            )}

            {/* Stats Cards */}
            <div className="stats-grid">
                <div className="stat-card">
                    <div className="stat-card-icon purple">📹</div>
                    <div className="stat-card-content">
                        <h3>{stats.total}</h3>
                        <p>Total Videos</p>
                    </div>
                </div>
                <div className="stat-card">
                    <div className="stat-card-icon green">✓</div>
                    <div className="stat-card-content">
                        <h3>{stats.indexed}</h3>
                        <p>Indexed</p>
                    </div>
                </div>
                <div className="stat-card">
                    <div className="stat-card-icon amber">⏳</div>
                    <div className="stat-card-content">
                        <h3>{stats.processing}</h3>
                        <p>Processing</p>
                    </div>
                </div>
            </div>

            {/* Loading State */}
            {loading && (
                <div className="loading-state" style={{ marginTop: '2rem' }}>
                    <div className="loader"></div>
                    <p>Loading your library...</p>
                </div>
            )}

            {/* Empty State */}
            {!loading && videos.length === 0 && !showUpload && (
                <div className="empty-state" style={{ marginTop: '2rem' }}>
                    <div className="empty-state-icon">
                        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                            <rect x="2" y="2" width="20" height="20" rx="2.18" ry="2.18" />
                            <line x1="7" y1="2" x2="7" y2="22" />
                            <line x1="17" y1="2" x2="17" y2="22" />
                            <line x1="2" y1="12" x2="22" y2="12" />
                        </svg>
                    </div>
                    <h3 className="empty-state-title">Your library is empty</h3>
                    <p className="empty-state-text">
                        Upload your first video to start building your searchable video library.
                    </p>
                    <button
                        onClick={() => setShowUpload(true)}
                        className="search-button"
                        style={{ marginTop: '1.5rem', width: 'auto', padding: '0.75rem 2rem' }}
                    >
                        Upload Video
                    </button>
                </div>
            )}

            {/* Video Grid */}
            {!loading && videos.length > 0 && (
                <div className="video-grid" style={{ marginTop: '2rem' }}>
                    {videos.map((video) => (
                        <div key={video.video_id} className="video-card">
                            <div className="video-thumb">
                                <video preload="metadata">
                                    <source src={`http://localhost:8000/api/videos/${video.video_id}`} type="video/mp4" />
                                </video>
                                <div className="video-thumb-overlay">
                                    <div className="video-play-icon">
                                        <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                                            <path d="M8 5v14l11-7z" />
                                        </svg>
                                    </div>
                                </div>
                            </div>
                            <div className="video-body">
                                <h3 className="video-title" title={video.filename}>
                                    {video.filename}
                                </h3>
                                <div className="video-meta-row">
                                    <span className={`status-badge ${getStatusClass(video.status)}`}>
                                        <span className="status-dot"></span>
                                        {getStatusText(video.status)}
                                    </span>
                                    <span className="video-size">{formatFileSize(video.file_size)}</span>
                                </div>
                                <p className="video-date">Uploaded {formatDate(video.uploaded_at)}</p>

                                {/* Action Buttons */}
                                <div className="video-actions">
                                    {video.status === 'failed' && (
                                        <button
                                            className="video-action-btn retry"
                                            onClick={() => handleRetry(video.video_id)}
                                            disabled={actionLoading === video.video_id}
                                        >
                                            {actionLoading === video.video_id ? '...' : '↻ Retry'}
                                        </button>
                                    )}
                                    <button
                                        className="video-action-btn delete"
                                        onClick={() => handleDelete(video.video_id, video.filename)}
                                        disabled={actionLoading === video.video_id}
                                    >
                                        {actionLoading === video.video_id ? '...' : '🗑 Delete'}
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default Library;

