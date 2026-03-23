import { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import Navbar from '../components/Navbar';
import { devices } from '../data/devices';
import { saveComparison } from '../services/historyService';
import { askAI } from '../services/aiService';
import { Sparkles, AlertTriangle } from 'lucide-react';

const API_BASE = import.meta.env.DEV
  ? 'http://localhost:5000'
  : 'https://specsmart-production-ed74.up.railway.app';

// ── Category-specific spec rows ───────────────────────────────────────────────
const CATEGORY_ROWS = {
  Smartphone:  ['display', 'processor', 'chipset', 'ram', 'storage', 'mainCamera', 'battery', 'os', 'connectivity', 'sensor', 'weight', 'summary'],
  Laptop:      ['display', 'processor', 'ram', 'storage', 'battery', 'os', 'weight', 'connectivity', 'usbPorts', 'summary'],
  CPU:         ['cores', 'threads', 'baseClock', 'boostClock', 'tdp', 'socket', 'cache', 'summary'],
  GPU:         ['vram', 'cudaCores', 'streamProc', 'memory', 'tdp', 'formFactor', 'summary'],
  RAM:         ['capacity', 'type', 'speed', 'latency', 'formFactor', 'summary'],
  SSD:         ['capacity', 'type', 'readSpeed', 'writeSpeed', 'tbw', 'formFactor', 'interface', 'summary'],
  Motherboard: ['chipset', 'socket', 'formFactor', 'memType', 'memSlots', 'pcie', 'm2Slots', 'usbPorts', 'summary'],
  PSU:         ['wattage', 'efficiency', 'modular', 'formFactor', 'warranty', 'summary'],
  Mouse:       ['sensor', 'dpi', 'connectivity', 'pollRate', 'weight', 'summary'],
  Keyboard:    ['layout', 'switches', 'connectivity', 'weight', 'summary'],
};

const ALL_ROWS = [
  'display', 'processor', 'cores', 'threads', 'baseClock', 'boostClock', 'tdp', 'socket',
  'cache', 'memory', 'vram', 'cudaCores', 'streamProc', 'capacity', 'type', 'speed',
  'latency', 'readSpeed', 'writeSpeed', 'tbw', 'formFactor', 'interface', 'ram', 'storage',
  'mainCamera', 'battery', 'os', 'layout', 'switches', 'connectivity', 'sensor', 'dpi',
  'pollRate', 'weight', 'wattage', 'efficiency', 'modular', 'warranty', 'chipset', 'memType',
  'memSlots', 'pcie', 'm2Slots', 'usbPorts', 'summary'
];

function getDetailRows(category) {
  if (!category) return ALL_ROWS;
  const key = Object.keys(CATEGORY_ROWS).find(k =>
    category.toLowerCase().includes(k.toLowerCase())
  );
  return CATEGORY_ROWS[key] || ALL_ROWS;
}

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

const CATEGORY_GROUPS = {
  CPU: 'CPU', GPU: 'GPU', RAM: 'RAM', SSD: 'SSD',
  Motherboard: 'Motherboard', PSU: 'PSU', Laptop: 'Laptop',
  Smartphone: 'Smartphone', Mouse: 'Mouse', Keyboard: 'Keyboard',
};

function getCategoryGroup(category) {
  if (!category) return null;
  return CATEGORY_GROUPS[category.trim()] || category.trim();
}

function isSameGroup(cat1, cat2) {
  if (!cat1 || !cat2) return true;
  return getCategoryGroup(cat1) === getCategoryGroup(cat2);
}

const BRAND_COLORS = {
  'NVIDIA': '#76b900', 'AMD': '#ed1c24', 'Intel': '#0071c5',
  'Apple': '#555555', 'Samsung': '#1428a0', 'Xiaomi': '#ff6900',
  'Google': '#4285f4', 'OnePlus': '#f5010c', 'ASUS': '#00539b',
  'MSI': '#e4002b', 'Gigabyte': '#e31837', 'Corsair': '#ffd200',
  'G.Skill': '#cc0000', 'Kingston': '#e30613', 'Crucial': '#006400',
  'WD': '#0066cc', 'Seagate': '#00ae42', 'Seasonic': '#d4890a',
  'be quiet!': '#333333', 'Thermaltake': '#c0392b', 'Huawei': '#cf0a2c',
  'ASRock': '#cc0000', 'Infinix': '#0066cc',
};

// ─── GSMARENA image map (phones) ──────────────────────────────────────────────
const GSMARENA_IMGS = {
  'samsung galaxy s25 ultra': 'https://fdn2.gsmarena.com/vv/bigpic/samsung-galaxy-s25-ultra.jpg',
  'samsung galaxy s25+': 'https://fdn2.gsmarena.com/vv/bigpic/samsung-galaxy-s25plus.jpg',
  'samsung galaxy s25': 'https://fdn2.gsmarena.com/vv/bigpic/samsung-galaxy-s25.jpg',
  'samsung galaxy s24 ultra': 'https://fdn2.gsmarena.com/vv/bigpic/samsung-galaxy-s24-ultra-5g.jpg',
  'samsung galaxy s24+': 'https://fdn2.gsmarena.com/vv/bigpic/samsung-galaxy-s24plus-5g.jpg',
  'samsung galaxy s24': 'https://fdn2.gsmarena.com/vv/bigpic/samsung-galaxy-s24-5g.jpg',
  'samsung galaxy s23 ultra': 'https://fdn2.gsmarena.com/vv/bigpic/samsung-galaxy-s23-ultra-5g.jpg',
  'samsung galaxy a55': 'https://fdn2.gsmarena.com/vv/bigpic/samsung-galaxy-a55.jpg',
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
  'asus rog phone 8 pro': 'https://fdn2.gsmarena.com/vv/bigpic/asus-rog-phone-8-pro.jpg',
  'infinix hot 30': 'https://fdn2.gsmarena.com/vv/bigpic/infinix-hot-30.jpg',
  'infinix note 30 pro': 'https://fdn2.gsmarena.com/vv/bigpic/infinix-note-30-pro.jpg',
  'huawei matebook d 15': 'https://fdn2.gsmarena.com/vv/bigpic/huawei-matebook-d-15-2021.jpg',
  'huawei matebook x pro': 'https://fdn2.gsmarena.com/vv/bigpic/huawei-matebook-x-pro-2023.jpg',
  'huawei matebook 14s': 'https://fdn2.gsmarena.com/vv/bigpic/huawei-matebook-14s.jpg',
};

// ─── Static HTTP image map for PC hardware ────────────────────────────────────
// Only real working http URLs — no /images/ local paths which 404
const STATIC_IMGS = {
  'samsung 990 pro 2tb':             'https://semiconductor.samsung.com/us/consumer-storage/internal-ssd/990-pro/images/samsung-990-pro-nvme-m2-ssd-product.png',
  'samsung 990 pro 1tb':             'https://semiconductor.samsung.com/us/consumer-storage/internal-ssd/990-pro/images/samsung-990-pro-nvme-m2-ssd-product.png',
  'wd black sn850x 2tb':             'https://shop.westerndigital.com/content/dam/store/en-us/assets/products/internal-flash/wd-black-sn850x-nvme-m2-ssd/gallery/wd-black-sn850x-nvme-ssd-01.png',
  'wd black sn850x 1tb':             'https://shop.westerndigital.com/content/dam/store/en-us/assets/products/internal-flash/wd-black-sn850x-nvme-m2-ssd/gallery/wd-black-sn850x-nvme-ssd-01.png',
  'seagate firecuda 530 2tb':        'https://www.seagate.com/content/dam/seagate/migrated-assets/www-content/products/solidstate/firecuda-530/_shared/images/firecuda-530-m2-nvme-ssd-filer.png',
  'samsung 870 evo 2tb':             'https://semiconductor.samsung.com/us/consumer-storage/internal-ssd/870-evo/images/samsung-870-evo-sata-ssd-product.png',
  'samsung 870 evo 1tb':             'https://semiconductor.samsung.com/us/consumer-storage/internal-ssd/870-evo/images/samsung-870-evo-sata-ssd-product.png',
  'wd blue 1tb':                     'https://shop.westerndigital.com/content/dam/store/en-us/assets/products/internal-flash/wd-blue-sata-ssd/gallery/wd-blue-sata-ssd-01.png',
  'seasonic focus gx-1000':          'https://seasonic.com/pub/media/catalog/product/f/o/focus-gx-1000-product-main.png',
  'seasonic focus gx-750':           'https://seasonic.com/pub/media/catalog/product/f/o/focus-gx-1000-product-main.png',
  'thermaltake toughpower gf3 850w': 'https://www.thermaltake.com/uploads/Products/ps_000056/top_image/tt-toughpower-gf3-850w-gold-tt-premium-_-lf-top_800.jpg',
};

// ─── Image cache ──────────────────────────────────────────────────────────────
const imageCache = new Map();

async function fetchProductImage(name, category = '') {
  if (!name) return null;
  const cacheKey = `${name}::${category}`;
  if (imageCache.has(cacheKey)) return imageCache.get(cacheKey);
  try {
    const params = new URLSearchParams({ q: name });
    if (category) params.set('cat', category);
    const res = await fetch(`${API_BASE}/api/ai/product-image?${params}`);
    if (!res.ok) { imageCache.set(cacheKey, null); return null; }
    const data = await res.json();
    const url = data.url || null;
    imageCache.set(cacheKey, url);
    return url;
  } catch {
    imageCache.set(cacheKey, null);
    return null;
  }
}

const deviceCache = new Map();

function safeParseJSON(raw) {
  if (!raw) return null;
  let cleaned = raw.replace(/```json\s*/gi, '').replace(/```\s*/g, '').trim();
  try { return JSON.parse(cleaned); } catch { }
  const objStart = cleaned.indexOf('{'), objEnd = cleaned.lastIndexOf('}');
  if (objStart !== -1 && objEnd > objStart) {
    try { return JSON.parse(cleaned.slice(objStart, objEnd + 1)); } catch { }
  }
  const arrStart = cleaned.indexOf('['), arrEnd = cleaned.lastIndexOf(']');
  if (arrStart !== -1 && arrEnd > arrStart) {
    try { return JSON.parse(cleaned.slice(arrStart, arrEnd + 1)); } catch { }
  }
  return null;
}

function safeVal(val) {
  if (val === null || val === undefined) return null;
  if (typeof val === 'object') return Object.entries(val).map(([k, v]) => `${k}: ${v}`).join(', ');
  return String(val);
}

// ✅ FIXED: Only returns real http URLs — never broken /images/ local paths
function getStaticImageUrl(device) {
  if (!device) return null;
  const lower = (device.name || '').toLowerCase();

  // 1. GSMARENA map (phones/laptops)
  for (const [key, url] of Object.entries(GSMARENA_IMGS)) {
    if (lower === key || lower.includes(key) || key.includes(lower)) return url;
  }

  // 2. STATIC_IMGS map (PC hardware with real URLs)
  for (const [key, url] of Object.entries(STATIC_IMGS)) {
    if (lower === key || lower.includes(key) || key.includes(lower)) return url;
  }

  // 3. Only use device.image / device.img if they are real http URLs
  if (device.image && device.image.startsWith('http')) return device.image;
  if (device.img   && device.img.startsWith('http'))   return device.img;

  // ✅ Never return /images/... paths — they 404 and cause wrong fallback images
  return null;
}

function matchLocalDevice(suggestion) {
  const nameLower     = (suggestion.name     || '').toLowerCase();
  const brandLower    = (suggestion.brand    || '').toLowerCase();
  const categoryLower = (suggestion.category || '').toLowerCase();

  const categoryOk = (localDevice) => {
    if (!categoryLower || !localDevice.category) return true;
    const lc = localDevice.category.toLowerCase();
    const isPhone  = categoryLower.includes('smartphone') || categoryLower.includes('phone');
    const isPC     = ['gpu','cpu','ram','ssd','motherboard','psu','storage'].some(c => categoryLower.includes(c));
    const isLaptop = categoryLower.includes('laptop');
    if (isPhone  && (lc.includes('ssd') || lc.includes('gpu') || lc.includes('cpu') || lc.includes('ram') || lc.includes('motherboard') || lc.includes('psu'))) return false;
    if (isPC     && (lc.includes('smartphone') || lc.includes('phone') || lc.includes('laptop'))) return false;
    if (isLaptop && (lc.includes('smartphone') || lc.includes('phone') || lc.includes('ssd') || lc.includes('gpu') || lc.includes('cpu'))) return false;
    return true;
  };

  let match = devices.find(d => d.name.toLowerCase() === nameLower && categoryOk(d));
  if (match) return match;
  match = devices.find(d => categoryOk(d) && (d.name.toLowerCase().includes(nameLower) || nameLower.includes(d.name.toLowerCase())));
  if (match) return match;
  match = devices.find(d => {
    if (!categoryOk(d)) return false;
    const words = nameLower.split(' ').filter(w => w.length > 2);
    const dName = d.name.toLowerCase();
    return d.brand?.toLowerCase() === brandLower && words.some(w => dName.includes(w));
  });
  return match || null;
}

// ─── Brand initial (replaces Clearbit entirely — Clearbit is blocked by ad blockers) ──
const BrandInitial = ({ brand, size = 36 }) => {
  const color  = BRAND_COLORS[brand] || '#6366f1';
  const letter = (brand || '?')[0].toUpperCase();
  return (
    <div style={{
      width: size, height: size,
      borderRadius: size > 50 ? 14 : '50%',
      background: `linear-gradient(135deg, ${color}dd, ${color}88)`,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      color: 'white', fontWeight: 900, fontSize: size * 0.42,
      fontFamily: 'Syne, sans-serif', flexShrink: 0, userSelect: 'none',
    }}>
      {letter}
    </div>
  );
};

// ─── SuggestionImage — for AI dropdown results ────────────────────────────────
const SuggestionImage = ({ name, brand, category = '' }) => {
  const [imgUrl,  setImgUrl]  = useState(null);
  const [failed,  setFailed]  = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setImgUrl(null); setFailed(false); setLoading(true);
    if (!name) { setLoading(false); return; }

    const lower = name.toLowerCase();

    // Check static maps first (instant, no network)
    for (const [key, url] of Object.entries(GSMARENA_IMGS)) {
      if (lower === key || lower.includes(key) || key.includes(lower)) {
        setImgUrl(url); setLoading(false); return;
      }
    }
    for (const [key, url] of Object.entries(STATIC_IMGS)) {
      if (lower === key || lower.includes(key) || key.includes(lower)) {
        setImgUrl(url); setLoading(false); return;
      }
    }

    // Check cache
    const cacheKey = `${name}::${category}`;
    if (imageCache.has(cacheKey)) {
      setImgUrl(imageCache.get(cacheKey));
      setLoading(false);
      return;
    }

    // Fetch from backend with category hint
    fetchProductImage(name, category).then(url => {
      setImgUrl(url);
      setLoading(false);
    });
  }, [name, category]);

  if (loading) {
    return (
      <div style={{
        width: 42, height: 42, borderRadius: 10, flexShrink: 0,
        background: 'linear-gradient(90deg, #2a2a2a 25%, #3a3a3a 50%, #2a2a2a 75%)',
        backgroundSize: '200% 100%', animation: 'shimmer 1.2s infinite',
      }} />
    );
  }

  if (imgUrl && !failed) {
    return (
      <div style={{ width: 42, height: 42, borderRadius: 10, background: 'white', overflow: 'hidden', flexShrink: 0, boxShadow: '0 1px 4px rgba(0,0,0,0.15)' }}>
        <img src={imgUrl} alt={name} onError={() => setFailed(true)}
          style={{ width: '100%', height: '100%', objectFit: 'contain', padding: 3, boxSizing: 'border-box' }} />
      </div>
    );
  }

  return <BrandInitial brand={brand} size={42} />;
};

