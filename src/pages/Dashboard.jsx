import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import { devices, categories } from '../data/devices';
import { X, Sparkles } from 'lucide-react';
import { askAI } from '../services/aiService';
import { getBrandLogoUrl } from '../utils/brandLogo';

const BrandLogo = ({ brand, emoji, size = 40 }) => {
  const [err, setErr] = useState(false);
  const url = getBrandLogoUrl(brand);
  if (!url || err) return <span style={{ fontSize: size * 0.7, lineHeight: 1 }}>{emoji || '💡'}</span>;
  return (
    <img src={url} alt={brand} onError={() => setErr(true)}
      style={{ width: size, height: size, objectFit: 'contain' }} />
  );
};

async function fetchAISuggestions(query) {
  const response = await askAI([{
    role: 'user',
    content: `List up to 6 real PC hardware or smartphone products matching: "${query}"

Respond with JSON only (no markdown):
[
  { "name": "Product Name", "category": "CPU/GPU/RAM/SSD/Smartphone/Motherboard/PSU/Laptop/etc", "brand": "Brand", "emoji": "emoji", "specs": "short one-line spec" }
]
Only return products that actually exist. Be specific with model names.`
  }]);
  const clean = response.replace(/```json|```/g, '').trim();
  return JSON.parse(clean);
}

async function fetchAIDeviceFull(query) {
  const response = await askAI([{
    role: 'user',
    content: `The user is searching for: "${query}"

Respond with JSON only (no markdown):
{
  "found": true,
  "name": "Product Name",
  "category": "CPU/GPU/RAM/SSD/Smartphone/Motherboard/PSU/Laptop/etc",
  "brand": "Brand Name",
  "specs": "Key specs in one line",
  "price": "Philippine Peso price range",
  "emoji": "emoji",
  "details": { "key1": "value1" },
  "summary": "2-3 sentence overview"
}
If not found: {"found": false}
Focus on PC hardware, smartphones only.`
  }]);
  const clean = response.replace(/```json|```/g, '').trim();
  return JSON.parse(clean);
}

