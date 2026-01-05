import React from 'react';
import { useSearch } from '../hooks/useSearch';
import { SearchHero } from '../components/features/search/SearchHero';
import { ResultsGrid } from '../components/features/search/ResultsGrid';
import { SearchXIcon } from '../components/common/Icon';

export const SearchPage = () => {
    const {
        query,
        setQuery,
        results,
        loading,
        searched,
        performSearch
    } = useSearch();

    return (
        <div className="search-page">
            <SearchHero
                query={query}
                setQuery={setQuery}
                onSearch={performSearch}
                loading={loading}
            />

            {loading && (
                <div className="loading-state">
                    <div className="loader"></div>
                    <p>Analyzing video content...</p>
                </div>
            )}

            {!loading && results.length > 0 && (
                <>
                    <div className="results-header">
                        <p className="results-count">
                            Found <strong>{results.length}</strong> relevant moment{results.length !== 1 ? 's' : ''}
                        </p>
                    </div>
                    <ResultsGrid results={results} />
                </>
            )}

            {!loading && searched && results.length === 0 && (
                <div className="empty-state">
                    <div className="empty-state-icon">
                        <SearchXIcon size={48} strokeWidth={1.25} />
                    </div>
                    <h3 className="empty-state-title">No matching moments</h3>
                    <p className="empty-state-text">
                        We couldn't find any moments matching your query.<br />
                        Try different keywords or upload more videos.
                    </p>
                </div>
            )}
        </div>
    );
};
