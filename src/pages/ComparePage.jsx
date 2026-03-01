import { useState, useEffect, useRef } from 'react';
import Navbar from '../components/Navbar';
import { devices } from '../data/devices';
import { saveComparison } from '../services/historyService';
import { askAI } from '../services/aiService';
import { Sparkles } from 'lucide-react';
import { getBrandLogoUrl } from '../utils/brandLogo';

const DETAIL_ROWS = [
  'display', 'processor', 'cores', 'threads', 'baseClock', 'boostClock', 'tdp', 'socket',
  'cache', 'memory', 'vram', 'cudaCores', 'streamProc', 'capacity', 'type', 'speed',
  'latency', 'readSpeed', 'writeSpeed', 'tbw', 'formFactor', 'interface', 'ram', 'storage',
  'mainCamera', 'battery', 'os', 'layout', 'switches', 'connectivity', 'sensor', 'dpi',
  'pollRate', 'weight', 'wattage', 'efficiency', 'modular', 'warranty', 'chipset', 'memType',
  'memSlots', 'pcie', 'm2Slots', 'usbPorts', 'summary'
];

const LABELS = {
  display: 'Display', processor: 'Processor', cores: 'Cores', threads: 'Threads',
  baseClock: 'Base Clock', boostClock: 'Boost Clock', tdp: 'TDP', socket: 'Socket',
  cache: 'Cache', memory: 'Memory Type', vram: 'VRAM', cudaCores: 'CUDA Cores',
  streamProc: 'Stream Processors', capacity: 'Capacity', type: 'Type', speed: 'Speed',
  latency: 'Latency', readSpeed: 'Read Speed', writeSpeed: 'Write Speed', tbw: 'TBW',
  formFactor: 'Form Factor', interface: 'Interface', ram: 'RAM', storage: 'Storage',
  mainCamera: 'Main Camera', battery: 'Battery', os: 'OS', layout: 'Layout',
  switches: 'Switches', connectivity: 'Connectivity', sensor: 'Sensor', dpi: 'DPI',
  pollRate: 'Poll Rate', weight: 'Weight', wattage: 'Wattage', efficiency: 'Efficiency',
  modular: 'Modular', warranty: 'Warranty', chipset: 'Chipset', memType: 'Memory Type',
  memSlots: 'Memory Slots', pcie: 'PCIe', m2Slots: 'M.2 Slots', usbPorts: 'USB Ports',
  summary: 'Summary'
};

const CATEGORY_FILTERS = ['All', 'CPU', 'GPU', 'RAM', 'SSD', 'Motherboard', 'PSU', 'Laptop', 'Smartphone'];

async function fetchAISuggestions(query, category) {
  const catFilter = category && category !== 'All' ? ` Focus only on ${category} products.` : '';
  const response = await askAI([{
    role: 'user',
    content: `List up to 6 real PC hardware or smartphone products matching: "${query}".${catFilter}

Respond with JSON only (no markdown):
[
  { "name": "Product Name", "category": "CPU/GPU/RAM/SSD/Smartphone/Motherboard/PSU/Laptop/etc", "brand": "Brand", "emoji": "emoji", "specs": "short one-line spec" }
]
Only return products that actually exist. Be specific with model names.`
  }]);
  const clean = response.replace(/```json|```/g, '').trim();
  return JSON.parse(clean);
}

async function fetchAIDevice(query) {
  const response = await askAI([{
    role: 'user',
    content: `The user wants to compare this device: "${query}"

Respond with JSON only (no markdown). Use ONLY these exact key names for details — no other keys:
display, processor, cores, threads, baseClock, boostClock, tdp, socket, cache, memory, vram, cudaCores, streamProc, capacity, type, speed, latency, readSpeed, writeSpeed, tbw, formFactor, interface, ram, storage, mainCamera, battery, os, layout, switches, connectivity, sensor, dpi, pollRate, weight, wattage, efficiency, modular, warranty, chipset, memType, memSlots, pcie, m2Slots, usbPorts

{
  "found": true,
  "name": "Exact Product Name",
  "category": "CPU/GPU/RAM/SSD/Smartphone/PSU/Motherboard/Laptop/etc",
  "brand": "Brand",
  "specs": "One line key specs",
  "price": "Philippine Peso price range",
  "emoji": "single relevant emoji",
  "details": { "key": "value" },
  "summary": "2 sentence overview"
}
If not found: {"found": false}`
  }]);
  const clean = response.replace(/```json|```/g, '').trim();
  return JSON.parse(clean);
}

