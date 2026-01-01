import React, { useState } from 'react';

const Search = () => {
    const [query, setQuery] = useState('');
    const [results, setResults] = useState([]);
    const [loading, setLoading] = useState(false);

    const handleSearch = async (e) => {
        e.preventDefault();
        if (!query) return;

        setLoading(true);
        try {
            // http://localhost:8000/api/search?q=...
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

    return (
        <div className="search-page fade-in">
            <div className="search-container">
                <h2 style={{ marginBottom: '1.5rem', textAlign: 'center' }}>Find Moments in Seconds</h2>
                <form onSubmit={handleSearch} className="search-box">
                    <input
                        type="text"
                        className="search-input"
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        placeholder="Search for moments (e.g., 'person walking', 'red car')..."
                    />
                    <button type="submit" className="primary-button">
                        {loading ? 'Searching...' : 'Search'}
                    </button>
                </form>
            </div>

            {loading && (
                <div style={{ textAlign: 'center', margin: '2rem 0' }}>
                    <div className="loader"></div>
                    <p>Scanning through your videos...</p>
                </div>
            )}

            <div className="card-grid">
                {results.map((res, idx) => (
                    <div key={idx} className="result-card">
                        <div className="result-content">
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
                                <span style={{ background: '#f1f5f9', padding: '4px 8px', borderRadius: '6px', fontSize: '0.75rem', fontWeight: 600 }}>
                                    {res.metadata.video_id.slice(0, 8)}
                                </span>
                                <span style={{ color: 'var(--success)', fontWeight: 700 }}>
                                    {Math.round((1 - res.distance) * 100)}% Match
                                </span>
                            </div>
                            <p style={{ fontSize: '0.9rem', marginBottom: '0.5rem' }}>
                                <strong>Timestamp:</strong> {res.metadata.timestamp.toFixed(2)}s
                            </p>
                            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', wordBreak: 'break-all' }}>
                                {res.metadata.video_path}
                            </p>

                            {res.metadata.detected_classes && (
                                <div style={{ marginTop: '1rem', display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                                    {res.metadata.detected_classes.split(', ').map((cls, i) => (
                                        <span key={i} style={{
                                            background: 'rgba(99, 102, 241, 0.08)',
                                            color: 'var(--primary)',
                                            padding: '2px 8px',
                                            borderRadius: '6px',
                                            fontSize: '0.7rem',
                                            fontWeight: 700,
                                            textTransform: 'uppercase',
                                            letterSpacing: '0.5px'
                                        }}>
                                            {cls}
                                        </span>
                                    ))}
                                </div>
                            )}
                        </div>

                    </div>
                ))}
            </div>

            {results.length === 0 && !loading && query && (
                <div style={{ textAlign: 'center', marginTop: '4rem', color: 'var(--text-muted)' }}>
                    <p>No matching moments found. Try a different query!</p>
                </div>
            )}
        </div>
    );

};

export default Search;
