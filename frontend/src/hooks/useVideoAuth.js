import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';

export const useVideoAuth = (videoId) => {
    const { token: userToken } = useAuth();
    const [accessKey, setAccessKey] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        let mounted = true;
        const fetchToken = async () => {
            if (!videoId || !userToken) {
                setLoading(false);
                return;
            }
            try {
                const res = await fetch(`http://localhost:8000/api/videos/${videoId}/sign`, {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${userToken}`
                    }
                });
                if (res.ok && mounted) {
                    const data = await res.json();
                    setAccessKey(data.token);
                }
            } catch (err) {
                console.error("Failed to sign video URL", err);
            } finally {
                if (mounted) setLoading(false);
            }
        };
        fetchToken();

        return () => { mounted = false; };
    }, [videoId, userToken]);

    return { accessKey, loading };
};
