import React from 'react';
import { ArrowRightIcon, CheckCircleIcon, ClockIcon } from '../../common/Icon';

export const LibraryStats = ({ stats }) => {
    return (
        <div className="stats-grid">
            <div className="stat-card">
                <div className="stat-card-icon">
                    <ArrowRightIcon size={22} strokeWidth={2} />
                </div>
                <div className="stat-card-content">
                    <h3>{stats.total}</h3>
                    <p>Total Videos</p>
                </div>
            </div>

            <div className="stat-card">
                <div className="stat-card-icon">
                    <CheckCircleIcon size={22} strokeWidth={2} />
                </div>
                <div className="stat-card-content">
                    <h3>{stats.indexed}</h3>
                    <p>Indexed</p>
                </div>
            </div>

            <div className="stat-card">
                <div className="stat-card-icon">
                    <ClockIcon size={22} strokeWidth={2} />
                </div>
                <div className="stat-card-content">
                    <h3>{stats.processing}</h3>
                    <p>Processing</p>
                </div>
            </div>
        </div>
    );
};
