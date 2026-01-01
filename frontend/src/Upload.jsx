import React, { useState } from 'react';

const Upload = () => {
    const [file, setFile] = useState(null);
    const [status, setStatus] = useState('');
    const [uploading, setUploading] = useState(false);

    const handleFileChange = (e) => {
        setFile(e.target.files[0]);
    };

    const handleUpload = async () => {
        if (!file) return;

        setUploading(true);
        setStatus('Uploading...');

        const formData = new FormData();
        formData.append('file', file);

        try {
            const response = await fetch('http://localhost:8000/api/upload', {
                method: 'POST',
                body: formData,
            });

            if (response.ok) {
                const data = await response.json();
                setStatus(`Upload successful. Indexing started. ID: ${data.video_id}`);
            } else {
                setStatus('Upload failed.');
                console.error('Upload failed', response);
            }
        } catch (error) {
            setStatus(`Error: ${error.message}`);
        } finally {
            setUploading(false);
        }
    };

    return (
        <div className="upload-page fade-in" style={{ maxWidth: '800px', margin: '0 auto' }}>
            <div className="section-header" style={{ textAlign: 'center', marginBottom: '2rem' }}>
                <h2>Expand Your Library</h2>
                <p style={{ color: 'var(--text-muted)' }}>Upload videos to make them searchable via Natural Language</p>
            </div>

            <div className="upload-zone">
                <div style={{ marginBottom: '2rem' }}>
                    <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="var(--primary)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ opacity: 0.5 }}>
                        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                        <polyline points="17 8 12 3 7 8"></polyline>
                        <line x1="12" y1="3" x2="12" y2="15"></line>
                    </svg>
                </div>

                <label className="file-input-label" style={{ display: 'block', marginBottom: '1.5rem' }}>
                    <input
                        type="file"
                        onChange={handleFileChange}
                        accept="video/*"
                        style={{ display: 'none' }}
                        id="video-upload"
                    />
                    <span className="primary-button" style={{ display: 'inline-block', cursor: 'pointer' }}>
                        {file ? file.name : 'Choose Video File'}
                    </span>
                </label>

                <button
                    onClick={handleUpload}
                    disabled={!file || uploading}
                    className="primary-button"
                    style={{ background: uploading ? 'var(--text-muted)' : 'var(--text-main)', width: '200px' }}
                >
                    {uploading ? 'Processing...' : 'Start Indexing'}
                </button>

                {status && (
                    <div style={{
                        marginTop: '2rem',
                        padding: '1rem',
                        borderRadius: '12px',
                        background: status.includes('Error') ? '#fff1f0' : '#f0fdf4',
                        color: status.includes('Error') ? 'var(--danger)' : 'var(--success)',
                        fontSize: '0.9rem',
                        fontWeight: 500
                    }}>
                        {status}
                    </div>
                )}
            </div>
        </div>
    );

};

export default Upload;