// ─── DeviceImage — for "In Database" dropdown rows ────────────────────────────
const DeviceImage = ({ device, size = 40 }) => {
  const [fetchedImg, setFetchedImg] = useState(null);
  const [imgFailed,  setImgFailed]  = useState(false);

  useEffect(() => {
    setFetchedImg(null);
    setImgFailed(false);
    if (!device) return;

    // Try static maps first (instant, no network)
    const staticUrl = getStaticImageUrl(device);
    if (staticUrl) { setFetchedImg(staticUrl); return; }

    // Fall back to backend fetch
    fetchProductImage(device.name, device.category).then(url => {
      if (url) setFetchedImg(url);
    });
  }, [device?.name]);

  const imgStyle = { width: size, height: size, objectFit: 'contain', padding: 3, boxSizing: 'border-box' };

  if (fetchedImg && !imgFailed) {
    const proxySrc = fetchedImg.startsWith('http')
      ? `https://wsrv.nl/?url=${encodeURIComponent(fetchedImg)}&w=300&output=webp`
      : fetchedImg;
    return (
      <img src={proxySrc} alt={device?.name} referrerPolicy="no-referrer"
        onError={() => setImgFailed(true)} style={imgStyle} />
    );
  }

  return <BrandInitial brand={device?.brand} size={size - 8} />;
};

