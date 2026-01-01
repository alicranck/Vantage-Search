import React, { useState } from 'react';
import Upload from './Upload';
import Search from './Search';

function App() {
  const [view, setView] = useState('search');

  return (
    <div className="container">
      <header className="app-header fade-in">
        <div className="header-content">
          <h1 className="logo">Vantage<span>Search</span></h1>
          <nav className="nav-menu">
            <button
              className={`nav-link ${view === 'search' ? 'active' : ''}`}
              onClick={() => setView('search')}
            >
              Search
            </button>
            <button
              className={`nav-link ${view === 'upload' ? 'active' : ''}`}
              onClick={() => setView('upload')}
            >
              Upload
            </button>
          </nav>
        </div>
      </header>
      <main className="fade-in">
        {view === 'upload' && <Upload />}
        {view === 'search' && <Search />}
      </main>
    </div>
  );

}

export default App;
