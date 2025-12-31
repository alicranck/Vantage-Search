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
        <div style={{ maxWidth: '600px', margin: '0 auto' }}>
            <h2>Upload Video</h2>
            <div style={{ border: '2px dashed #ccc', padding: '40px', textAlign: 'center', borderRadius: '8px' }}>
                <input type="file" onChange={handleFileChange} accept="video/*" />
                <div style={{ marginTop: '20px' }}>
                    <button
                        onClick={handleUpload}
                        disabled={!file || uploading}
                        style={{ padding: '10px 20px', fontSize: '16px', background: '#007bff', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
                    >
                        {uploading ? 'Uploading...' : 'Upload & Index'}
                    </button>
                </div>
            </div>
            {status && <p style={{ marginTop: '20px', padding: '10px', background: '#f8f9fa' }}>{status}</p>}
        </div>
    );
};

export default Upload;
