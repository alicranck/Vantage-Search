import React from 'react';

export const Card = ({ children, className = "", onClick, hoverInfo = false }) => {
    return (
        <div
            className={`
                card-base
                ${onClick ? 'interactive' : ''}
                ${className}
            `}
            onClick={onClick}
        >
            {children}
        </div>
    );
};
