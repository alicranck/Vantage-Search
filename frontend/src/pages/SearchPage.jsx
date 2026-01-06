import React, { useState } from 'react';
import { useSearch } from '../hooks/useSearch';
import { SearchHero } from '../components/features/search/SearchHero';
import { ResultsGrid } from '../components/features/search/ResultsGrid';
import { SearchXIcon } from '../components/common/Icon';
import { Button } from '../components/common/Button';

export const SearchPage = () => {
    const {
        query,
        setQuery,
        results,
        loading,
        searched,
        performSearch
    } = useSearch();

    const [sourceFilter, setSourceFilter] = useState('all');

    const filteredResults = results.filter(r => {
        if (sourceFilter === 'all') return true;
        if (sourceFilter === 'vector') return r.match_type === 'vector';
        if (sourceFilter === 'tag') return r.match_type !== 'vector';
        return true;
    });

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
                            Found <strong>{filteredResults.length}</strong> relevant moment{filteredResults.length !== 1 ? 's' : ''}
                        </p>

                        <div className="flex gap-2">
                            <Button
                                variant={sourceFilter === 'all' ? 'primary' : 'secondary'}
                                size="sm"
                                onClick={() => setSourceFilter('all')}
                            >
                                All
                            </Button>
                            <Button
                                variant={sourceFilter === 'vector' ? 'primary' : 'secondary'}
                                size="sm"
                                onClick={() => setSourceFilter('vector')}
                            >
                                Semantic
                            </Button>
                            <Button
                                variant={sourceFilter === 'tag' ? 'primary' : 'secondary'}
                                size="sm"
                                onClick={() => setSourceFilter('tag')}
                            >
                                Tags
                            </Button>
                        </div>
                    </div>
                    <ResultsGrid results={filteredResults} />
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
