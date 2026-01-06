import React from 'react';
import {
    SearchIcon,
    LibraryIcon,
    SparklesIcon,
    SettingsIcon,
    ChevronLeftIcon,
    ChevronRightIcon
} from '../common/Icon';

export const Sidebar = ({
    currentView = 'search',
    onViewChange,
    collapsed = false,
    onToggle,
    stats = { videos: 0, processing: 0 }
}) => {

    return (
        <aside className={`sidebar ${collapsed ? 'collapsed' : ''}`}>
            <div className="sidebar-header">
                <div className="sidebar-logo">
                    <div className="sidebar-logo-icon">
                        <SparklesIcon size={18} color="white" strokeWidth={2} />
                    </div>
                    <span className="sidebar-logo-text">
                        Vantage<span>Search</span>
                    </span>
                </div>
                <button
                    className="sidebar-toggle"
                    onClick={onToggle}
                    title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
                    aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
                >
                    {collapsed ? (
                        <ChevronRightIcon size={14} strokeWidth={2} />
                    ) : (
                        <ChevronLeftIcon size={14} strokeWidth={2} />
                    )}
                </button>
            </div>

            <nav className="sidebar-nav">
                <button
                    className={`nav-item ${currentView === 'search' ? 'active' : ''}`}
                    onClick={() => onViewChange('search')}
                    aria-current={currentView === 'search' ? 'page' : undefined}
                >
                    <SearchIcon className="nav-icon" size={20} strokeWidth={1.75} />
                    <span className="nav-label">Search</span>
                </button>

                <button
                    className={`nav-item ${currentView === 'library' ? 'active' : ''}`}
                    onClick={() => onViewChange('library')}
                    aria-current={currentView === 'library' ? 'page' : undefined}
                >
                    <LibraryIcon className="nav-icon" size={20} strokeWidth={1.75} />
                    <span className="nav-label">Library</span>
                </button>
            </nav>

            <div className="sidebar-stats">
                <div className="stat-item">
                    <span className="stat-label">Videos</span>
                    <span className="stat-value">{stats.videos}</span>
                </div>
                <div className="stat-item">
                    <span className="stat-label">Processing</span>
                    <span className="stat-value">{stats.processing}</span>
                </div>
                <div className="stat-item">
                    <span className="stat-label">Analyzed Frames</span>
                    <span className="stat-value">{stats.vector_frames ? stats.vector_frames.toLocaleString() : 0}</span>
                </div>
            </div>

            <div className="sidebar-footer">
                <div className="sidebar-footer-icon">
                    <SettingsIcon size={18} strokeWidth={1.5} />
                </div>
                <span className="sidebar-footer-text">v0.2.0</span>
            </div>
        </aside>
    );
};