const ThumbBox = ({ size = 44, children }) => (
  <div style={{ width: size, height: size, borderRadius: 10, background: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, overflow: 'hidden', boxShadow: '0 2px 8px rgba(0,0,0,0.15)' }}>
    {children}
  </div>
);

// ─── DevicePreview — big card shown after selecting a device ──────────────────
const DevicePreview = ({ device }) => {
  const [fetchedImg, setFetchedImg] = useState(null);
  const [imgFailed,  setImgFailed]  = useState(false);

  useEffect(() => {
    setFetchedImg(null);
    setImgFailed(false);
    if (!device) return;

    // Try static maps first (instant)
    const staticUrl = getStaticImageUrl(device);
    if (staticUrl) { setFetchedImg(staticUrl); return; }

    // Fall back to backend fetch with category hint
    fetchProductImage(device.name, device.category).then(url => {
      if (url) setFetchedImg(url);
    });
  }, [device?.name, device?.category]);

  const imgSrc = fetchedImg && fetchedImg.startsWith('http')
    ? `https://wsrv.nl/?url=${encodeURIComponent(fetchedImg)}&w=300&output=webp`
    : fetchedImg || null;

  return (
    <div style={{ marginTop: 12, border: '1px solid var(--border)', borderRadius: 'var(--radius)', overflow: 'hidden', background: 'var(--bg-2)' }}>
      <div style={{ background: 'linear-gradient(135deg, rgba(99,102,241,0.18) 0%, rgba(99,102,241,0.04) 100%)', padding: '28px 20px 20px', textAlign: 'center', borderBottom: '1px solid var(--border)', position: 'relative' }}>
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, background: 'linear-gradient(90deg, var(--accent), #a5b4fc)' }} />
        <div style={{ width: 90, height: 90, borderRadius: 18, background: 'white', margin: '0 auto 14px', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 8px 24px rgba(0,0,0,0.25)', overflow: 'hidden' }}>
          {imgSrc && !imgFailed ? (
            <img src={imgSrc} alt={device?.name} onError={() => setImgFailed(true)}
              referrerPolicy="no-referrer"
              style={{ width: 90, height: 90, objectFit: 'contain', padding: 4, boxSizing: 'border-box' }} />
          ) : (
            <BrandInitial brand={device?.brand} size={60} />
          )}
        </div>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 4, background: 'rgba(99,102,241,0.15)', border: '1px solid rgba(99,102,241,0.25)', color: 'var(--accent)', fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1px', padding: '3px 12px', borderRadius: 20, marginBottom: 10 }}>
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
};

const MismatchWarning = ({ cat1, cat2, onClear }) => (
  <div style={{ display: 'flex', alignItems: 'center', gap: 12, background: 'rgba(251,191,36,0.08)', border: '1px solid rgba(251,191,36,0.3)', borderRadius: 10, padding: '12px 16px', marginBottom: 20 }}>
    <AlertTriangle size={18} style={{ color: '#fbbf24', flexShrink: 0 }} />
    <div style={{ flex: 1 }}>
      <div style={{ fontSize: 13, fontWeight: 600, color: '#fbbf24' }}>Category Mismatch</div>
      <div style={{ fontSize: 12, color: 'var(--text-2)', marginTop: 2 }}>
        You're comparing a <strong>{cat1}</strong> with a <strong>{cat2}</strong>. For a fair comparison, both devices should be the same category.
      </div>
    </div>
    <button onClick={onClear} style={{ background: 'rgba(251,191,36,0.15)', border: '1px solid rgba(251,191,36,0.3)', color: '#fbbf24', borderRadius: 6, padding: '5px 12px', fontSize: 12, fontWeight: 600, cursor: 'pointer', flexShrink: 0 }}>
      Clear Device 2
    </button>
  </div>
);

async function fetchAISuggestions(query, category) {
  const cacheKey = `suggest:${query.toLowerCase()}:${category}`;
  if (deviceCache.has(cacheKey)) return deviceCache.get(cacheKey);
  const catFilter = category && category !== 'All' ? ` Focus only on ${category} products.` : '';
  const response = await askAI([{ role: 'user', content: `List up to 6 real PC hardware or smartphone products matching: "${query}".${catFilter}\nRespond with JSON only (no markdown):\n[{ "name": "Product Name", "category": "CPU/GPU/RAM/SSD/Smartphone/Motherboard/PSU/Laptop/etc", "brand": "Brand", "emoji": "emoji", "specs": "short one-line spec" }]\nOnly return products that actually exist. Be specific with model names.` }]);
  const parsed = safeParseJSON(response);
  const suggestions = Array.isArray(parsed) ? parsed : [];
  const result = suggestions.map(s => { const local = matchLocalDevice(s); return { ...s, img: local?.img || local?.image || null }; });
  deviceCache.set(cacheKey, result);
  return result;
}

async function fetchAIDevice(query) {
  const cacheKey = `device:${query.toLowerCase()}`;
  if (deviceCache.has(cacheKey)) return deviceCache.get(cacheKey);
  const response = await askAI([{ role: 'user', content: `The user wants to compare this device: "${query}"\nRespond with JSON only (no markdown). Use ONLY these exact key names for details:\ndisplay, processor, cores, threads, baseClock, boostClock, tdp, socket, cache, memory, vram, cudaCores, streamProc, capacity, type, speed, latency, readSpeed, writeSpeed, tbw, formFactor, interface, ram, storage, mainCamera, battery, os, layout, switches, connectivity, sensor, dpi, pollRate, weight, wattage, efficiency, modular, warranty, chipset, memType, memSlots, pcie, m2Slots, usbPorts\n{\n  "found": true,\n  "name": "Exact Product Name",\n  "category": "CPU/GPU/RAM/SSD/Smartphone/PSU/Motherboard/Laptop/etc",\n  "brand": "Brand",\n  "specs": "One line key specs",\n  "price": "Philippine Peso price range",\n  "emoji": "single relevant emoji",\n  "details": { "key": "value as plain string" },\n  "summary": "2 sentence overview"\n}\nIMPORTANT: All values inside "details" must be plain strings, never nested objects.\nIf not found: {"found": false}` }]);
  const result = safeParseJSON(response);
  if (!result) return { found: false };
  if (result.found) {
    if (result.details && typeof result.details === 'object') {
      const flat = {};
      for (const [k, v] of Object.entries(result.details)) flat[k] = typeof v === 'object' && v !== null ? safeVal(v) : v;
      result.details = flat;
    }
    const local = matchLocalDevice(result);
    if (local) {
      // Only copy real http image URLs — skip broken /images/ paths
      const localImg = local.image?.startsWith('http') ? local.image
                     : local.img?.startsWith('http')   ? local.img
                     : null;
      if (localImg) result.img = result.img || localImg;
    }
  }
  deviceCache.set(cacheKey, result);
  return result;
}

// ─── SearchBox ────────────────────────────────────────────────────────────────
const SearchBox = ({ containerRef, label, search, setSearch, showDropdown, setShowDropdown, localFiltered, aiSuggestions, suggestionsLoading, onSelectLocal, onSelectAISuggestion, aiLoading, device, activeCategory, setActiveCategory, lockedCategory }) => (
  <div ref={containerRef}>
    <style>{`@keyframes shimmer { 0%{background-position:200% 0} 100%{background-position:-200% 0} }`}</style>
    <div style={{ fontSize: 12, color: 'var(--text-3)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '1px', fontWeight: 600 }}>
      {label}
      {lockedCategory && (
        <span style={{ marginLeft: 8, color: 'var(--accent)', fontSize: 10, fontWeight: 700, background: 'rgba(99,102,241,0.15)', padding: '2px 8px', borderRadius: 20 }}>
          {lockedCategory} only
        </span>
      )}
    </div>
    <div style={{ position: 'relative' }}>
      <input className="search-input" type="text" placeholder={lockedCategory ? `Search ${lockedCategory}...` : 'Search or type any device...'} value={search} onChange={e => { setSearch(e.target.value); setShowDropdown(true); }} onFocus={() => setShowDropdown(true)} style={{ borderRadius: 'var(--radius-sm)' }} />
      {showDropdown && search.trim() && (
        <div style={{ position: 'absolute', top: 'calc(100% + 4px)', left: 0, right: 0, zIndex: 100, background: 'var(--bg-2)', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', boxShadow: 'var(--shadow)', overflow: 'hidden', maxHeight: 420, overflowY: 'auto' }}>
          {!lockedCategory && (
            <div style={{ padding: '8px 10px', display: 'flex', gap: 5, flexWrap: 'wrap', background: 'var(--bg-3)', borderBottom: '1px solid var(--border)', position: 'sticky', top: 0 }}>
              {CATEGORY_FILTERS.map(cat => (
                <button key={cat} onClick={() => setActiveCategory(cat)} style={{ padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 600, cursor: 'pointer', border: 'none', transition: 'all 0.15s', background: activeCategory === cat ? 'var(--accent)' : 'var(--bg-2)', color: activeCategory === cat ? 'white' : 'var(--text-3)' }}>{cat}</button>
              ))}
            </div>
          )}

          {/* In Database */}
          {localFiltered.length > 0 && (
            <>
              <div style={{ padding: '5px 14px', fontSize: 10, fontWeight: 700, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.8px', background: 'var(--bg-3)' }}>In Database</div>
              {localFiltered.map(d => (
                <div key={d.id} onClick={() => onSelectLocal(d)} style={{ padding: '9px 14px', cursor: 'pointer', display: 'flex', gap: 10, alignItems: 'center' }} onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-3)'} onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                  <ThumbBox size={44}><DeviceImage device={d} size={42} /></ThumbBox>
                  <div><div style={{ fontSize: 13, fontWeight: 500, color: 'var(--text)' }}>{d.name}</div><div style={{ fontSize: 11, color: 'var(--text-3)' }}>{d.category} · {d.price}</div></div>
                </div>
              ))}
            </>
          )}

          {/* AI Suggestions */}
          <div style={{ padding: '5px 14px', fontSize: 10, fontWeight: 700, color: 'var(--accent)', textTransform: 'uppercase', letterSpacing: '0.8px', background: 'var(--bg-3)', display: 'flex', alignItems: 'center', gap: 5 }}>
            <Sparkles size={10} /> AI Suggestions
          </div>
          {suggestionsLoading ? (
            <div style={{ padding: '12px 14px', fontSize: 12, color: 'var(--text-3)', display: 'flex', alignItems: 'center', gap: 8 }}><Sparkles size={12} style={{ color: 'var(--accent)' }} /> Finding suggestions...</div>
          ) : aiSuggestions.length > 0 ? (
            aiSuggestions.map((s, i) => (
              <div key={i} onClick={() => !aiLoading && onSelectAISuggestion(s)}
                style={{ padding: '9px 14px', cursor: aiLoading ? 'default' : 'pointer', display: 'flex', gap: 10, alignItems: 'center', opacity: aiLoading ? 0.6 : 1 }}
                onMouseEnter={e => { if (!aiLoading) e.currentTarget.style.background = 'var(--bg-3)'; }}
                onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}>
                <SuggestionImage name={s.name} brand={s.brand} category={s.category || ''} />
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

// ─── ComparePage ──────────────────────────────────────────────────────────────
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

  const hasMismatch = device1 && device2 && !isSameGroup(device1.category, device2.category);
  const lockedCategory2 = device1?.category || null;
  const lockedCategory1 = device2?.category || null;

  const sharedCategory = device1?.category || device2?.category;
  const detailRows = getDetailRows(sharedCategory);

  const detailKeys = (device1 || device2)
    ? detailRows.filter(k => {
        if (k === 'summary') return device1?.summary || device2?.summary;
        const v1 = device1?.details?.[k];
        const v2 = device2?.details?.[k];
        const isEmpty = (v) => !v || String(v).toLowerCase() === 'not applicable' || String(v).toLowerCase() === 'n/a';
        return !isEmpty(v1) || !isEmpty(v2);
      })
    : [];

  useEffect(() => {
    const d1 = searchParams.get('d1');
    const d2 = searchParams.get('d2');
    if (!d1 && !d2) return;
    const loadSequentially = async () => {
      if (d1) {
        setSearch1(d1); setAiLoading1(true);
        try { const r = await fetchAIDevice(d1); if (r?.found) setDevice1({ ...r, id: Date.now(), details: r.details || {} }); } catch (e) { console.warn('Failed to load device 1:', e.message); }
        setAiLoading1(false);
      }
      if (d1 && d2) await new Promise(res => setTimeout(res, 500));
      if (d2) {
        setSearch2(d2); setAiLoading2(true);
        try { const r = await fetchAIDevice(d2); if (r?.found) setDevice2({ ...r, id: Date.now(), details: r.details || {} }); } catch (e) { console.warn('Failed to load device 2:', e.message); }
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
    const cat = lockedCategory1 || activeCategory1;
    debounceRef1.current = setTimeout(async () => {
      setSuggestionsLoading1(true);
      try { setAiSuggestions1(await fetchAISuggestions(search1, cat)); } catch { setAiSuggestions1([]); }
      setSuggestionsLoading1(false);
    }, 1200);
    return () => clearTimeout(debounceRef1.current);
  }, [search1, activeCategory1, lockedCategory1]);

  useEffect(() => {
    if (!search2.trim() || search2.length < 3) { setAiSuggestions2([]); return; }
    clearTimeout(debounceRef2.current);
    const cat = lockedCategory2 || activeCategory2;
    debounceRef2.current = setTimeout(async () => {
      setSuggestionsLoading2(true);
      try { setAiSuggestions2(await fetchAISuggestions(search2, cat)); } catch { setAiSuggestions2([]); }
      setSuggestionsLoading2(false);
    }, 1200);
    return () => clearTimeout(debounceRef2.current);
  }, [search2, activeCategory2, lockedCategory2]);

  const filterDevices = (search, cat, locked) => devices.filter(d => {
    const q = search.toLowerCase();
    const matchesSearch = d.name.toLowerCase().includes(q) || d.category.toLowerCase().includes(q) || (d.brand?.toLowerCase().includes(q)) || (d.specs?.toLowerCase().includes(q));
    const matchesCat = locked ? getCategoryGroup(d.category) === getCategoryGroup(locked) : (cat === 'All' || d.category === cat);
    return matchesSearch && matchesCat;
  }).slice(0, 4);

  useEffect(() => {
    if (device1 && device2 && !saved && !hasMismatch) {
      setSaved(true);
      (async () => {
        try {
          const prompt = `Compare ${device1.name} vs ${device2.name} for the Philippine market.\nUse these plain section headers only: Overview, Performance, Display, Camera, Battery, Philippine Price in PHP, Verdict.\nFor PC parts skip Display/Camera/Battery and use: Overview, Performance, Key Specs, Power & Efficiency, Philippine Price in PHP, Verdict.\nPlain language. No markdown symbols like ** or ##.`;
          const result = await askAI([{ role: 'user', content: prompt }]);
          const cleaned = (result || '').replace(/```[a-z]*\n?/gi, '').replace(/```/g, '').trim();
          await saveComparison(device1, device2, cleaned);
        } catch { await saveComparison(device1, device2, ''); }
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
  const selectLocal2 = (d) => {
    if (device1 && !isSameGroup(device1.category, d.category)) return;
    setDevice2(d); setSearch2(d.name); setShowDropdown2(false);
    if (d.category) setActiveCategory1(d.category);
  };

  const selectAI1 = async (s) => {
    setShowDropdown1(false); setSearch1(s.name); setAiLoading1(true);
    try { const r = await fetchAIDevice(s.name); if (r?.found) { setDevice1({ ...r, id: Date.now(), details: r.details || {} }); if (r.category) setActiveCategory2(r.category); } } catch {}
    setAiLoading1(false);
  };

  const selectAI2 = async (s) => {
    if (device1 && !isSameGroup(device1.category, s.category)) return;
    setShowDropdown2(false); setSearch2(s.name); setAiLoading2(true);
    try {
      const r = await fetchAIDevice(s.name);
      if (r?.found) {
        if (device1 && !isSameGroup(device1.category, r.category)) { setSearch2(''); setAiLoading2(false); return; }
        setDevice2({ ...r, id: Date.now(), details: r.details || {} });
        if (r.category) setActiveCategory1(r.category);
      }
    } catch {}
    setAiLoading2(false);
  };

  const clearDevice2 = () => { setDevice2(null); setSearch2(''); setAiSuggestions2([]); setActiveCategory2('All'); setSaved(false); };

  return (
    <div className="page">
      <Navbar />
      <div className="page-content" style={{ maxWidth: 900 }}>
        <h1 style={{ fontFamily: 'Syne', fontSize: 28, fontWeight: 800, marginBottom: 8, textAlign: 'center' }}>Compare Devices</h1>
        <p style={{ textAlign: 'center', color: 'var(--text-3)', fontSize: 13, marginBottom: 32 }}>
          Only devices of the same category can be compared (CPU vs CPU, Smartphone vs Smartphone, etc.)
        </p>

        {hasMismatch && <MismatchWarning cat1={device1.category} cat2={device2.category} onClear={clearDevice2} />}

        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1fr) auto minmax(0,1fr)', gap: 20, alignItems: 'start', marginBottom: 32 }}>
          <SearchBox
            containerRef={ref1} label="Compare:"
            search={search1} setSearch={setSearch1}
            showDropdown={showDropdown1} setShowDropdown={setShowDropdown1}
            localFiltered={filterDevices(search1, activeCategory1, lockedCategory1)}
            aiSuggestions={aiSuggestions1} suggestionsLoading={suggestionsLoading1}
            onSelectLocal={selectLocal1} onSelectAISuggestion={selectAI1}
            aiLoading={aiLoading1} device={device1}
            activeCategory={activeCategory1} setActiveCategory={setActiveCategory1}
            lockedCategory={lockedCategory1}
          />

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', paddingTop: 28 }}>
            <div style={{ fontFamily: 'Syne', fontSize: 20, fontWeight: 800, color: hasMismatch ? '#fbbf24' : 'var(--text-3)', padding: '10px 14px', background: 'var(--bg-2)', border: `1px solid ${hasMismatch ? 'rgba(251,191,36,0.4)' : 'var(--border)'}`, borderRadius: 'var(--radius-sm)' }}>VS</div>
          </div>

          <SearchBox
            containerRef={ref2} label="Compare with:"
            search={search2} setSearch={setSearch2}
            showDropdown={showDropdown2} setShowDropdown={setShowDropdown2}
            localFiltered={filterDevices(search2, activeCategory2, lockedCategory2)}
            aiSuggestions={aiSuggestions2} suggestionsLoading={suggestionsLoading2}
            onSelectLocal={selectLocal2} onSelectAISuggestion={selectAI2}
            aiLoading={aiLoading2} device={device2}
            activeCategory={activeCategory2} setActiveCategory={setActiveCategory2}
            lockedCategory={lockedCategory2}
          />
        </div>

        {/* Comparison table */}
        {(device1 || device2) && !hasMismatch && (
          <div style={{ background: 'var(--bg-2)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', overflow: 'hidden', marginBottom: 32 }}>
            {[
              { label: 'Brand',     v1: device1?.brand,    v2: device2?.brand },
              { label: 'Category',  v1: device1?.category, v2: device2?.category },
              { label: 'Key Specs', v1: device1?.specs,    v2: device2?.specs },
              { label: 'Price',     v1: device1?.price,    v2: device2?.price },
            ].map((row, i) => (
              <div key={i} style={{ display: 'grid', gridTemplateColumns: '140px 1fr 1fr', borderBottom: '1px solid var(--border)', background: i % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.01)' }}>
                <div style={{ padding: '14px 16px', fontSize: 13, fontWeight: 500, color: 'var(--text-2)', borderRight: '1px solid var(--border)' }}>{row.label}</div>
                <div style={{ padding: '14px 16px', fontSize: 13, color: 'var(--text)', borderRight: '1px solid var(--border)' }}>{safeVal(row.v1) || '—'}</div>
                <div style={{ padding: '14px 16px', fontSize: 13, color: 'var(--text)' }}>{safeVal(row.v2) || '—'}</div>
              </div>
            ))}
            {detailKeys.map((key, i) => {
              const v1 = key === 'summary' ? device1?.summary : device1?.details?.[key];
              const v2 = key === 'summary' ? device2?.summary : device2?.details?.[key];
              const display1 = safeVal(v1);
              const display2 = safeVal(v2);
              return (
                <div key={key} style={{ display: 'grid', gridTemplateColumns: '140px 1fr 1fr', borderBottom: i < detailKeys.length - 1 ? '1px solid var(--border)' : 'none', background: (i + 4) % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.01)' }}>
                  <div style={{ padding: '14px 16px', fontSize: 13, fontWeight: 500, color: 'var(--text-2)', borderRight: '1px solid var(--border)' }}>{LABELS[key] || key}</div>
                  <div style={{ padding: '14px 16px', fontSize: 13, color: 'var(--text)', borderRight: '1px solid var(--border)' }}>{display1 || '—'}</div>
                  <div style={{ padding: '14px 16px', fontSize: 13, color: 'var(--text)' }}>{display2 || '—'}</div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}