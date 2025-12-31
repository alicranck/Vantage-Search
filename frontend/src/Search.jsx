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
        <div>
            <div style={{ textAlign: 'center', marginBottom: '40px' }}>
                <h2>Search Videos</h2>
                <form onSubmit={handleSearch}>
                    <input
                        type="text"
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        placeholder="Search for moments (e.g., 'person walking', 'red car')..."
                        style={{ width: '60%', padding: '12px', fontSize: '16px', borderRadius: '4px', border: '1px solid #ccc' }}
                    />
                    <button
                        type="submit"
                        style={{ marginLeft: '10px', padding: '12px 24px', fontSize: '16px', background: '#28a745', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
                    >
                        Search
                    </button>
                </form>
            </div>

            {loading && <p style={{ textAlign: 'center' }}>Searching...</p>}

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '20px' }}>
                {results.map((res, idx) => (
                    <div key={idx} style={{ border: '1px solid #ddd', borderRadius: '8px', overflow: 'hidden' }}>
                        <div style={{ padding: '15px' }}>
                            <p><strong>Video ID:</strong> {res.metadata.video_id}</p>
                            <p><strong>Time:</strong> {res.metadata.timestamp.toFixed(2)}s</p>
                            <p><strong>Score:</strong> {(1 - res.distance).toFixed(3)}</p>
                            <p style={{ fontSize: '0.8em', color: '#666' }}>Path: {res.metadata.video_path}</p>
                        </div>
                    </div>
                ))}
            </div>
            {results.length === 0 && !loading && <p style={{ textAlign: 'center', color: '#666' }}>No results found.</p>}
        </div>
    );
};

export default Search;
