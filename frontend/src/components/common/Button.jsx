import React from 'react';

const variants = {
    primary: 'bg-primary text-white hover:bg-primary-hover border-transparent',
    secondary: 'bg-white text-text-secondary border-border-subtle hover:border-primary hover:text-primary',
    ghost: 'bg-transparent text-text-secondary hover:bg-bg-secondary',
    danger: 'bg-white text-error border-border-subtle hover:bg-error-subtle hover:border-error',
};

const sizes = {
    sm: 'px-3 py-1.5 text-xs',
    md: 'px-4 py-2 text-sm',
    lg: 'px-6 py-3 text-base',
};

export const Button = ({
    children,
    onClick,
    variant = 'primary',
    size = 'md',
    className = '',
    disabled = false,
    type = 'button',
    icon = null
}) => {
    // Note: Since we are using Vanilla CSS/Custom Classes from index.css, 
    // we need to map these abstract names to actual CSS classes or style objects.
    // For now, let's rely on the classes we defined in index.css and some inline styles/utility classes.

    // Actually, let's just make this component accept the classes directly or map them to the .btn- classes if we create them.
    // Given the index.css, we have `.search-button`, `.video-action-btn`. 
    // Let's standardise on a new `.btn` class set in index.css later? 
    // Or just use inline styles for now to be safe with the transition?

    // Better approach: Let's create a generic .btn class in index.css next.
    // For this step, I'll assume we will add .btn classes.

    return (
        <button
            type={type}
            onClick={onClick}
            disabled={disabled}
            className={`btn btn-${variant} btn-${size} ${className}`}
        >
            {icon && <span className="btn-icon">{icon}</span>}
            {children}
        </button>
    );
};
