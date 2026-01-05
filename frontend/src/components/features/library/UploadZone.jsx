import React, { useState, useRef } from 'react';
import { Button } from '../../common/Button';
import { UploadIcon, CheckCircleIcon, XIcon } from '../../common/Icon';

export const UploadZone = ({ onUpload, status, onClose }) => {
    const [file, setFile] = useState(null);
    const [dragOver, setDragOver] = useState(false);
    const fileInputRef = useRef(null);

    const handleFileChange = (e) => {
        if (e.target.files && e.target.files[0]) {
            setFile(e.target.files[0]);
        }
    };

    const handleDrop = (e) => {
        e.preventDefault();
        setDragOver(false);
        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            setFile(e.dataTransfer.files[0]);
        }
    };

    const handleDragOver = (e) => {
        e.preventDefault();
        setDragOver(true);
    };

    const handleUploadClick = async () => {
        if (!file) return;
        const success = await onUpload(file);
        if (success) {
            setFile(null);
            onClose();
        }
    };

    const formatFileSize = (bytes) => {
        return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
    };

    return (
        <div className="upload-container fade-in">
            <div
                className={`upload-dropzone ${dragOver ? 'dragover' : ''}`}
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                onDragLeave={() => setDragOver(false)}
                onClick={() => fileInputRef.current?.click()}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => e.key === 'Enter' && fileInputRef.current?.click()}
                aria-label="Upload video drop zone"
            >
                <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileChange}
                    accept="video/*"
                    style={{ display: 'none' }}
                />

                <div className="upload-icon">
                    <UploadIcon size={32} strokeWidth={1.5} />
                </div>

                {file ? (
                    <>
                        <h3 className="upload-title">{file.name}</h3>
                        <p className="upload-subtitle">
                            {formatFileSize(file.size)} • Click to change
                        </p>
                    </>
                ) : (
                    <>
                        <h3 className="upload-title">Drop your video here</h3>
                        <p className="upload-subtitle">
                            or click to browse from your computer
                        </p>
                    </>
                )}

                <p className="upload-formats">Supports MP4, AVI, MOV, MKV</p>
            </div>

            {file && (
                <div className="text-center mt-6">
                    <Button
                        onClick={handleUploadClick}
                        disabled={status === 'uploading'}
                        variant="primary"
                        className="w-60"
                    >
                        {status === 'uploading' ? 'Uploading...' : 'Start Indexing'}
                    </Button>
                </div>
            )}

            {status === 'uploading' && (
                <div className="upload-progress">
                    <div className="progress-bar-wrapper">
                        <div className="progress-bar" style={{ width: '60%' }}></div>
                    </div>
                    <p className="progress-text">Uploading and processing video...</p>
                </div>
            )}

            {status === 'success' && (
                <div
                    className="upload-progress"
                    style={{
                        borderColor: 'var(--success)',
                        background: 'var(--success-subtle)'
                    }}
                >
                    <p className="text-center flex justify-center items-center gap-2" style={{ color: '#059669', fontWeight: 600 }}>
                        <CheckCircleIcon size={16} />
                        Video uploaded successfully! Indexing has started.
                    </p>
                </div>
            )}

            {status === 'error' && (
                <div
                    className="upload-progress"
                    style={{
                        borderColor: 'var(--error)',
                        background: 'var(--error-subtle)'
                    }}
                >
                    <p className="text-center flex justify-center items-center gap-2" style={{ color: '#dc2626', fontWeight: 600 }}>
                        <XIcon size={16} />
                        Upload failed. Please try again.
                    </p>
                </div>
            )}
        </div>
    );
};
