import React, { useRef } from 'react';
import { PlayIcon } from '../../common/Icon';
import { useVideoAuth } from '../../../hooks/useVideoAuth';

export const ResultCard = ({ result }) => {
    const { accessKey } = useVideoAuth(result.metadata.video_id);
    const videoRef = useRef(null);

    const formatTime = (seconds) => {
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    const getScoreVariant = (confidence) => {
        if (confidence >= 80) return 'high';
        if (confidence >= 65) return 'medium';
        return 'low';
    };

    const scoreVariant = getScoreVariant(result.confidence || 0);

    const handlePlay = () => {
        if (videoRef.current) {
            if (!result.clip_url) {
                videoRef.current.currentTime = result.metadata.start_time || result.metadata.timestamp;
            } else {
                // Clip: Seek to best match offset relative to clip start
                const clipStart = result.metadata.start_time || 0;
                const matchTime = result.metadata.timestamp || 0;
                const relativeTime = Math.max(0, matchTime - clipStart);
                videoRef.current.currentTime = relativeTime;
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

    let videoSrc = '';
    if (accessKey) {
        videoSrc = result.clip_url
            ? `http://localhost:8000${result.clip_url}?token=${accessKey}`
            : `http://localhost:8000/api/videos/${result.metadata.video_id}?token=${accessKey}`;
        console.log(`[Result] Video URL for ${result.metadata.video_id}:`, videoSrc);
    }

    const tags = result.metadata.detected_classes
        ? result.metadata.detected_classes.split(', ').filter(Boolean).slice(0, 5)
        : [];

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
                {accessKey ? (
                    <video
                        ref={videoRef}
                        className="result-video"
                        controls
                        preload="metadata"
                        playsInline
                        onLoadedMetadata={handleLoadedMetadata}
                        onTimeUpdate={handleTimeUpdate}
                        onClick={(e) => e.stopPropagation()}
                    >
                        <source src={videoSrc} type="video/mp4" />
                    </video>
                ) : (
                    <div className="flex items-center justify-center h-full w-full bg-gray-900">
                        <div className="animate-pulse bg-gray-800 w-full h-full"></div>
                    </div>
                )}

                <div className="result-timestamp">
                    {formatTime(result.metadata.start_time || result.metadata.timestamp)}
                    {result.metadata.end_time && ` – ${formatTime(result.metadata.end_time)}`}
                </div>
            </div>

            <div className="result-body">
                <div className="result-meta">
                    <div className="result-tags">
                        {result.match_type && (
                            <span className="result-tag" style={{
                                backgroundColor: result.match_type === 'vector' ? 'rgba(124, 58, 237, 0.1)' : 'rgba(16, 185, 129, 0.1)',
                                color: result.match_type === 'vector' ? '#7c3aed' : '#10b981',
                                border: `1px solid ${result.match_type === 'vector' ? 'rgba(124, 58, 237, 0.2)' : 'rgba(16, 185, 129, 0.2)'}`
                            }}>
                                {result.match_type === 'vector' ? 'Semantic' : 'Tag'}
                            </span>
                        )}
                        {tags.map((tag, idx) => (
                            <span key={idx} className="result-tag">{tag}</span>
                        ))}
                        {result.metadata.match_count > 1 && (
                            <span className="result-tag" style={{ opacity: 0.7, fontStyle: 'italic' }}>
                                +{result.metadata.match_count - 1} {result.metadata.match_count - 1 === 1 ? 'moment' : 'moments'}
                            </span>
                        )}
                    </div>
                </div>

                <div className="flex items-center gap-3" style={{ minWidth: '100px', justifyContent: 'flex-end' }}>
                    {result.confidence >= 50 && (
                        <div className={`score-badge ${scoreVariant}`}>
                            {Math.round(result.confidence)}
                        </div>
                    )}
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
