import React from 'react';

// Base Icon component - uses Lucide-style SVG conventions
export const Icon = ({
    children,
    size = 20,
    color = "currentColor",
    className = "",
    strokeWidth = 1.75,
    filled = false
}) => {
    return (
        <svg
            width={size}
            height={size}
            viewBox="0 0 24 24"
            fill={filled ? color : "none"}
            stroke={filled ? "none" : color}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeLinejoin="round"
            className={className}
            style={{ flexShrink: 0 }}
        >
            {children}
        </svg>
    );
};

// Search - refined magnifying glass
export const SearchIcon = (props) => (
    <Icon {...props}>
        <circle cx="11" cy="11" r="7" />
        <path d="m21 21-4.35-4.35" />
    </Icon>
);

// Sparkles - brand icon for AI features
export const SparklesIcon = (props) => (
    <Icon {...props}>
        <path d="M12 3l1.5 4.5L18 9l-4.5 1.5L12 15l-1.5-4.5L6 9l4.5-1.5L12 3z" />
        <path d="M18 15l.75 2.25L21 18l-2.25.75L18 21l-.75-2.25L15 18l2.25-.75L18 15z" />
    </Icon>
);

// Upload - cloud upload style
export const UploadIcon = (props) => (
    <Icon {...props}>
        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
        <polyline points="17 8 12 3 7 8" />
        <line x1="12" y1="3" x2="12" y2="15" />
    </Icon>
);

// Play - filled triangle
export const PlayIcon = ({ size = 20, color = "currentColor", className = "" }) => (
    <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill={color}
        className={className}
        style={{ flexShrink: 0 }}
    >
        <polygon points="6 4 20 12 6 20 6 4" />
    </svg>
);

// Trash - delete icon
export const TrashIcon = (props) => (
    <Icon {...props}>
        <path d="M3 6h18" />
        <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
        <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
        <line x1="10" y1="11" x2="10" y2="17" />
        <line x1="14" y1="11" x2="14" y2="17" />
    </Icon>
);

// Refresh - circular arrows
export const RefreshIcon = (props) => (
    <Icon {...props}>
        <path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
        <path d="M3 3v5h5" />
        <path d="M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16" />
        <path d="M21 21v-5h-5" />
    </Icon>
);

// Library - book/collection icon
export const LibraryIcon = (props) => (
    <Icon {...props}>
        <rect x="3" y="3" width="7" height="9" rx="1" />
        <rect x="14" y="3" width="7" height="5" rx="1" />
        <rect x="14" y="12" width="7" height="9" rx="1" />
        <rect x="3" y="16" width="7" height="5" rx="1" />
    </Icon>
);

// Video - film strip icon
export const VideoIcon = (props) => (
    <Icon {...props}>
        <rect x="2" y="4" width="20" height="16" rx="2" />
        <path d="M2 8h20" />
        <path d="M2 16h20" />
        <path d="M6 4v4" />
        <path d="M10 4v4" />
        <path d="M14 4v4" />
        <path d="M18 4v4" />
        <path d="M6 16v4" />
        <path d="M10 16v4" />
        <path d="M14 16v4" />
        <path d="M18 16v4" />
    </Icon>
);

// Check Circle - success indicator
export const CheckCircleIcon = (props) => (
    <Icon {...props}>
        <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
        <polyline points="22 4 12 14.01 9 11.01" />
    </Icon>
);

// Clock - processing/time indicator
export const ClockIcon = (props) => (
    <Icon {...props}>
        <circle cx="12" cy="12" r="10" />
        <polyline points="12 6 12 12 16 14" />
    </Icon>
);

// Arrow Right - navigation
export const ArrowRightIcon = (props) => (
    <Icon {...props}>
        <path d="M5 12h14" />
        <path d="m12 5 7 7-7 7" />
    </Icon>
);

// Chevron icons for sidebar toggle
export const ChevronLeftIcon = (props) => (
    <Icon {...props}>
        <path d="m15 18-6-6 6-6" />
    </Icon>
);

export const ChevronRightIcon = (props) => (
    <Icon {...props}>
        <path d="m9 18 6-6-6-6" />
    </Icon>
);

// Settings/Cog icon
export const SettingsIcon = (props) => (
    <Icon {...props}>
        <circle cx="12" cy="12" r="3" />
        <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
    </Icon>
);

// X icon for close/cancel
export const XIcon = (props) => (
    <Icon {...props}>
        <path d="M18 6 6 18" />
        <path d="m6 6 12 12" />
    </Icon>
);

// Search X - no results
export const SearchXIcon = (props) => (
    <Icon {...props}>
        <circle cx="11" cy="11" r="7" />
        <path d="m21 21-4.35-4.35" />
        <path d="M8 8l6 6" />
        <path d="M14 8l-6 6" />
    </Icon>
);

// Folder - empty library
export const FolderIcon = (props) => (
    <Icon {...props}>
        <path d="M4 20h16a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.93a2 2 0 0 1-1.66-.9l-.82-1.2A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13c0 1.1.9 2 2 2Z" />
    </Icon>
);
