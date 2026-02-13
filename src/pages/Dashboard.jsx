import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import { devices, categories } from '../data/devices';
import { historyData } from '../data/history';

export default function Dashboard({ onLogout }) {
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState('All');
  const [chatInput, setChatInput] = useState('');
  const [uploadedFile, setUploadedFile] = useState(null);
  const fileRef = useRef();
  const navigate = useNavigate();

  const filtered = devices.filter(d => {
    const matchCat = activeCategory === 'All' || d.category === activeCategory;
    const matchSearch = !search || d.name.toLowerCase().includes(search.toLowerCase()) ||
      d.category.toLowerCase().includes(search.toLowerCase()) ||
      d.brand.toLowerCase().includes(search.toLowerCase()) ||
      d.specs.toLowerCase().includes(search.toLowerCase());
    return matchCat && matchSearch;
  });

  const handleChatSubmit = (e) => {
    e.preventDefault();
    if (!chatInput.trim() && !uploadedFile) return;
    // Create a new chat session
    const newId = Date.now();
    // Store pending message
    sessionStorage.setItem('pendingMessage', JSON.stringify({
      content: chatInput,
      file: uploadedFile ? uploadedFile.name : null
    }));
    setChatInput('');
    setUploadedFile(null);
    navigate(`/chat/${newId}`);
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) setUploadedFile(file);
  };

  return (
    <div className="page">
      <Navbar onLogout={onLogout} />

      <div className="page-content">
        {/* Search */}
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '28px' }}>
          <div className="search-wrapper">
            <svg className="search-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
            </svg>
            <input
              className="search-input"
              type="text"
              placeholder="Search CPUs, GPUs, phones, keyboards, mice..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
        </div>

        {/* Category filters */}
        <div className="filter-row">
          {categories.map(cat => (
            <button
              key={cat}
              className={`filter-tag ${activeCategory === cat ? 'active' : ''}`}
              onClick={() => setActiveCategory(cat)}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Section heading */}
        <div className="section-heading">
          <span>{activeCategory === 'All' ? 'All Devices' : activeCategory}</span>
          <span style={{ fontSize: '13px', fontWeight: '400', color: 'var(--text-3)', fontFamily: 'DM Sans' }}>
            {filtered.length} items
          </span>
        </div>

        {/* Devices grid */}
        {filtered.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--text-3)' }}>
            <div style={{ fontSize: '36px', marginBottom: '12px' }}>🔍</div>
            <p>No devices found for "{search}"</p>
          </div>
        ) : (
          <div className="devices-grid">
            {filtered.map((device, i) => (
              <div
                key={device.id}
                className="device-card fade-up"
                style={{ animationDelay: `${i * 0.04}s` }}
                onClick={() => {
                  sessionStorage.setItem('pendingMessage', JSON.stringify({
                    content: `Tell me about the ${device.name}. What are its key specs and is it worth buying?`
                  }));
                  navigate(`/chat/${device.id}`);
                }}
              >
                <div className="device-card-img">{device.emoji}</div>
                <div className="device-card-body">
                  <div className="device-card-category">{device.category}</div>
                  <div className="device-card-name">{device.name}</div>
                  <div className="device-card-spec">{device.specs}</div>
                  <div className="device-card-price">{device.price}</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Chat Bar */}
      <div className="chat-wrapper">
        <form className="chat-bar" onSubmit={handleChatSubmit}>
          {/* Upload button */}
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            style={{ display: 'none' }}
            onChange={handleFileChange}
          />
          <button
            type="button"
            className="upload-btn"
            onClick={() => fileRef.current.click()}
            title="Upload hardware image"
          >
            {uploadedFile ? (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="2">
                <path d="M20 7H8a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2z"/>
                <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/>
              </svg>
            ) : (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                <polyline points="17 8 12 3 7 8"/>
                <line x1="12" y1="3" x2="12" y2="15"/>
              </svg>
            )}
          </button>

          <input
            className="chat-input"
            type="text"
            placeholder={uploadedFile ? `Image: ${uploadedFile.name} — Add a question...` : "Ask about any PC part, phone, keyboard, or mouse..."}
            value={chatInput}
            onChange={e => setChatInput(e.target.value)}
          />

          <button type="submit" className="chat-send">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="22" y1="2" x2="11" y2="13"/>
              <polygon points="22 2 15 22 11 13 2 9 22 2"/>
            </svg>
          </button>
        </form>
      </div>
    </div>
  );
}