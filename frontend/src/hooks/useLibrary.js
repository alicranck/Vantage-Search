import { useState, useEffect, useCallback } from 'react';

export const useLibrary = () => {
    const [videos, setVideos] = useState([]);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState(null);
    const [uploadStatus, setUploadStatus] = useState('');
    const [stats, setStats] = useState({ total: 0, indexed: 0, processing: 0 });

    const fetchVideos = useCallback(async () => {
        try {
            const response = await fetch('http://localhost:8000/api/videos');
            if (response.ok) {
                const data = await response.json();
                const vids = data.videos || [];
                setVideos(vids);

                // Calculate stats
                setStats({
                    total: vids.length,
                    indexed: vids.filter(v => v.status === 'completed').length,
                    processing: vids.filter(v => v.status === 'processing').length
                });
            }
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchVideos();
        const interval = setInterval(fetchVideos, 5000);
        return () => clearInterval(interval);
    }, [fetchVideos]);

    const deleteVideo = async (videoId) => {
        setActionLoading(videoId);
        try {
            const response = await fetch(`http://localhost:8000/api/videos/${videoId}`, {
                method: 'DELETE'
            });
            if (response.ok) {
                setVideos(prev => prev.filter(v => v.video_id !== videoId));
                fetchVideos(); // Update stats
                return true;
            }
            return false;
        } catch (error) {
            console.error(error);
            return false;
        } finally {
            setActionLoading(null);
        }
    };

    const retryVideo = async (videoId) => {
        setActionLoading(videoId);
        try {
            const response = await fetch(`http://localhost:8000/api/videos/${videoId}/retry`, {
                method: 'POST'
            });
            if (response.ok) {
                fetchVideos();
                return true;
            }
            return false;
        } catch (error) {
            console.error(error);
            return false;
        } finally {
            setActionLoading(null);
        }
    };

    const uploadVideo = async (file) => {
        if (!file) return;
        setUploadStatus('uploading');

        const formData = new FormData();
        formData.append('file', file);

        try {
            const response = await fetch('http://localhost:8000/api/upload', {
                method: 'POST',
                body: formData,
            });

            if (response.ok) {
                setUploadStatus('success');
                setTimeout(() => {
                    setUploadStatus('');
                    fetchVideos();
                }, 2000);
                return true;
            } else {
                setUploadStatus('error');
                return false;
            }
        } catch (error) {
            setUploadStatus('error');
            console.error(error);
            return false;
        }
    };

    return {
        videos,
        stats,
        loading,
        actionLoading,
        uploadStatus,
        fetchVideos,
        deleteVideo,
        retryVideo,
        uploadVideo,
        setUploadStatus
    };
};