// Reusable brand logo with emoji fallback
const BrandLogo = ({ brand, emoji, size = 36 }) => {
  const [err, setErr] = useState(false);
  const url = getBrandLogoUrl(brand);
  if (!url || err) {
    return <span style={{ fontSize: size * 0.7, lineHeight: 1 }}>{emoji || '💡'}</span>;
  }
  return (
    <img src={url} alt={brand} onError={() => setErr(true)}
      style={{ width: size, height: size, objectFit: 'contain' }} />
  );
};

// Device card shown after selecting a device
const DevicePreview = ({ device }) => (
  <div style={{
    marginTop: 12,
    border: '1px solid var(--border)',
    borderRadius: 'var(--radius)',
    overflow: 'hidden',
    background: 'var(--bg-2)',
  }}>
    {/* Gradient header */}
    <div style={{
      background: 'linear-gradient(135deg, rgba(99,102,241,0.18) 0%, rgba(99,102,241,0.04) 100%)',
      padding: '28px 20px 20px',
      textAlign: 'center',
      borderBottom: '1px solid var(--border)',
      position: 'relative',
    }}>
      {/* Top line accent */}
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, background: 'linear-gradient(90deg, var(--accent), #a5b4fc)' }} />

      {/* Logo box */}
      <div style={{
        width: 72, height: 72, borderRadius: 18,
        background: 'white', margin: '0 auto 14px',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        boxShadow: '0 8px 24px rgba(0,0,0,0.25)',
        padding: 10, overflow: 'hidden',
      }}>
        <BrandLogo brand={device.brand} emoji={device.emoji} size={52} />
      </div>

      {/* Category pill */}
      <div style={{
        display: 'inline-flex', alignItems: 'center', gap: 4,
        background: 'rgba(99,102,241,0.15)', border: '1px solid rgba(99,102,241,0.25)',
        color: 'var(--accent)', fontSize: 10, fontWeight: 700,
        textTransform: 'uppercase', letterSpacing: '1px',
        padding: '3px 12px', borderRadius: 20, marginBottom: 10,
      }}>
        {device.category}
      </div>

      {/* Name */}
      <div style={{ fontFamily: 'Syne', fontSize: 17, fontWeight: 800, lineHeight: 1.25, marginBottom: 4 }}>
        {device.name}
      </div>
      {/* Brand */}
      <div style={{ fontSize: 11, color: 'var(--text-3)', fontWeight: 500 }}>{device.brand}</div>
    </div>

    {/* Footer */}
    <div style={{ padding: '14px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
      <div style={{ fontSize: 12, color: 'var(--text-3)', maxWidth: '55%', lineHeight: 1.5 }}>{device.specs}</div>
      <div style={{ fontFamily: 'Syne', fontSize: 16, fontWeight: 800, color: 'var(--accent)', textAlign: 'right' }}>{device.price}</div>
    </div>
  </div>
);

const SearchBox = ({
  containerRef, label, search, setSearch, showDropdown, setShowDropdown,
  localFiltered, aiSuggestions, suggestionsLoading,
  onSelectLocal, onSelectAISuggestion, aiLoading, device,
  activeCategory, setActiveCategory
}) => (
  <div ref={containerRef}>
    <div style={{ fontSize: 12, color: 'var(--text-3)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '1px', fontWeight: 600 }}>
      {label}
    </div>

    <div style={{ position: 'relative' }}>
      <input
        className="search-input"
        type="text"
        placeholder="Search or type any device..."
        value={search}
        onChange={e => { setSearch(e.target.value); setShowDropdown(true); }}
        onFocus={() => setShowDropdown(true)}
        style={{ borderRadius: 'var(--radius-sm)' }}
      />

      {showDropdown && search.trim() && (
        <div style={{
          position: 'absolute', top: 'calc(100% + 4px)', left: 0, right: 0, zIndex: 100,
          background: 'var(--bg-2)', border: '1px solid var(--border)',
          borderRadius: 'var(--radius-sm)', boxShadow: 'var(--shadow)',
          overflow: 'hidden', maxHeight: 420, overflowY: 'auto',
        }}>
          {/* Category pills */}
          <div style={{ padding: '8px 10px', display: 'flex', gap: 5, flexWrap: 'wrap', background: 'var(--bg-3)', borderBottom: '1px solid var(--border)', position: 'sticky', top: 0 }}>
            {CATEGORY_FILTERS.map(cat => (
              <button key={cat} onClick={() => setActiveCategory(cat)} style={{
                padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 600,
                cursor: 'pointer', border: 'none', transition: 'all 0.15s',
                background: activeCategory === cat ? 'var(--accent)' : 'var(--bg-2)',
                color: activeCategory === cat ? 'white' : 'var(--text-3)',
              }}>{cat}</button>
            ))}
          </div>

          {/* Local results */}
          {localFiltered.length > 0 && (
            <>
              <div style={{ padding: '5px 14px', fontSize: 10, fontWeight: 700, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.8px', background: 'var(--bg-3)' }}>
                In Database
              </div>
              {localFiltered.map(d => (
                <div key={d.id} onClick={() => onSelectLocal(d)}
                  style={{ padding: '9px 14px', cursor: 'pointer', display: 'flex', gap: 10, alignItems: 'center' }}
                  onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-3)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                  <div style={{ width: 36, height: 36, borderRadius: 10, background: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 4, flexShrink: 0 }}>
                    <BrandLogo brand={d.brand} emoji={d.emoji} size={28} />
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
              <div key={i} onClick={() => !aiLoading && onSelectAISuggestion(s)}
                style={{ padding: '9px 14px', cursor: aiLoading ? 'default' : 'pointer', display: 'flex', gap: 10, alignItems: 'center', opacity: aiLoading ? 0.6 : 1 }}
                onMouseEnter={e => { if (!aiLoading) e.currentTarget.style.background = 'var(--bg-3)'; }}
                onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}>
                <div style={{ width: 36, height: 36, borderRadius: 10, background: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 4, flexShrink: 0 }}>
                  <BrandLogo brand={s.brand} emoji={s.emoji} size={28} />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--text)' }}>{s.name}</div>
                  <div style={{ fontSize: 11, color: 'var(--text-3)' }}>{s.category} · {s.brand}</div>
                  {s.specs && <div style={{ fontSize: 10, color: 'var(--text-3)', marginTop: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{s.specs}</div>}
                </div>
                <Sparkles size={11} style={{ color: 'var(--accent)', flexShrink: 0 }} />
              </div>
            ))
          ) : (
            <div style={{ padding: '10px 14px', fontSize: 12, color: 'var(--text-3)' }}>Type more to get AI suggestions...</div>
          )}
        </div>
      )}
    </div>

    {aiLoading && (
      <div style={{ marginTop: 12, textAlign: 'center', color: 'var(--text-3)', fontSize: 13, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
        <Sparkles size={13} style={{ color: 'var(--accent)' }} /> Loading device details...
      </div>
    )}

    {device && <DevicePreview device={device} />}
  </div>
);

export default function ComparePage() {
  const [device1, setDevice1] = useState(null);
  const [device2, setDevice2] = useState(null);
  const [search1, setSearch1] = useState('');
  const [search2, setSearch2] = useState('');
  const [showDropdown1, setShowDropdown1] = useState(false);
  const [showDropdown2, setShowDropdown2] = useState(false);
  const [aiLoading1, setAiLoading1] = useState(false);
  const [aiLoading2, setAiLoading2] = useState(false);
  const [aiSuggestions1, setAiSuggestions1] = useState([]);
  const [aiSuggestions2, setAiSuggestions2] = useState([]);
  const [suggestionsLoading1, setSuggestionsLoading1] = useState(false);
  const [suggestionsLoading2, setSuggestionsLoading2] = useState(false);
  const [activeCategory1, setActiveCategory1] = useState('All');
  const [activeCategory2, setActiveCategory2] = useState('All');
  const [saved, setSaved] = useState(false);

  const ref1 = useRef(null);
  const ref2 = useRef(null);
  const debounceRef1 = useRef(null);
  const debounceRef2 = useRef(null);

  useEffect(() => {
    const handle = (e) => {
      if (ref1.current && !ref1.current.contains(e.target)) setShowDropdown1(false);
      if (ref2.current && !ref2.current.contains(e.target)) setShowDropdown2(false);
    };
    document.addEventListener('mousedown', handle);
    return () => document.removeEventListener('mousedown', handle);
  }, []);

  useEffect(() => {
    if (!search1.trim() || search1.length < 2) { setAiSuggestions1([]); return; }
    clearTimeout(debounceRef1.current);
    debounceRef1.current = setTimeout(async () => {
      setSuggestionsLoading1(true);
      try { setAiSuggestions1(await fetchAISuggestions(search1, activeCategory1)); }
      catch { setAiSuggestions1([]); }
      setSuggestionsLoading1(false);
    }, 600);
    return () => clearTimeout(debounceRef1.current);
  }, [search1, activeCategory1]);

  useEffect(() => {
    if (!search2.trim() || search2.length < 2) { setAiSuggestions2([]); return; }
    clearTimeout(debounceRef2.current);
    debounceRef2.current = setTimeout(async () => {
      setSuggestionsLoading2(true);
      try { setAiSuggestions2(await fetchAISuggestions(search2, activeCategory2)); }
      catch { setAiSuggestions2([]); }
      setSuggestionsLoading2(false);
    }, 600);
    return () => clearTimeout(debounceRef2.current);
  }, [search2, activeCategory2]);

  const filterDevices = (search, cat) => devices.filter(d => {
    const q = search.toLowerCase();
    return (d.name.toLowerCase().includes(q) || d.category.toLowerCase().includes(q) ||
      (d.brand?.toLowerCase().includes(q)) || (d.specs?.toLowerCase().includes(q))) &&
      (cat === 'All' || d.category === cat);
  }).slice(0, 4);

  const detailKeys = device1 || device2
    ? DETAIL_ROWS.filter(k =>
        device1?.details?.[k] || device2?.details?.[k] ||
        (k === 'summary' && (device1?.summary || device2?.summary)))
    : [];

  useEffect(() => {
    if (device1 && device2 && !saved) { setSaved(true); saveComparison(device1, device2); }
    if (!device1 || !device2) setSaved(false);
  }, [device1, device2]);

  useEffect(() => {
    const stored = sessionStorage.getItem('compareDevice');
    if (stored) {
      sessionStorage.removeItem('compareDevice');
      const d = JSON.parse(stored);
      setDevice1({ ...d, id: Date.now(), details: d.details || {} });
      setSearch1(d.name);
    }
  }, []);

  const selectAI1 = async (s) => {
    setShowDropdown1(false); setSearch1(s.name); setAiLoading1(true);
    try { const r = await fetchAIDevice(s.name); if (r.found) setDevice1({ ...r, id: Date.now(), details: r.details || {} }); }
    catch { } setAiLoading1(false);
  };

  const selectAI2 = async (s) => {
    setShowDropdown2(false); setSearch2(s.name); setAiLoading2(true);
    try { const r = await fetchAIDevice(s.name); if (r.found) setDevice2({ ...r, id: Date.now(), details: r.details || {} }); }
    catch { } setAiLoading2(false);
  };

  return (
    <div className="page">
      <Navbar />
      <div className="page-content">
        <h1 style={{ fontFamily: 'Syne', fontSize: 28, fontWeight: 800, marginBottom: 32, textAlign: 'center' }}>
          Compare Devices
        </h1>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr', gap: 20, alignItems: 'start', marginBottom: 32 }}>
          <SearchBox containerRef={ref1} label="Compare:"
            search={search1} setSearch={setSearch1}
            showDropdown={showDropdown1} setShowDropdown={setShowDropdown1}
            localFiltered={filterDevices(search1, activeCategory1)}
            aiSuggestions={aiSuggestions1} suggestionsLoading={suggestionsLoading1}
            onSelectLocal={d => { setDevice1(d); setSearch1(d.name); setShowDropdown1(false); }}
            onSelectAISuggestion={selectAI1} aiLoading={aiLoading1} device={device1}
            activeCategory={activeCategory1} setActiveCategory={setActiveCategory1}
          />

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', paddingTop: 28 }}>
            <div style={{ fontFamily: 'Syne', fontSize: 20, fontWeight: 800, color: 'var(--text-3)', padding: '10px 14px', background: 'var(--bg-2)', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)' }}>
              VS
            </div>
          </div>

          <SearchBox containerRef={ref2} label="Compare with:"
            search={search2} setSearch={setSearch2}
            showDropdown={showDropdown2} setShowDropdown={setShowDropdown2}
            localFiltered={filterDevices(search2, activeCategory2)}
            aiSuggestions={aiSuggestions2} suggestionsLoading={suggestionsLoading2}
            onSelectLocal={d => { setDevice2(d); setSearch2(d.name); setShowDropdown2(false); }}
            onSelectAISuggestion={selectAI2} aiLoading={aiLoading2} device={device2}
            activeCategory={activeCategory2} setActiveCategory={setActiveCategory2}
          />
        </div>

        {(device1 || device2) && (
          <div style={{ background: 'var(--bg-2)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', overflow: 'hidden', marginBottom: 80 }}>
            {[
              { label: 'Brand', v1: device1?.brand, v2: device2?.brand },
              { label: 'Category', v1: device1?.category, v2: device2?.category },
              { label: 'Key Specs', v1: device1?.specs, v2: device2?.specs },
              { label: 'Price', v1: device1?.price, v2: device2?.price },
            ].map((row, i) => (
              <div key={i} style={{ display: 'grid', gridTemplateColumns: '140px 1fr 1fr', borderBottom: '1px solid var(--border)', background: i % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.01)' }}>
                <div style={{ padding: '14px 16px', fontSize: 13, fontWeight: 500, color: 'var(--text-2)', borderRight: '1px solid var(--border)' }}>{row.label}</div>
                <div style={{ padding: '14px 16px', fontSize: 13, color: 'var(--text)', borderRight: '1px solid var(--border)' }}>{row.v1 || '—'}</div>
                <div style={{ padding: '14px 16px', fontSize: 13, color: 'var(--text)' }}>{row.v2 || '—'}</div>
              </div>
            ))}
            {detailKeys.map((key, i) => {
              const v1 = key === 'summary' ? device1?.summary : device1?.details?.[key];
              const v2 = key === 'summary' ? device2?.summary : device2?.details?.[key];
              return (
                <div key={key} style={{ display: 'grid', gridTemplateColumns: '140px 1fr 1fr', borderBottom: i < detailKeys.length - 1 ? '1px solid var(--border)' : 'none', background: (i + 4) % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.01)' }}>
                  <div style={{ padding: '14px 16px', fontSize: 13, fontWeight: 500, color: 'var(--text-2)', borderRight: '1px solid var(--border)' }}>{LABELS[key] || key}</div>
                  <div style={{ padding: '14px 16px', fontSize: 13, color: 'var(--text)', borderRight: '1px solid var(--border)' }}>{v1 || '—'}</div>
                  <div style={{ padding: '14px 16px', fontSize: 13, color: 'var(--text)' }}>{v2 || '—'}</div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}