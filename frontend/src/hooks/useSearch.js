import { useState } from 'react';

export const useSearch = () => {
    const [query, setQuery] = useState('');
    const [results, setResults] = useState([]);
    const [loading, setLoading] = useState(false);
    const [searched, setSearched] = useState(false);
    const [error, setError] = useState(null);

    const performSearch = async (searchQuery) => {
        if (!searchQuery) return;

        setLoading(true);
        setSearched(true);
        setError(null);

        try {
            const response = await fetch(`http://localhost:8000/api/search?q=${encodeURIComponent(searchQuery)}&limit=10`);
            if (response.ok) {
                const data = await response.json();
                setResults(data.results || []);
            } else {
                setError('Search failed to complete');
                setResults([]);
            }
        } catch (err) {
            console.error(err);
            setError('Network error occurred');
            setResults([]);
        } finally {
            setLoading(false);
        }
    };

    return {
        query,
        setQuery,
        results,
        loading,
        searched,
        error,
        performSearch
    };
};
