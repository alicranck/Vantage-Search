import React from 'react';

export const Badge = ({ children, variant = 'neutral', className = "" }) => {
    // variants: success, warning, error, neutral, processing

    return (
        <span className={`status-badge ${variant} ${className}`}>
            <span className="status-dot"></span>
            {children}
        </span>
    );
};
