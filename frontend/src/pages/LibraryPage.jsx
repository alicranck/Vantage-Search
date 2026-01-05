import React, { useState } from 'react';
import { useLibrary } from '../hooks/useLibrary';
import { LibraryStats } from '../components/features/library/LibraryStats';
import { UploadZone } from '../components/features/library/UploadZone';
import { VideoGrid } from '../components/features/library/VideoGrid';
import { Button } from '../components/common/Button';
import { FolderIcon, RefreshIcon, UploadIcon } from '../components/common/Icon';
import { Modal } from '../components/common/Modal';

export const LibraryPage = () => {
    const {
        videos,
        stats,
        loading,
        actionLoading,
        uploadStatus,
        deleteVideo,
        retryVideo,
        uploadVideo,
        fetchVideos
    } = useLibrary();

    const [showUploadModal, setShowUploadModal] = useState(false);

    const handleDelete = (id, filename) => {
        if (!confirm(`Delete "${filename}"? This cannot be undone.`)) return;
        deleteVideo(id);
    };

    return (
        <div className="library-page">
            {/* Refined Page Header */}
            <header className="page-header-refined">
                <div className="page-title-group">
                    <h1 className="page-title-refined">
                        <span className="stat-card-icon" style={{ width: 42, height: 42 }}>
                            <FolderIcon size={24} />
                        </span>
                        <span className="text-gradient">Video Library</span>
                    </h1>
                    <p className="page-subtitle">Manage and monitor your indexed video collection</p>
                </div>
                <div className="flex gap-3">
                    <Button
                        variant="primary"
                        onClick={() => setShowUploadModal(true)}
                        icon={<UploadIcon size={16} />}
                    >
                        Add Video
                    </Button>
                    <Button
                        variant="secondary"
                        onClick={fetchVideos}
                        icon={<RefreshIcon size={16} />}
                    >
                        Refresh
                    </Button>
                </div>
            </header>

            {/* Upload Modal */}
            <Modal
                isOpen={showUploadModal}
                onClose={() => setShowUploadModal(false)}
                title="Upload Video"
            >
                <UploadZone
                    onUpload={uploadVideo}
                    status={uploadStatus}
                    onClose={() => setShowUploadModal(false)}
                />
            </Modal>

            {/* Stats Cards */}
            <LibraryStats stats={stats} />

            {/* Loading State */}
            {loading && (
                <div className="loading-state mt-8">
                    <div className="loader"></div>
                    <p>Loading your library...</p>
                </div>
            )}

            {/* Empty State */}
            {!loading && videos.length === 0 && (
                <div className="empty-state mt-8">
                    <div className="empty-state-icon">
                        <FolderIcon size={48} strokeWidth={1.25} />
                    </div>
                    <h3 className="empty-state-title">Your library is empty</h3>
                    <p className="empty-state-text">
                        Upload your first video to start building<br />
                        your searchable video library.
                    </p>
                    <Button
                        variant="primary"
                        onClick={() => setShowUploadModal(true)}
                        className="mt-6"
                        icon={<UploadIcon size={16} />}
                    >
                        Upload Video
                    </Button>
                </div>
            )}

            {/* Video Grid */}
            {!loading && videos.length > 0 && (
                <VideoGrid
                    videos={videos}
                    onDelete={handleDelete}
                    onRetry={retryVideo}
                    actionLoading={actionLoading}
                />
            )}
        </div>
    );
};
