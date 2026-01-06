import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';

const API_BASE = 'http://localhost:8000/api';

export const useLibrary = () => {
    const [videos, setVideos] = useState([]);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState(null);
    const [uploadStatus, setUploadStatus] = useState('');
    const [stats, setStats] = useState({ total: 0, indexed: 0, processing: 0 });

    const { token } = useAuth();

    const fetchVideos = useCallback(async () => {
        if (!token) return;

        try {
            const response = await fetch(`${API_BASE}/videos`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            if (response.ok) {
                const data = await response.json();
                const vids = Array.isArray(data) ? data : (data.videos || []);
                setVideos(vids);

                // Calculate stats
                setStats({
                    total: vids.length,
                    indexed: vids.filter(v => v.status === 'completed').length,
                    processing: vids.filter(v => v.status === 'processing').length
                });
            } else if (response.status === 401) {
                // Token might be invalid
                console.warn("Unauthorized fetchVideos");
            }
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    }, [token]);

    useEffect(() => {
        if (token) {
            fetchVideos();
            const interval = setInterval(fetchVideos, 5000);
            return () => clearInterval(interval);
        }
    }, [fetchVideos, token]);

    const deleteVideo = async (videoId) => {
        setActionLoading(videoId);
        try {
            const response = await fetch(`${API_BASE}/videos/${videoId}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            if (response.ok) {
                setVideos(prev => prev.filter(v => v.id !== videoId));
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
            const response = await fetch(`${API_BASE}/videos/${videoId}/retry`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
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
        if (!file || !token) return;
        setUploadStatus('uploading');

        const formData = new FormData();
        formData.append('file', file);

        try {
            const response = await fetch(`${API_BASE}/upload`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`
                },
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
