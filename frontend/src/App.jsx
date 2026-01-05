import React, { useState, useEffect } from 'react';
import { Sidebar } from './components/layout/Sidebar';
import { PageLayout } from './components/layout/PageLayout';
import { SearchPage } from './pages/SearchPage';
import { LibraryPage } from './pages/LibraryPage';

function App() {
  const [view, setView] = useState('search');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [stats, setStats] = useState({ videos: 0, processing: 0 });

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await fetch('http://localhost:8000/api/videos');
        if (response.ok) {
          const data = await response.json();
          const videos = data.videos || [];
          setStats({
            videos: videos.length,
            processing: videos.filter(v => v.status === 'processing').length
          });
        }
      } catch (error) {
        console.error('Failed to fetch stats:', error);
      }
    };
    fetchStats();
    const interval = setInterval(fetchStats, 10000);
    return () => clearInterval(interval);
  }, []);

  return (
    <PageLayout
      sidebar={
        <Sidebar
          currentView={view}
          onViewChange={setView}
          collapsed={sidebarCollapsed}
          onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
          stats={stats}
        />
      }
    >
      {view === 'search' && <SearchPage />}
      {view === 'library' && <LibraryPage />}
    </PageLayout>
  );
}

export default App;
