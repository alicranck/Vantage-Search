import React, { useState, useEffect } from 'react';
import { Sidebar } from './components/layout/Sidebar';
import { PageLayout } from './components/layout/PageLayout';
import { SearchPage } from './pages/SearchPage';
import { LibraryPage } from './pages/LibraryPage';
import { AuthProvider, useAuth } from './context/AuthContext';
import { LoginPage } from './pages/LoginPage';

const AuthenticatedApp = () => {
  const [view, setView] = useState('search');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [stats, setStats] = useState({ videos: 0, processing: 0 });
  const { user, token } = useAuth(); // Get auth info

  useEffect(() => {
    // Only fetch stats if authenticated
    if (!token) return;

    const fetchStats = async () => {
      try {
        // Use relative path for proxy
        const response = await fetch('http://localhost:8000/api/videos', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        if (response.ok) {
          const videosData = await response.json();
          const videos = Array.isArray(videosData) ? videosData : (videosData.videos || []);

          // Fetch Vector Stats
          let vectorCount = 0;
          try {
            const statsRes = await fetch('http://localhost:8000/api/stats', {
              headers: { 'Authorization': `Bearer ${token}` }
            });
            if (statsRes.ok) {
              const statsData = await statsRes.json();
              vectorCount = statsData.total_frames_analyzed || 0;
            }
          } catch (e) { console.warn("Vector stats failed", e); }

          setStats({
            videos: videos.length,
            processing: videos.filter(v => v.status === 'processing').length,
            vector_frames: vectorCount
          });
        }
      } catch (error) {
        console.error('Failed to fetch stats:', error);
      }
    };
    fetchStats();
    const interval = setInterval(fetchStats, 10000);
    return () => clearInterval(interval);
  }, [token]);

  return (
    <PageLayout
      sidebar={
        <Sidebar
          currentView={view}
          onViewChange={setView}
          collapsed={sidebarCollapsed}
          onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
          stats={stats}
          user={user} // Pass user to sidebar for profile info
        />
      }
    >
      {view === 'search' && <SearchPage />}
      {view === 'library' && <LibraryPage />}
    </PageLayout>
  );
};

const AppRoutes = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div style={{ display: 'flex', height: '100vh', justifyContent: 'center', alignItems: 'center', background: '#0f172a', color: 'white' }}>
        Loading Vantage Search...
      </div>
    );
  }

  return user ? <AuthenticatedApp /> : <LoginPage />;
};

function App() {
  return (
    <AuthProvider>
      <AppRoutes />
    </AuthProvider>
  );
}

export default App;
