import React from 'react';

export const PageLayout = ({ children, sidebar }) => {
    return (
        <div className="app-layout">
            {sidebar}
            <main className="main-content">
                <div className="content-wrapper">
                    {children}
                </div>
            </main>
        </div>
    );
};
