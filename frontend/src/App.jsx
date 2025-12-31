import React, { useState } from 'react';
import Upload from './Upload';
import Search from './Search';

function App() {
  const [view, setView] = useState('search');

  return (
    <div style={{ padding: '20px', fontFamily: 'Arial, sans-serif' }}>
      <header style={{ marginBottom: '20px', borderBottom: '1px solid #ccc', paddingBottom: '10px' }}>
        <h1 style={{ display: 'inline-block', marginRight: '20px' }}>Vantage Search</h1>
        <nav style={{ display: 'inline-block' }}>
          <button 
            onClick={() => setView('search')} 
            style={{ marginRight: '10px', padding: '5px 10px', fontWeight: view === 'search' ? 'bold' : 'normal' }}
          >
            Search
          </button>
          <button 
            onClick={() => setView('upload')}
            style={{ padding: '5px 10px', fontWeight: view === 'upload' ? 'bold' : 'normal' }}
          >
            Upload
          </button>
        </nav>
      </header>
      <main>
        {view === 'upload' && <Upload />}
        {view === 'search' && <Search />}
      </main>
    </div>
  );
}

export default App;
