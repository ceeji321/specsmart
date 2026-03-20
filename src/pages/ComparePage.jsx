import { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
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

const BRAND_COLORS = {
  'NVIDIA': '#76b900', 'AMD': '#ed1c24', 'Intel': '#0071c5',
  'Apple': '#555555', 'Samsung': '#1428a0', 'Xiaomi': '#ff6900',
  'Google': '#4285f4', 'OnePlus': '#f5010c', 'ASUS': '#00539b',
  'MSI': '#e4002b', 'Gigabyte': '#e31837', 'Corsair': '#ffd200',
  'G.Skill': '#cc0000', 'Kingston': '#e30613', 'Crucial': '#006400',
  'WD': '#0066cc', 'Seagate': '#00ae42', 'Seasonic': '#d4890a',
  'be quiet!': '#333333', 'Thermaltake': '#c0392b',
};

const GSMARENA_IMGS = {
  'samsung galaxy s25 ultra': 'https://fdn2.gsmarena.com/vv/bigpic/samsung-galaxy-s25-ultra.jpg',
  'samsung galaxy s25+': 'https://fdn2.gsmarena.com/vv/bigpic/samsung-galaxy-s25plus.jpg',
  'samsung galaxy s25': 'https://fdn2.gsmarena.com/vv/bigpic/samsung-galaxy-s25.jpg',
  'samsung galaxy s24 ultra': 'https://fdn2.gsmarena.com/vv/bigpic/samsung-galaxy-s24-ultra-5g.jpg',
  'samsung galaxy s24+': 'https://fdn2.gsmarena.com/vv/bigpic/samsung-galaxy-s24plus-5g.jpg',
  'samsung galaxy s24': 'https://fdn2.gsmarena.com/vv/bigpic/samsung-galaxy-s24-5g.jpg',
  'samsung galaxy s23 ultra': 'https://fdn2.gsmarena.com/vv/bigpic/samsung-galaxy-s23-ultra-5g.jpg',
  'apple iphone 16 pro max': 'https://fdn2.gsmarena.com/vv/bigpic/apple-iphone-16-pro-max.jpg',
  'apple iphone 16 pro': 'https://fdn2.gsmarena.com/vv/bigpic/apple-iphone-16-pro.jpg',
  'apple iphone 16 plus': 'https://fdn2.gsmarena.com/vv/bigpic/apple-iphone-16-plus.jpg',
  'apple iphone 16': 'https://fdn2.gsmarena.com/vv/bigpic/apple-iphone-16.jpg',
  'apple iphone 15 pro max': 'https://fdn2.gsmarena.com/vv/bigpic/apple-iphone-15-pro-max.jpg',
  'apple iphone 15 pro': 'https://fdn2.gsmarena.com/vv/bigpic/apple-iphone-15-pro.jpg',
  'apple iphone 15': 'https://fdn2.gsmarena.com/vv/bigpic/apple-iphone-15.jpg',
  'apple iphone 14 pro max': 'https://fdn2.gsmarena.com/vv/bigpic/apple-iphone-14-pro-max.jpg',
  'apple iphone 14 pro': 'https://fdn2.gsmarena.com/vv/bigpic/apple-iphone-14-pro.jpg',
  'apple iphone 14': 'https://fdn2.gsmarena.com/vv/bigpic/apple-iphone-14.jpg',
  'apple iphone 13 pro max': 'https://fdn2.gsmarena.com/vv/bigpic/apple-iphone-13-pro-max.jpg',
  'apple iphone 13 pro': 'https://fdn2.gsmarena.com/vv/bigpic/apple-iphone-13-pro.jpg',
  'apple iphone 13': 'https://fdn2.gsmarena.com/vv/bigpic/apple-iphone-13.jpg',
  'apple iphone 12 pro': 'https://fdn2.gsmarena.com/vv/bigpic/apple-iphone-12-pro.jpg',
  'apple iphone 12': 'https://fdn2.gsmarena.com/vv/bigpic/apple-iphone-12.jpg',
  'google pixel 9 pro': 'https://fdn2.gsmarena.com/vv/bigpic/google-pixel-9-pro.jpg',
  'google pixel 9': 'https://fdn2.gsmarena.com/vv/bigpic/google-pixel-9.jpg',
  'google pixel 8 pro': 'https://fdn2.gsmarena.com/vv/bigpic/google-pixel-8-pro.jpg',
  'xiaomi 14 ultra': 'https://fdn2.gsmarena.com/vv/bigpic/xiaomi-14-ultra.jpg',
  'xiaomi 14': 'https://fdn2.gsmarena.com/vv/bigpic/xiaomi-14.jpg',
  'oneplus 12': 'https://fdn2.gsmarena.com/vv/bigpic/oneplus-12.jpg',
};

// ─── In-memory cache ──────────────────────────────────────────────────────────
const deviceCache = new Map();

// FIX: Safe JSON extractor — handles extra text, markdown fences, and truncated
// responses. Tries full parse first, then extracts the first { } or [ ] block.
function safeParseJSON(raw) {
  if (!raw) return null;
  // Strip markdown code fences
  let cleaned = raw.replace(/```json\s*/gi, '').replace(/```\s*/g, '').trim();
  // Try direct parse first
  try { return JSON.parse(cleaned); } catch { /* fall through */ }
  // Try extracting first JSON object
  const objStart = cleaned.indexOf('{');
  const objEnd   = cleaned.lastIndexOf('}');
  if (objStart !== -1 && objEnd > objStart) {
    try { return JSON.parse(cleaned.slice(objStart, objEnd + 1)); } catch { /* fall through */ }
  }
  // Try extracting first JSON array
  const arrStart = cleaned.indexOf('[');
  const arrEnd   = cleaned.lastIndexOf(']');
  if (arrStart !== -1 && arrEnd > arrStart) {
    try { return JSON.parse(cleaned.slice(arrStart, arrEnd + 1)); } catch { /* fall through */ }
  }
  return null;
}

// FIX: Safe value renderer — if the AI returns a nested object for a spec field
// (e.g. cores: { performance: 8, efficiency: 4 }) convert it to a readable string
// instead of letting React try to render the object directly, which crashes with
// "Objects are not valid as a React child".
function safeVal(val) {
  if (val === null || val === undefined) return null;
  if (typeof val === 'object') {
    // Convert object values to "key: value" pairs joined by ", "
    return Object.entries(val)
      .map(([k, v]) => `${k}: ${v}`)
      .join(', ');
  }
  return String(val);
}

function getDeviceImageUrl(device) {
  if (!device) return null;
  const lower = (device.name || '').toLowerCase();
  for (const [key, url] of Object.entries(GSMARENA_IMGS)) {
    if (lower === key || lower.includes(key) || key.includes(lower)) return url;
  }
  if (device.localImg) return device.localImg;
  if (device.img && device.img.startsWith('http')) return device.img;
  return null;
}

function matchLocalDevice(suggestion) {
  const nameLower     = (suggestion.name     || '').toLowerCase();
  const brandLower    = (suggestion.brand    || '').toLowerCase();
  const categoryLower = (suggestion.category || '').toLowerCase();

  // FIX: helper that rejects a local match if its category is clearly different
  // from what the AI identified. Prevents "Samsung Galaxy S26 Ultra" matching
  // an SSD entry just because both share a keyword like "Ultra" or "Samsung".
  const categoryOk = (localDevice) => {
    if (!categoryLower || !localDevice.category) return true; // can't tell — allow
    const lc = localDevice.category.toLowerCase();
    // Define incompatible category pairs
    const isPhone  = categoryLower.includes('smartphone') || categoryLower.includes('phone');
    const isPC     = ['gpu','cpu','ram','ssd','motherboard','psu','storage'].some(c => categoryLower.includes(c));
    const isLaptop = categoryLower.includes('laptop');
    if (isPhone  && (lc.includes('ssd') || lc.includes('gpu') || lc.includes('cpu') || lc.includes('ram') || lc.includes('motherboard') || lc.includes('psu'))) return false;
    if (isPC     && (lc.includes('smartphone') || lc.includes('phone') || lc.includes('laptop'))) return false;
    if (isLaptop && (lc.includes('smartphone') || lc.includes('phone') || lc.includes('ssd') || lc.includes('gpu') || lc.includes('cpu'))) return false;
    return true;
  };

  // Exact name match — still guard category
  let match = devices.find(d => d.name.toLowerCase() === nameLower && categoryOk(d));
  if (match) return match;

  // Partial name match — guard category
  match = devices.find(d =>
    categoryOk(d) &&
    (d.name.toLowerCase().includes(nameLower) || nameLower.includes(d.name.toLowerCase()))
  );
  if (match) return match;

  // Brand + keyword match — guard category
  match = devices.find(d => {
    if (!categoryOk(d)) return false;
    const words = nameLower.split(' ').filter(w => w.length > 2);
    const dName = d.name.toLowerCase();
    return d.brand?.toLowerCase() === brandLower && words.some(w => dName.includes(w));
  });
  return match || null;
}

const BrandInitial = ({ brand, size = 36 }) => {
  const color  = BRAND_COLORS[brand] || '#6366f1';
  const letter = (brand || '?')[0].toUpperCase();
  return (
    <div style={{
      width: size, height: size, borderRadius: '50%', background: color,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      color: 'white', fontWeight: 800, fontSize: size * 0.42,
      fontFamily: 'Syne, sans-serif', flexShrink: 0, userSelect: 'none',
    }}>
      {letter}
    </div>
  );
};

const BrandLogoFallback = ({ brand, emoji, size = 30 }) => {
  const [err, setErr] = useState(false);
  const url = getBrandLogoUrl(brand);
  if (!url || err) {
    return emoji
      ? <span style={{ fontSize: size * 0.7, lineHeight: 1 }}>{emoji}</span>
      : <BrandInitial brand={brand} size={size} />;
  }
  return <img src={url} alt={brand} onError={() => setErr(true)}
    style={{ width: size, height: size, objectFit: 'contain' }} />;
};

const DeviceImage = ({ device, size = 40 }) => {
  const [localFailed,  setLocalFailed]  = useState(false);
  const [remoteFailed, setRemoteFailed] = useState(false);
  useEffect(() => { setLocalFailed(false); setRemoteFailed(false); }, [device?.name]);

  const imgStyle = { width: size, height: size, objectFit: 'contain', padding: 3, boxSizing: 'border-box' };
  const imageUrl  = getDeviceImageUrl(device);
  const proxySrc  = imageUrl && imageUrl.startsWith('http')
    ? `https://wsrv.nl/?url=${encodeURIComponent(imageUrl)}&w=300&output=webp`
    : imageUrl;

  if (device?.localImg && !localFailed)
    return <img src={device.localImg} alt={device?.name} onError={() => setLocalFailed(true)} style={imgStyle} />;
  if (proxySrc && !remoteFailed)
    return <img src={proxySrc} alt={device?.name} referrerPolicy="no-referrer"
      onError={() => setRemoteFailed(true)} style={imgStyle} />;
  return <BrandLogoFallback brand={device?.brand} emoji={device?.emoji} size={size - 10} />;
};

const ThumbBox = ({ size = 44, children }) => (
  <div style={{
    width: size, height: size, borderRadius: 10, background: 'white',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    flexShrink: 0, overflow: 'hidden', boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
  }}>
    {children}
  </div>
);

const DevicePreview = ({ device }) => (
  <div style={{ marginTop: 12, border: '1px solid var(--border)', borderRadius: 'var(--radius)', overflow: 'hidden', background: 'var(--bg-2)' }}>
    <div style={{
      background: 'linear-gradient(135deg, rgba(99,102,241,0.18) 0%, rgba(99,102,241,0.04) 100%)',
      padding: '28px 20px 20px', textAlign: 'center', borderBottom: '1px solid var(--border)', position: 'relative',
    }}>
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, background: 'linear-gradient(90deg, var(--accent), #a5b4fc)' }} />
      <div style={{
        width: 90, height: 90, borderRadius: 18, background: 'white',
        margin: '0 auto 14px', display: 'flex', alignItems: 'center', justifyContent: 'center',
        boxShadow: '0 8px 24px rgba(0,0,0,0.25)', overflow: 'hidden',
      }}>
        <DeviceImage device={device} size={90} />
      </div>
      <div style={{
        display: 'inline-flex', alignItems: 'center', gap: 4,
        background: 'rgba(99,102,241,0.15)', border: '1px solid rgba(99,102,241,0.25)',
        color: 'var(--accent)', fontSize: 10, fontWeight: 700,
        textTransform: 'uppercase', letterSpacing: '1px',
        padding: '3px 12px', borderRadius: 20, marginBottom: 10,
      }}>
        {device.category}
      </div>
      <div style={{ fontFamily: 'Syne', fontSize: 17, fontWeight: 800, lineHeight: 1.25, marginBottom: 4 }}>{device.name}</div>
      <div style={{ fontSize: 11, color: 'var(--text-3)', fontWeight: 500 }}>{device.brand}</div>
    </div>
    <div style={{ padding: '14px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
      <div style={{ fontSize: 12, color: 'var(--text-3)', maxWidth: '55%', lineHeight: 1.5 }}>{device.specs}</div>
      <div style={{ fontFamily: 'Syne', fontSize: 16, fontWeight: 800, color: 'var(--accent)', textAlign: 'right' }}>{device.price}</div>
    </div>
  </div>
);

// ─── API helpers ──────────────────────────────────────────────────────────────

async function fetchAISuggestions(query, category) {
  const cacheKey = `suggest:${query.toLowerCase()}:${category}`;
  if (deviceCache.has(cacheKey)) return deviceCache.get(cacheKey);

  const catFilter = category && category !== 'All' ? ` Focus only on ${category} products.` : '';
  const response  = await askAI([{
    role: 'user',
    content: `List up to 6 real PC hardware or smartphone products matching: "${query}".${catFilter}
Respond with JSON only (no markdown):
[{ "name": "Product Name", "category": "CPU/GPU/RAM/SSD/Smartphone/Motherboard/PSU/Laptop/etc", "brand": "Brand", "emoji": "emoji", "specs": "short one-line spec" }]
Only return products that actually exist. Be specific with model names.`
  }]);

  // FIX: use safeParseJSON instead of bare JSON.parse — handles extra text and malformed responses
  const parsed = safeParseJSON(response);
  const suggestions = Array.isArray(parsed) ? parsed : [];
  const result = suggestions.map(s => {
    const local = matchLocalDevice(s);
    return { ...s, img: local?.img || local?.image || null, localImg: local?.localImg || null };
  });

  deviceCache.set(cacheKey, result);
  return result;
}

async function fetchAIDevice(query) {
  const cacheKey = `device:${query.toLowerCase()}`;
  if (deviceCache.has(cacheKey)) return deviceCache.get(cacheKey);

  const response = await askAI([{
    role: 'user',
    content: `The user wants to compare this device: "${query}"
Respond with JSON only (no markdown). Use ONLY these exact key names for details:
display, processor, cores, threads, baseClock, boostClock, tdp, socket, cache, memory, vram, cudaCores, streamProc, capacity, type, speed, latency, readSpeed, writeSpeed, tbw, formFactor, interface, ram, storage, mainCamera, battery, os, layout, switches, connectivity, sensor, dpi, pollRate, weight, wattage, efficiency, modular, warranty, chipset, memType, memSlots, pcie, m2Slots, usbPorts
{
  "found": true,
  "name": "Exact Product Name",
  "category": "CPU/GPU/RAM/SSD/Smartphone/PSU/Motherboard/Laptop/etc",
  "brand": "Brand",
  "specs": "One line key specs",
  "price": "Philippine Peso price range",
  "emoji": "single relevant emoji",
  "details": { "key": "value as plain string" },
  "summary": "2 sentence overview"
}
IMPORTANT: All values inside "details" must be plain strings, never nested objects.
If not found: {"found": false}`
  }]);

  // FIX: use safeParseJSON — the old bare JSON.parse crashed when the AI returned
  // extra explanation text before or after the JSON, causing "position 332" errors
  const result = safeParseJSON(response);

  if (!result) {
    console.warn('fetchAIDevice: could not parse response for', query, '| raw:', response?.slice(0, 200));
    return { found: false };
  }

  if (result.found) {
    // FIX: flatten any nested objects in details so safeVal doesn't need to do it at render time
    if (result.details && typeof result.details === 'object') {
      const flat = {};
      for (const [k, v] of Object.entries(result.details)) {
        flat[k] = typeof v === 'object' && v !== null ? safeVal(v) : v;
      }
      result.details = flat;
    }
    const local = matchLocalDevice(result);
    if (local) {
      result.img     = result.img     || local.img     || local.image || null;
      result.localImg = result.localImg || local.localImg || null;
    }
  }

  deviceCache.set(cacheKey, result);
  return result;
}

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
                  <ThumbBox size={44}><DeviceImage device={d} size={42} /></ThumbBox>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--text)' }}>{d.name}</div>
                    <div style={{ fontSize: 11, color: 'var(--text-3)' }}>{d.category} · {d.price}</div>
                  </div>
                </div>
              ))}
            </>
          )}
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
                <ThumbBox size={44}><DeviceImage device={s} size={42} /></ThumbBox>
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
  const [searchParams] = useSearchParams();
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

  // ─── Load devices sequentially to avoid rate limit flood ──────────────────
  useEffect(() => {
    const d1 = searchParams.get('d1');
    const d2 = searchParams.get('d2');
    if (!d1 && !d2) return;

    const loadSequentially = async () => {
      if (d1) {
        setSearch1(d1);
        setAiLoading1(true);
        try {
          const r = await fetchAIDevice(d1);
          if (r?.found) setDevice1({ ...r, id: Date.now(), details: r.details || {} });
        } catch (e) {
          console.warn('Failed to load device 1:', e.message);
        }
        setAiLoading1(false);
      }

      if (d1 && d2) await new Promise(res => setTimeout(res, 500));

      if (d2) {
        setSearch2(d2);
        setAiLoading2(true);
        try {
          const r = await fetchAIDevice(d2);
          if (r?.found) setDevice2({ ...r, id: Date.now(), details: r.details || {} });
        } catch (e) {
          console.warn('Failed to load device 2:', e.message);
        }
        setAiLoading2(false);
      }
    };

    loadSequentially();
  }, []); // eslint-disable-line

  useEffect(() => {
    const handle = (e) => {
      if (ref1.current && !ref1.current.contains(e.target)) setShowDropdown1(false);
      if (ref2.current && !ref2.current.contains(e.target)) setShowDropdown2(false);
    };
    document.addEventListener('mousedown', handle);
    return () => document.removeEventListener('mousedown', handle);
  }, []);

  useEffect(() => {
    if (!search1.trim() || search1.length < 3) { setAiSuggestions1([]); return; }
    clearTimeout(debounceRef1.current);
    debounceRef1.current = setTimeout(async () => {
      setSuggestionsLoading1(true);
      try { setAiSuggestions1(await fetchAISuggestions(search1, activeCategory1)); }
      catch { setAiSuggestions1([]); }
      setSuggestionsLoading1(false);
    }, 1200);
    return () => clearTimeout(debounceRef1.current);
  }, [search1, activeCategory1]);

  useEffect(() => {
    if (!search2.trim() || search2.length < 3) { setAiSuggestions2([]); return; }
    clearTimeout(debounceRef2.current);
    debounceRef2.current = setTimeout(async () => {
      setSuggestionsLoading2(true);
      try { setAiSuggestions2(await fetchAISuggestions(search2, activeCategory2)); }
      catch { setAiSuggestions2([]); }
      setSuggestionsLoading2(false);
    }, 1200);
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

  // FIX: Generate AI comparison text BEFORE saving so the app can display it.
  // The old code called saveComparison() immediately when both devices were
  // selected — before any AI result existed — so comparison_result was always
  // empty and the app showed "No result saved".
  useEffect(() => {
    if (device1 && device2 && !saved) {
      setSaved(true);
      (async () => {
        try {
          const prompt = `Compare ${device1.name} vs ${device2.name} for the Philippine market.
Use these plain section headers only: Overview, Performance, Display, Camera, Battery, Philippine Price in PHP, Verdict.
For PC parts skip Display/Camera/Battery and use: Overview, Performance, Key Specs, Power & Efficiency, Philippine Price in PHP, Verdict.
Plain language. No markdown symbols like ** or ##.`;
          const result = await askAI([{ role: 'user', content: prompt }]);
          const cleaned = (result || '').replace(/```[a-z]*\n?/gi, '').replace(/```/g, '').trim();
          await saveComparison(device1, device2, cleaned);
        } catch (e) {
          // Save with empty result rather than not saving at all
          await saveComparison(device1, device2, '');
        }
      })();
    }
    if (!device1 || !device2) setSaved(false);
  }, [device1, device2]);

  useEffect(() => {
    const stored = sessionStorage.getItem('compareDevice');
    if (stored) {
      sessionStorage.removeItem('compareDevice');
      const d = JSON.parse(stored);
      setDevice1({ ...d, id: Date.now(), details: d.details || {} });
      setSearch1(d.name);
      if (d.category) setActiveCategory2(d.category);
    }
  }, []);

  const selectLocal1 = (d) => { setDevice1(d); setSearch1(d.name); setShowDropdown1(false); if (d.category) setActiveCategory2(d.category); };
  const selectLocal2 = (d) => { setDevice2(d); setSearch2(d.name); setShowDropdown2(false); if (d.category) setActiveCategory1(d.category); };

  const selectAI1 = async (s) => {
    setShowDropdown1(false); setSearch1(s.name); setAiLoading1(true);
    try {
      const r = await fetchAIDevice(s.name);
      if (r?.found) { setDevice1({ ...r, id: Date.now(), details: r.details || {} }); if (r.category) setActiveCategory2(r.category); }
    } catch {}
    setAiLoading1(false);
  };

  const selectAI2 = async (s) => {
    setShowDropdown2(false); setSearch2(s.name); setAiLoading2(true);
    try {
      const r = await fetchAIDevice(s.name);
      if (r?.found) { setDevice2({ ...r, id: Date.now(), details: r.details || {} }); if (r.category) setActiveCategory1(r.category); }
    } catch {}
    setAiLoading2(false);
  };

  return (
    <div className="page">
      <Navbar />
      <div className="page-content" style={{ maxWidth: 900 }}>
        <h1 style={{ fontFamily: 'Syne', fontSize: 28, fontWeight: 800, marginBottom: 32, textAlign: 'center' }}>
          Compare Devices
        </h1>

        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1fr) auto minmax(0,1fr)', gap: 20, alignItems: 'start', marginBottom: 32 }}>
          <SearchBox
            containerRef={ref1} label="Compare:"
            search={search1} setSearch={setSearch1}
            showDropdown={showDropdown1} setShowDropdown={setShowDropdown1}
            localFiltered={filterDevices(search1, activeCategory1)}
            aiSuggestions={aiSuggestions1} suggestionsLoading={suggestionsLoading1}
            onSelectLocal={selectLocal1} onSelectAISuggestion={selectAI1}
            aiLoading={aiLoading1} device={device1}
            activeCategory={activeCategory1} setActiveCategory={setActiveCategory1}
          />

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', paddingTop: 28 }}>
            <div style={{ fontFamily: 'Syne', fontSize: 20, fontWeight: 800, color: 'var(--text-3)', padding: '10px 14px', background: 'var(--bg-2)', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)' }}>
              VS
            </div>
          </div>

          <SearchBox
            containerRef={ref2} label="Compare with:"
            search={search2} setSearch={setSearch2}
            showDropdown={showDropdown2} setShowDropdown={setShowDropdown2}
            localFiltered={filterDevices(search2, activeCategory2)}
            aiSuggestions={aiSuggestions2} suggestionsLoading={suggestionsLoading2}
            onSelectLocal={selectLocal2} onSelectAISuggestion={selectAI2}
            aiLoading={aiLoading2} device={device2}
            activeCategory={activeCategory2} setActiveCategory={setActiveCategory2}
          />
        </div>

        {(device1 || device2) && (
          <div style={{ background: 'var(--bg-2)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', overflow: 'hidden', marginBottom: 32 }}>
            {[
              { label: 'Brand',     v1: device1?.brand,    v2: device2?.brand },
              { label: 'Category',  v1: device1?.category, v2: device2?.category },
              { label: 'Key Specs', v1: device1?.specs,    v2: device2?.specs },
              { label: 'Price',     v1: device1?.price,    v2: device2?.price },
            ].map((row, i) => (
              <div key={i} style={{ display: 'grid', gridTemplateColumns: '140px 1fr 1fr', borderBottom: '1px solid var(--border)', background: i % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.01)' }}>
                <div style={{ padding: '14px 16px', fontSize: 13, fontWeight: 500, color: 'var(--text-2)', borderRight: '1px solid var(--border)' }}>{row.label}</div>
                {/* FIX: wrap with safeVal so nested objects never reach React as raw values */}
                <div style={{ padding: '14px 16px', fontSize: 13, color: 'var(--text)', borderRight: '1px solid var(--border)' }}>{safeVal(row.v1) || '—'}</div>
                <div style={{ padding: '14px 16px', fontSize: 13, color: 'var(--text)' }}>{safeVal(row.v2) || '—'}</div>
              </div>
            ))}
            {detailKeys.map((key, i) => {
              const v1 = key === 'summary' ? device1?.summary : device1?.details?.[key];
              const v2 = key === 'summary' ? device2?.summary : device2?.details?.[key];
              return (
                <div key={key} style={{ display: 'grid', gridTemplateColumns: '140px 1fr 1fr', borderBottom: i < detailKeys.length - 1 ? '1px solid var(--border)' : 'none', background: (i + 4) % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.01)' }}>
                  <div style={{ padding: '14px 16px', fontSize: 13, fontWeight: 500, color: 'var(--text-2)', borderRight: '1px solid var(--border)' }}>{LABELS[key] || key}</div>
                  {/* FIX: safeVal converts any nested object to a readable string instead
                      of crashing with "Objects are not valid as a React child" */}
                  <div style={{ padding: '14px 16px', fontSize: 13, color: 'var(--text)', borderRight: '1px solid var(--border)' }}>{safeVal(v1) || '—'}</div>
                  <div style={{ padding: '14px 16px', fontSize: 13, color: 'var(--text)' }}>{safeVal(v2) || '—'}</div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}