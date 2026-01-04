import React, { useState } from 'react';

const Search = () => {
    const [query, setQuery] = useState('');
    const [results, setResults] = useState([]);
    const [loading, setLoading] = useState(false);
    const [searched, setSearched] = useState(false);

    const handleSearch = async (e) => {
        e.preventDefault();
        if (!query) return;

        setLoading(true);
        setSearched(true);
        try {
            const response = await fetch(`http://localhost:8000/api/search?q=${encodeURIComponent(query)}&limit=10`);
            if (response.ok) {
                const data = await response.json();
                setResults(data.results);
            } else {
                console.error('Search failed');
            }
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const quickSearches = ['person walking', 'car driving', 'dog playing', 'outdoor scene'];

    const formatTime = (seconds) => {
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    return (
        <div className="search-page fade-in">
            {/* Hero Section */}
            <section className="hero-section">
                <div className="hero-badge">
                    <span>⚡</span>
                    <span>AI-Powered Video Search</span>
                </div>
                <h1 className="hero-title">
                    Find Any Moment <br />
                    <span className="hero-title-gradient">In Seconds</span>
                </h1>
                <p className="hero-subtitle">
                    Search your entire video library using natural language.
                    Describe what you're looking for, and we'll find it.
                </p>

                {/* Search Box */}
                <div className="search-wrapper">
                    <form onSubmit={handleSearch} className="search-box-glass">
                        <div className="search-input-wrapper">
                            <svg className="search-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <circle cx="11" cy="11" r="8" />
                                <path d="m21 21-4.35-4.35" />
                            </svg>
                            <input
                                type="text"
                                className="search-input"
                                value={query}
                                onChange={(e) => setQuery(e.target.value)}
                                placeholder="Describe the moment you're looking for..."
                            />
                        </div>
                        <button type="submit" className="search-button" disabled={loading}>
                            {loading ? 'Searching...' : 'Search'}
                        </button>
                    </form>

                    {/* Quick Search Chips */}
                    <div className="search-chips">
                        {quickSearches.map((term, idx) => (
                            <button
                                key={idx}
                                className="search-chip"
                                onClick={() => {
                                    setQuery(term);
                                }}
                            >
                                {term}
                            </button>
                        ))}
                    </div>
                </div>
            </section>

            {/* Loading State */}
            {loading && (
                <div className="loading-state">
                    <div className="loader"></div>
                    <p>Scanning through your videos...</p>
                </div>
            )}

            {/* Results */}
            {!loading && results.length > 0 && (
                <>
                    <div className="results-header">
                        <p className="results-count">
                            Found <strong>{results.length}</strong> relevant moments
                        </p>
                    </div>
                    <div className="results-grid">
                        {results.map((res, idx) => (
                            <div key={idx} className="result-card fade-in">
                                <div className="result-video-wrapper">
                                    <video
                                        className="result-video"
                                        controls
                                        preload="metadata"
                                        onLoadedMetadata={(e) => {
                                            // Seek to the start of the clip or the match timestamp
                                            e.target.currentTime = res.metadata.start_time || res.metadata.timestamp;
                                        }}
                                        onTimeUpdate={(e) => {
                                            // Enforce clip boundary: pause if end_time is reached
                                            if (res.metadata.end_time && e.target.currentTime >= res.metadata.end_time) {
                                                e.target.pause();
                                            }
                                        }}
                                    >
                                        <source src={`http://localhost:8000/api/videos/${res.metadata.video_id}`} type="video/mp4" />
                                    </video>
                                    <div className="result-timestamp">
                                        {formatTime(res.metadata.start_time || res.metadata.timestamp)}
                                        {res.metadata.end_time && ` - ${formatTime(res.metadata.end_time)}`}
                                    </div>
                                </div>
                                <div className="result-body">
                                    <div className="result-meta">
                                        <span className="result-id">
                                            {res.metadata.original_filename || res.metadata.video_id.slice(0, 8)}
                                        </span>
                                        <div className="result-score">
                                            <div className="score-badge">
                                                {Math.round((1 - res.distance) * 100)}%
                                            </div>
                                        </div>
                                    </div>

                                    {res.metadata.detected_classes && (
                                        <div className="result-tags">
                                            {res.metadata.detected_classes.split(', ').slice(0, 3).map((cls, i) => (
                                                <span key={i} className="result-tag">{cls}</span>
                                            ))}
                                            {res.metadata.match_count > 1 && (
                                                <span className="result-tag" style={{ background: 'var(--bg-secondary)', color: 'var(--text-muted)' }}>
                                                    +{res.metadata.match_count} matches
                                                </span>
                                            )}
                                        </div>
                                    )}

                                    <button
                                        className="result-action"
                                        onClick={() => {
                                            const videos = document.querySelectorAll('.result-video');
                                            if (videos[idx]) {
                                                videos[idx].currentTime = res.metadata.start_time || res.metadata.timestamp;
                                                videos[idx].play();
                                            }
                                        }}
                                    >
                                        <span>▶</span>
                                        Play Moment
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </>
            )}


            {/* Empty State */}
            {!loading && searched && results.length === 0 && (
                <div className="empty-state">
                    <div className="empty-state-icon">
                        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                            <circle cx="11" cy="11" r="8" />
                            <path d="m21 21-4.35-4.35" />
                            <path d="M8 8l6 6M14 8l-6 6" strokeLinecap="round" />
                        </svg>
                    </div>
                    <h3 className="empty-state-title">No matching moments found</h3>
                    <p className="empty-state-text">
                        Try a different search query or upload more videos to expand your library.
                    </p>
                </div>
            )}
        </div>
    );
};

export default Search;
