import React, { useRef } from 'react';
import { PlayIcon } from '../../common/Icon';

export const ResultCard = ({ result }) => {
    const videoRef = useRef(null);

    const formatTime = (seconds) => {
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    const getScoreVariant = (confidence) => {
        if (confidence >= 80) return 'high';
        if (confidence >= 50) return 'medium';
        return 'low';
    };

    const score = Math.max(0, Math.round(result.confidence ?? (1 - result.distance) * 100));
    const scoreVariant = getScoreVariant(score);

    const handlePlay = () => {
        if (videoRef.current) {
            if (!result.clip_url) {
                videoRef.current.currentTime = result.metadata.start_time || result.metadata.timestamp;
            } else {
                videoRef.current.currentTime = 0;
            }
            videoRef.current.play();
        }
    };

    const handleTimeUpdate = (e) => {
        // Enforce clip boundary only for full videos
        if (!result.clip_url && result.metadata.end_time && e.target.currentTime >= result.metadata.end_time) {
            e.target.pause();
        }
    };

    const handleLoadedMetadata = (e) => {
        if (!result.clip_url) {
            e.target.currentTime = result.metadata.start_time || result.metadata.timestamp;
        }
    };

    const videoSrc = result.clip_url
        ? `http://localhost:8000${result.clip_url}`
        : `http://localhost:8000/api/videos/${result.metadata.video_id}`;

    const primaryTag = result.metadata.detected_classes?.split(', ')[0];

    return (
        <article className="result-card">
            <div
                className="result-video-wrapper"
                onClick={handlePlay}
                role="button"
                tabIndex={0}
                aria-label="Play video clip"
                onKeyDown={(e) => e.key === 'Enter' && handlePlay()}
            >
                <video
                    ref={videoRef}
                    className="result-video"
                    controls
                    preload="metadata"
                    onLoadedMetadata={handleLoadedMetadata}
                    onTimeUpdate={handleTimeUpdate}
                    onClick={(e) => e.stopPropagation()}
                >
                    <source src={videoSrc} type="video/mp4" />
                </video>

                <div className="result-timestamp">
                    {formatTime(result.metadata.start_time || result.metadata.timestamp)}
                    {result.metadata.end_time && ` – ${formatTime(result.metadata.end_time)}`}
                </div>
            </div>

            <div className="result-body">
                <div className="result-meta">
                    <div className="result-tags">
                        {primaryTag && (
                            <span className="result-tag">{primaryTag}</span>
                        )}
                        {result.metadata.match_count > 1 && (
                            <span className="result-id">+{result.metadata.match_count - 1} more</span>
                        )}
                    </div>
                    <div className="result-id font-mono" style={{ fontSize: '9px', color: 'var(--text-tertiary)' }}>
                        dist: {result.distance?.toFixed(4)} · conf: {result.confidence?.toFixed(1)}%
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <div className={`score-badge ${scoreVariant}`}>
                        {score}
                    </div>
                    <button
                        className="btn btn-secondary btn-sm"
                        onClick={handlePlay}
                        aria-label="Play clip"
                    >
                        <PlayIcon size={14} />
                    </button>
                </div>
            </div>
        </article>
    );
};
