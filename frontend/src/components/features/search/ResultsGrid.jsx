import React from 'react';
import { ResultCard } from './ResultCard';

export const ResultsGrid = ({ results }) => {
    return (
        <div className="results-grid">
            {results.map((res, idx) => (
                <ResultCard key={idx} result={res} />
            ))}
        </div>
    );
};
