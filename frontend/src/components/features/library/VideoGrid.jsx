import React from 'react';
import { TrashIcon, RefreshIcon, PlayIcon } from '../../common/Icon';
import { useAuth } from '../../../context/AuthContext';
import { useVideoAuth } from '../../../hooks/useVideoAuth';

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
    const { accessKey } = useVideoAuth(video.id);
    const isLoading = actionLoading === video.id;
    const videoRef = React.useRef(null);
    const [isPlaying, setIsPlaying] = React.useState(false);

    const handlePlay = (e) => {
        e.stopPropagation();
        if (videoRef.current) {
            videoRef.current.play();
            setIsPlaying(true);
        }
    };

    const handlePause = () => {
        setIsPlaying(false);
    };

    return (
        <article className="video-card">
            <div className="video-thumb" onClick={handlePlay}>
                {accessKey ? (
                    (() => {
                        const videoUrl = `http://localhost:8000/api/videos/${video.id}?token=${accessKey}`;
                        console.log(`[Library] Video URL for ${video.id}:`, videoUrl);
                        return (
                            <video
                                ref={videoRef}
                                preload="metadata"
                                controls={isPlaying}
                                onPause={handlePause}
                                onEnded={handlePause}
                                className="w-full h-full object-contain bg-black"
                            >
                                <source
                                    src={videoUrl}
                                    type="video/mp4"
                                />
                            </video>
                        );
                    })()
                ) : (
                    <div className="video-placeholder flex items-center justify-center bg-gray-900 h-full">
                        <div className="animate-pulse bg-gray-800 w-full h-full"></div>
                    </div>
                )}
                {!isPlaying && (
                    <div className="video-thumb-overlay">
                        <div className="video-play-icon">
                            <PlayIcon size={20} />
                        </div>
                    </div>
                )}
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
                    Uploaded {formatDate(video.created_at)}
                </p>

                <div className="video-actions">
                    {video.status === 'failed' && (
                        <button
                            className="video-action-btn retry"
                            onClick={(e) => { e.stopPropagation(); onRetry(video.id); }}
                            disabled={isLoading}
                        >
                            <RefreshIcon size={14} />
                            {isLoading ? 'Retrying...' : 'Retry'}
                        </button>
                    )}
                    <button
                        className="video-action-btn delete"
                        onClick={(e) => { e.stopPropagation(); onDelete(video.id, video.filename); }}
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
                    key={video.id}
                    video={video}
                    onDelete={onDelete}
                    onRetry={onRetry}
                    actionLoading={actionLoading}
                />
            ))}
        </div>
    );
};
