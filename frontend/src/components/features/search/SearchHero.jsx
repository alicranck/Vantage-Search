import React from 'react';
import { SearchIcon, SparklesIcon } from '../../common/Icon';

export const SearchHero = ({ query, setQuery, onSearch, loading }) => {
    const quickSearches = ['person walking', 'car driving', 'dog playing', 'outdoor scene'];

    const handleSubmit = (e) => {
        e.preventDefault();
        if (query.trim()) {
            onSearch(query);
        }
    };

    const handleChipClick = (term) => {
        setQuery(term);
        onSearch(term);
    };

    return (
        <section className="hero-section">
            <div className="hero-badge">
                <SparklesIcon size={14} strokeWidth={2} />
                <span>AI-Powered Video Search</span>
            </div>

            <h1 className="hero-title">
                Find Any Moment<br />
                <span className="hero-title-gradient">In Seconds</span>
            </h1>

            <p className="hero-subtitle">
                Search your entire video library using natural language.
                Describe what you're looking for, and let AI find it for you.
            </p>

            <div className="search-wrapper">
                <form onSubmit={handleSubmit} className="search-box-glass">
                    <div className="search-input-wrapper">
                        <SearchIcon className="search-icon" size={22} strokeWidth={1.75} />
                        <input
                            type="text"
                            className="search-input"
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            placeholder="Describe the moment you're looking for..."
                            aria-label="Search query"
                        />
                    </div>
                    <button
                        type="submit"
                        className="search-button"
                        disabled={loading || !query.trim()}
                    >
                        {loading ? 'Searching...' : 'Search'}
                    </button>
                </form>

                <div className="search-chips">
                    {quickSearches.map((term, idx) => (
                        <button
                            key={idx}
                            type="button"
                            className="search-chip"
                            onClick={() => handleChipClick(term)}
                        >
                            {term}
                        </button>
                    ))}
                </div>
            </div>
        </section>
    );
};
