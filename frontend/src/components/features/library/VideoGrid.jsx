import React from 'react';
import { TrashIcon, RefreshIcon, PlayIcon } from '../../common/Icon';

const formatFileSize = (bytes) => {
    if (!bytes || bytes === 0) return '0 B';
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
};

const formatDate = (isoString) => {
    if (!isoString || isoString === 'unknown') return 'Unknown';
    try {
        const date = new Date(isoString);
        return date.toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric'
        });
    } catch {
        return isoString;
    }
};

const getStatusVariant = (status) => {
    const map = { completed: 'completed', processing: 'processing', failed: 'failed' };
    return map[status] || 'processing';
};

const getStatusText = (status) => {
    const map = { completed: 'Indexed', processing: 'Processing', failed: 'Failed' };
    return map[status] || 'Processing';
};

const LibraryVideoCard = ({ video, onDelete, onRetry, actionLoading }) => {
    const isLoading = actionLoading === video.video_id;

    return (
        <article className="video-card">
            <div className="video-thumb">
                <video preload="metadata">
                    <source
                        src={`http://localhost:8000/api/videos/${video.video_id}`}
                        type="video/mp4"
                    />
                </video>
                <div className="video-thumb-overlay">
                    <div className="video-play-icon">
                        <PlayIcon size={20} />
                    </div>
                </div>
            </div>

            <div className="video-body">
                <h3 className="video-title" title={video.filename}>
                    {video.filename}
                </h3>

                <div className="video-meta-row">
                    <span className={`status-badge ${getStatusVariant(video.status)}`}>
                        <span className="status-dot"></span>
                        {getStatusText(video.status)}
                    </span>
                    <span>{formatFileSize(video.file_size)}</span>
                </div>

                <p className="mt-2" style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>
                    Uploaded {formatDate(video.uploaded_at)}
                </p>

                <div className="video-actions">
                    {video.status === 'failed' && (
                        <button
                            className="video-action-btn retry"
                            onClick={(e) => { e.stopPropagation(); onRetry(video.video_id); }}
                            disabled={isLoading}
                        >
                            <RefreshIcon size={14} />
                            {isLoading ? 'Retrying...' : 'Retry'}
                        </button>
                    )}
                    <button
                        className="video-action-btn delete"
                        onClick={(e) => { e.stopPropagation(); onDelete(video.video_id, video.filename); }}
                        disabled={isLoading}
                    >
                        <TrashIcon size={14} />
                        {isLoading ? 'Deleting...' : 'Delete'}
                    </button>
                </div>
            </div>
        </article>
    );
};

export const VideoGrid = ({ videos, onDelete, onRetry, actionLoading }) => {
    return (
        <div className="video-grid">
            {videos.map((video) => (
                <LibraryVideoCard
                    key={video.video_id}
                    video={video}
                    onDelete={onDelete}
                    onRetry={onRetry}
                    actionLoading={actionLoading}
                />
            ))}
        </div>
    );
};