export default function Dashboard() {
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState('All');
  const [chatInput, setChatInput] = useState('');
  const [uploadedFile, setUploadedFile] = useState(null);
  const [selectedDevice, setSelectedDevice] = useState(null);
  const [aiSearchResult, setAiSearchResult] = useState(null);
  const [aiSearching, setAiSearching] = useState(false);

  // Dropdown suggestion state
  const [showDropdown, setShowDropdown] = useState(false);
  const [aiSuggestions, setAiSuggestions] = useState([]);
  const [suggestionsLoading, setSuggestionsLoading] = useState(false);

  const fileRef = useRef();
  const searchRef = useRef(null);
  const debounceRef = useRef(null);
  const navigate = useNavigate();

  // Close dropdown on outside click
  useEffect(() => {
    const handle = (e) => {
      if (searchRef.current && !searchRef.current.contains(e.target)) setShowDropdown(false);
    };
    document.addEventListener('mousedown', handle);
    return () => document.removeEventListener('mousedown', handle);
  }, []);

  // Debounced AI suggestions as user types
  useEffect(() => {
    if (!search.trim() || search.length < 2) { setAiSuggestions([]); return; }
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      setSuggestionsLoading(true);
      try {
        const suggestions = await fetchAISuggestions(search);
        setAiSuggestions(Array.isArray(suggestions) ? suggestions : []);
      } catch { setAiSuggestions([]); }
      setSuggestionsLoading(false);
    }, 600);
    return () => clearTimeout(debounceRef.current);
  }, [search]);

  const localFiltered = devices.filter(d => {
    const matchCat = activeCategory === 'All' || d.category === activeCategory;
    const q = search.toLowerCase();
    const matchSearch = !search || d.name.toLowerCase().includes(q) ||
      d.category.toLowerCase().includes(q) || d.brand.toLowerCase().includes(q) ||
      d.specs.toLowerCase().includes(q);
    return matchCat && matchSearch;
  });

  const dropdownLocal = devices.filter(d => {
    const q = search.toLowerCase();
    return d.name.toLowerCase().includes(q) || d.category.toLowerCase().includes(q) ||
      d.brand.toLowerCase().includes(q) || d.specs.toLowerCase().includes(q);
  }).slice(0, 3);

  const handleSelectSuggestion = async (suggestion) => {
    setShowDropdown(false);
    setSearch(suggestion.name);
    setAiSearching(true);
    setAiSearchResult(null);
    try {
      const result = await fetchAIDeviceFull(suggestion.name);
      if (result.found) setAiSearchResult(result);
      else setAiSearchResult({ found: false });
    } catch { setAiSearchResult({ found: false }); }
    setAiSearching(false);
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) setUploadedFile(file);
  };

  const handleSelectLocal = (device) => {
    setShowDropdown(false);
    setSelectedDevice(device);
    setSearch(device.name);
  };

  const handleChatSubmit = (e) => {
    e.preventDefault();
    if (!chatInput.trim() && !uploadedFile) return;
    sessionStorage.setItem('pendingMessage', JSON.stringify({ content: chatInput, file: uploadedFile ? uploadedFile.name : null }));
    setChatInput(''); setUploadedFile(null);
    navigate(`/chat/${Date.now()}`);
  };

  const askAIDevice = (device) => {
    setSelectedDevice(null);
    sessionStorage.setItem('pendingMessage', JSON.stringify({ content: `Tell me about the ${device.name}. What are its key specs and is it worth buying?` }));
    navigate(`/chat/${Date.now()}`);
  };

  const isSearching = search.trim().length > 0;

  return (
    <div className="page">
      <Navbar />
      <div className="page-content">

        {/* Search with live dropdown */}
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 28 }}>
          <div ref={searchRef} style={{ position: 'relative', width: '100%', maxWidth: 600 }}>
            <div className="search-wrapper" style={{ position: 'relative' }}>
              <svg className="search-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
              </svg>
              <input className="search-input" type="text"
                placeholder="Search CPUs, GPUs, phones..."
                value={search}
                onChange={e => { setSearch(e.target.value); setAiSearchResult(null); setShowDropdown(true); }}
                onFocus={() => { if (search.trim()) setShowDropdown(true); }}
              />
              {search && (
                <button onClick={() => { setSearch(''); setAiSearchResult(null); setAiSuggestions([]); setShowDropdown(false); }}
                  style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'var(--text-3)', cursor: 'pointer' }}>
                  <X size={14} />
                </button>
              )}
            </div>

            {/* Live suggestions dropdown */}
            {showDropdown && search.trim() && (
              <div style={{
                position: 'absolute', top: 'calc(100% + 4px)', left: 0, right: 0, zIndex: 200,
                background: 'var(--bg-2)', border: '1px solid var(--border)',
                borderRadius: 'var(--radius-sm)', boxShadow: 'var(--shadow)',
                overflow: 'hidden', maxHeight: 400, overflowY: 'auto',
              }}>
                {/* Local results */}
                {dropdownLocal.length > 0 && (
                  <>
                    <div style={{ padding: '5px 14px', fontSize: 10, fontWeight: 700, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.8px', background: 'var(--bg-3)' }}>
                      In Database
                    </div>
                    {dropdownLocal.map(d => (
                      <div key={d.id} onClick={() => handleSelectLocal(d)}
                        style={{ padding: '9px 14px', cursor: 'pointer', display: 'flex', gap: 10, alignItems: 'center' }}
                        onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-3)'}
                        onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                        <div style={{ width: 34, height: 34, borderRadius: 9, background: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 4, flexShrink: 0 }}>
                          <BrandLogo brand={d.brand} emoji={d.emoji} size={26} />
                        </div>
                        <div>
                          <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--text)' }}>{d.name}</div>
                          <div style={{ fontSize: 11, color: 'var(--text-3)' }}>{d.category} · {d.price}</div>
                        </div>
                      </div>
                    ))}
                  </>
                )}

                {/* AI suggestions */}
                <div style={{ padding: '5px 14px', fontSize: 10, fontWeight: 700, color: 'var(--accent)', textTransform: 'uppercase', letterSpacing: '0.8px', background: 'var(--bg-3)', display: 'flex', alignItems: 'center', gap: 5 }}>
                  <Sparkles size={10} /> AI Suggestions
                </div>

                {suggestionsLoading ? (
                  <div style={{ padding: '12px 14px', fontSize: 12, color: 'var(--text-3)', display: 'flex', alignItems: 'center', gap: 8 }}>
                    <Sparkles size={12} style={{ color: 'var(--accent)' }} /> Finding suggestions...
                  </div>
                ) : aiSuggestions.length > 0 ? (
                  aiSuggestions.map((s, i) => (
                    <div key={i} onClick={() => handleSelectSuggestion(s)}
                      style={{ padding: '9px 14px', cursor: 'pointer', display: 'flex', gap: 10, alignItems: 'center' }}
                      onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-3)'}
                      onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                      <div style={{ width: 34, height: 34, borderRadius: 9, background: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 4, flexShrink: 0 }}>
                        <BrandLogo brand={s.brand} emoji={s.emoji} size={26} />
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--text)' }}>{s.name}</div>
                        <div style={{ fontSize: 11, color: 'var(--text-3)' }}>{s.category} · {s.brand}</div>
                        {s.specs && <div style={{ fontSize: 10, color: 'var(--text-3)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{s.specs}</div>}
                      </div>
                      <Sparkles size={11} style={{ color: 'var(--accent)', flexShrink: 0 }} />
                    </div>
                  ))
                ) : (
                  <div style={{ padding: '10px 14px', fontSize: 12, color: 'var(--text-3)' }}>
                    Type more to get AI suggestions...
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Category filters */}
        <div className="filter-row">
          {categories.map(cat => (
            <button key={cat} className={`filter-tag ${activeCategory === cat ? 'active' : ''}`}
              onClick={() => setActiveCategory(cat)}>{cat}</button>
          ))}
        </div>

        <div className="section-heading">
          <span>{activeCategory === 'All' ? 'All Devices' : activeCategory}</span>
          <span style={{ fontSize: 13, fontWeight: 400, color: 'var(--text-3)', fontFamily: 'DM Sans' }}>{localFiltered.length} items</span>
        </div>

        {/* AI loading */}
        {aiSearching && (
          <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-3)' }}>
            <div style={{ fontSize: 14, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
              <Sparkles size={16} style={{ color: 'var(--accent)' }} /> Loading full specs...
            </div>
          </div>
        )}

        {/* AI full result card */}
        {aiSearchResult && !aiSearching && (
          <div style={{ marginBottom: 24 }}>
            {aiSearchResult.found ? (
              <div style={{ background: 'var(--bg-2)', border: '1px solid var(--accent)', borderRadius: 'var(--radius)', overflow: 'hidden', boxShadow: '0 0 20px rgba(99,102,241,0.1)' }}>
                <div style={{ background: 'linear-gradient(135deg, rgba(99,102,241,0.15), rgba(99,102,241,0.03))', padding: '20px', borderBottom: '1px solid var(--border)', display: 'flex', gap: 16, alignItems: 'center' }}>
                  <div style={{ width: 60, height: 60, borderRadius: 14, background: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 8, flexShrink: 0, boxShadow: '0 4px 16px rgba(0,0,0,0.2)' }}>
                    <BrandLogo brand={aiSearchResult.brand} emoji={aiSearchResult.emoji || '💡'} size={44} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4, flexWrap: 'wrap' }}>
                      <Sparkles size={12} style={{ color: 'var(--accent)' }} />
                      <span style={{ fontSize: 11, color: 'var(--accent)', fontWeight: 600 }}>AI Result</span>
                      <span style={{ fontSize: 10, background: 'rgba(99,102,241,0.15)', color: 'var(--accent)', padding: '2px 8px', borderRadius: 20, fontWeight: 700, textTransform: 'uppercase' }}>{aiSearchResult.category}</span>
                      <button onClick={() => setAiSearchResult(null)} style={{ marginLeft: 'auto', background: 'none', border: 'none', color: 'var(--text-3)', cursor: 'pointer' }}><X size={14} /></button>
                    </div>
                    <div style={{ fontFamily: 'Syne, sans-serif', fontWeight: 800, fontSize: 18, color: 'var(--text)' }}>{aiSearchResult.name}</div>
                    <div style={{ fontSize: 12, color: 'var(--text-3)', marginTop: 2 }}>{aiSearchResult.brand}</div>
                  </div>
                  <div style={{ fontFamily: 'Syne, sans-serif', fontWeight: 800, fontSize: 20, color: 'var(--accent)', flexShrink: 0 }}>{aiSearchResult.price}</div>
                </div>

                <div style={{ padding: '16px 20px' }}>
                  <div style={{ fontSize: 13, color: 'var(--text-2)', lineHeight: 1.7, marginBottom: 14, background: 'var(--bg-3)', borderRadius: 8, padding: '10px 14px' }}>
                    {aiSearchResult.summary}
                  </div>
                  {aiSearchResult.details && Object.keys(aiSearchResult.details).length > 0 && (
                    <div style={{ background: 'var(--bg-3)', borderRadius: 10, overflow: 'hidden', marginBottom: 14 }}>
                      {Object.entries(aiSearchResult.details).map(([key, val], i, arr) => (
                        <div key={key} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '9px 16px', borderBottom: i < arr.length - 1 ? '1px solid var(--border)' : 'none' }}>
                          <span style={{ fontSize: 12, color: 'var(--text-3)', textTransform: 'capitalize' }}>{key.replace(/([A-Z])/g, ' $1').trim()}</span>
                          <span style={{ fontSize: 13, color: 'var(--text)', fontWeight: 500 }}>{val}</span>
                        </div>
                      ))}
                    </div>
                  )}
                  <div style={{ display: 'flex', gap: 10 }}>
                    <button className="btn btn-primary" style={{ flex: 1, justifyContent: 'center' }}
                      onClick={() => { sessionStorage.setItem('pendingMessage', JSON.stringify({ content: `Tell me about the ${aiSearchResult.name}. Key specs, pros, cons, and is it worth buying in the Philippines?` })); navigate(`/chat/${Date.now()}`); }}>
                      🤖 Ask AI More
                    </button>
                    <button className="btn btn-ghost" style={{ flex: 1, justifyContent: 'center' }}
                      onClick={() => { sessionStorage.setItem('compareDevice', JSON.stringify(aiSearchResult)); navigate('/compare'); }}>
                      ⚖️ Compare This
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-3)' }}>
                <div style={{ fontSize: 36, marginBottom: 12 }}>🔍</div>
                <p>No results found for "{search}"</p>
              </div>
            )}
          </div>
        )}

        {/* Device grid */}
        {!aiSearchResult && !aiSearching && (
          localFiltered.length === 0 && search ? (
            <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-3)' }}>
              <div style={{ fontSize: 36, marginBottom: 12 }}>🔍</div>
              <p style={{ marginBottom: 16 }}>No local results for "{search}"</p>
            </div>
          ) : (
            <div className="devices-grid">
              {localFiltered.map((device, i) => (
                <div key={device.id} className="device-card fade-up"
                  style={{ animationDelay: `${i * 0.04}s`, cursor: 'pointer' }}
                  onClick={() => setSelectedDevice(device)}>
                  <div className="device-card-img" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(135deg, var(--bg-3) 0%, var(--bg-2) 100%)', position: 'relative', overflow: 'hidden' }}>
                    <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(circle at 50% 40%, rgba(99,102,241,0.08), transparent 70%)' }} />
                    <div style={{ width: 70, height: 70, borderRadius: 16, background: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 10, boxShadow: '0 4px 16px rgba(0,0,0,0.2)', position: 'relative', zIndex: 1 }}>
                      <BrandLogo brand={device.brand} emoji={device.emoji} size={50} />
                    </div>
                  </div>
                  <div className="device-card-body">
                    <div className="device-card-category">{device.category}</div>
                    <div className="device-card-name">{device.name}</div>
                    <div className="device-card-spec">{device.specs}</div>
                    <div className="device-card-price">{device.price}</div>
                  </div>
                </div>
              ))}
            </div>
          )
        )}
      </div>

      {/* Chat bar */}
      {!isSearching && (
        <div className="chat-wrapper">
          <form className="chat-bar" onSubmit={handleChatSubmit}>
            <input ref={fileRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleFileChange} />
            <button type="button" className="upload-btn" onClick={() => fileRef.current.click()}>
              {uploadedFile ? (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="2" /><circle cx="8.5" cy="8.5" r="1.5" /><polyline points="21 15 16 10 5 21" /></svg>
              ) : (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="17 8 12 3 7 8" /><line x1="12" y1="3" x2="12" y2="15" /></svg>
              )}
            </button>
            <input className="chat-input" type="text"
              placeholder={uploadedFile ? `Image: ${uploadedFile.name} — Add a question...` : "Ask about any PC part, phone..."}
              value={chatInput} onChange={e => setChatInput(e.target.value)} />
            <button type="submit" className="chat-send">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="22" y1="2" x2="11" y2="13" /><polygon points="22 2 15 22 11 13 2 9 22 2" /></svg>
            </button>
          </form>
        </div>
      )}

      {/* Device popup */}
      {selectedDevice && (
        <div className="modal-overlay" onClick={() => setSelectedDevice(null)}>
          <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 480, width: '100%' }}>
            <button onClick={() => setSelectedDevice(null)} style={{ position: 'absolute', top: 16, right: 16, background: 'none', border: 'none', color: 'var(--text-3)', cursor: 'pointer' }}><X size={18} /></button>
            <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 20 }}>
              <div style={{ width: 52, height: 52, borderRadius: 14, background: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 8, boxShadow: '0 4px 16px rgba(0,0,0,0.2)', flexShrink: 0 }}>
                <BrandLogo brand={selectedDevice.brand} emoji={selectedDevice.emoji} size={36} />
              </div>
              <div>
                <div style={{ fontSize: 11, color: 'var(--accent)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 4 }}>{selectedDevice.category}</div>
                <div style={{ fontFamily: 'Syne, sans-serif', fontWeight: 800, fontSize: 18 }}>{selectedDevice.name}</div>
                <div style={{ fontSize: 13, color: 'var(--text-3)', marginTop: 2 }}>{selectedDevice.brand}</div>
              </div>
            </div>
            <div style={{ background: 'var(--bg-3)', borderRadius: 10, padding: '12px 16px', marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: 13, color: 'var(--text-2)' }}>Price</span>
              <span style={{ fontFamily: 'Syne, sans-serif', fontWeight: 700, fontSize: 18, color: 'var(--accent)' }}>{selectedDevice.price}</span>
            </div>
            <div style={{ background: 'var(--bg-3)', borderRadius: 10, padding: '4px 0', marginBottom: 20 }}>
              {Object.entries(selectedDevice.details).map(([key, val], i, arr) => (
                <div key={key} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 16px', borderBottom: i < arr.length - 1 ? '1px solid var(--border)' : 'none' }}>
                  <span style={{ fontSize: 12, color: 'var(--text-3)', textTransform: 'capitalize' }}>{key.replace(/([A-Z])/g, ' $1').trim()}</span>
                  <span style={{ fontSize: 13, color: 'var(--text)', fontWeight: 500, textAlign: 'right', maxWidth: '60%' }}>{val}</span>
                </div>
              ))}
            </div>
            <div style={{ display: 'flex', gap: 10 }}>
              <button className="btn btn-ghost" onClick={() => setSelectedDevice(null)} style={{ flex: 1 }}>Close</button>
              <button className="btn btn-primary" onClick={() => askAIDevice(selectedDevice)} style={{ flex: 1 }}>🤖 Ask AI About This</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}