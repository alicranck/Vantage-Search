import { useState } from 'react';
import { useAuth } from '../context/AuthContext';

const API_BASE = 'http://localhost:8000/api';

export const useSearch = () => {
    const [query, setQuery] = useState('');
    const [results, setResults] = useState([]);
    const [loading, setLoading] = useState(false);
    const [searched, setSearched] = useState(false);
    const [error, setError] = useState(null);

    const { token } = useAuth();

    const performSearch = async (searchQuery) => {
        if (!searchQuery || !token) return;

        setLoading(true);
        setSearched(true);
        setError(null);

        try {
            const response = await fetch(`${API_BASE}/search?q=${encodeURIComponent(searchQuery)}&limit=10`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            if (response.ok) {
                const data = await response.json();
                setResults(Array.isArray(data) ? data : (data.results || []));
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
