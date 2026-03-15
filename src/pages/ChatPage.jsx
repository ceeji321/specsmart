import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import { askAIStream, analyzeImageWithGroq } from '../services/aiService';
import { saveChat } from '../services/historyService';

// ─── Category SVG thumbnails ──────────────────────────────────────────────────
const CategoryThumbnail = ({ category, brand }) => {
  const cfg = {
    SMARTPHONE: {
      bg: '#f0f4ff', accent: '#4f6ef7',
      svg: (
        <svg viewBox="0 0 80 120" width="52" height="78">
          <rect x="8" y="2" width="64" height="116" rx="10" ry="10" fill="#1a1a2e" />
          <rect x="12" y="8" width="56" height="96" rx="6" ry="6" fill="url(#screenGrad)" />
          <defs>
            <linearGradient id="screenGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#1a237e" />
              <stop offset="100%" stopColor="#283593" />
            </linearGradient>
          </defs>
          <circle cx="40" cy="110" r="4" fill="#333" />
          <rect x="28" y="5" width="24" height="3" rx="2" fill="#333" />
          <rect x="16" y="14" width="48" height="8" rx="2" fill="#3949ab" opacity="0.6" />
          <rect x="16" y="26" width="30" height="4" rx="2" fill="#5c6bc0" opacity="0.5" />
          <rect x="16" y="34" width="20" height="4" rx="2" fill="#5c6bc0" opacity="0.4" />
          <rect x="16" y="46" width="48" height="30" rx="4" fill="#1565c0" opacity="0.3" />
          <rect x="16" y="80" width="48" height="10" rx="2" fill="#3949ab" opacity="0.4" />
          <rect x="16" y="94" width="22" height="6" rx="3" fill="#4fc3f7" opacity="0.6" />
          <rect x="42" y="94" width="22" height="6" rx="3" fill="#4fc3f7" opacity="0.4" />
        </svg>
      ),
    },
    GPU: {
      bg: '#f0fff4', accent: '#22c55e',
      svg: (
        <svg viewBox="0 0 120 70" width="78" height="46">
          <rect x="4" y="10" width="112" height="52" rx="8" fill="#1b2838" />
          <rect x="8" y="14" width="104" height="44" rx="6" fill="#0a1628" />
          <rect x="14" y="18" width="38" height="36" rx="4" fill="#0d2137" />
          <circle cx="33" cy="36" r="13" fill="#1a3a5c" />
          <circle cx="33" cy="36" r="9" fill="#1e4976" />
          <circle cx="33" cy="36" r="5" fill="#2563eb" opacity="0.7" />
          <circle cx="33" cy="36" r="2" fill="#60a5fa" />
          <rect x="56" y="20" width="52" height="5" rx="2" fill="#374151" />
          <rect x="56" y="28" width="38" height="3" rx="1.5" fill="#4b5563" />
          <rect x="56" y="34" width="44" height="3" rx="1.5" fill="#4b5563" />
          <rect x="56" y="40" width="32" height="3" rx="1.5" fill="#4b5563" />
          <rect x="56" y="48" width="52" height="3" rx="1.5" fill="#22c55e" opacity="0.5" />
          {[14,25,36,47,58,69].map((x, i) => (
            <rect key={i} x={x} y="60" width="8" height="4" fill="#374151" />
          ))}
        </svg>
      ),
    },
    CPU: {
      bg: '#fff7ed', accent: '#f97316',
      svg: (
        <svg viewBox="0 0 80 80" width="58" height="58">
          <rect x="18" y="18" width="44" height="44" rx="4" fill="#1c1917" />
          <rect x="22" y="22" width="36" height="36" rx="3" fill="#292524" />
          <rect x="26" y="26" width="28" height="28" rx="2" fill="#44403c" />
          <rect x="30" y="30" width="20" height="20" rx="2" fill="#1c1917" />
          <rect x="33" y="33" width="14" height="14" rx="1" fill="#ea580c" opacity="0.7" />
          <rect x="36" y="36" width="8" height="8" rx="1" fill="#fed7aa" />
          {[20,28,36,44,52].map((y, i) => (
            <g key={i}>
              <rect x="8" y={y} width="8" height="3" rx="1" fill="#78716c" />
              <rect x="64" y={y} width="8" height="3" rx="1" fill="#78716c" />
            </g>
          ))}
          {[20,28,36,44,52].map((x, i) => (
            <g key={i}>
              <rect x={x} y="8" width="3" height="8" rx="1" fill="#78716c" />
              <rect x={x} y="64" width="3" height="8" rx="1" fill="#78716c" />
            </g>
          ))}
        </svg>
      ),
    },
    RAM: {
      bg: '#fdf4ff', accent: '#a855f7',
      svg: (
        <svg viewBox="0 0 110 50" width="72" height="33">
          <rect x="2" y="10" width="106" height="32" rx="3" fill="#1e1b4b" />
          <rect x="4" y="12" width="102" height="28" rx="2" fill="#312e81" />
          {[10,22,34,46,58,70,82,94].map((x, i) => (
            <g key={i}>
              <rect x={x} y="15" width="8" height="18" rx="1" fill="#4338ca" />
              <rect x={x+1} y="17" width="6" height="14" rx="1" fill="#6366f1" opacity="0.6" />
            </g>
          ))}
          <rect x="4" y="38" width="102" height="2" fill="#a855f7" opacity="0.5" />
          <rect x="2" y="6" width="4" height="4" rx="1" fill="#6b7280" />
          <rect x="104" y="6" width="4" height="4" rx="1" fill="#6b7280" />
        </svg>
      ),
    },
    SSD: {
      bg: '#f0f9ff', accent: '#0ea5e9',
      svg: (
        <svg viewBox="0 0 110 60" width="72" height="39">
          <rect x="4" y="6" width="102" height="48" rx="6" fill="#0c1a2e" />
          <rect x="8" y="10" width="94" height="40" rx="4" fill="#0f2744" />
          <rect x="14" y="16" width="40" height="8" rx="2" fill="#1e3a5f" />
          <rect x="14" y="28" width="56" height="4" rx="2" fill="#1e3a5f" />
          <rect x="14" y="35" width="40" height="4" rx="2" fill="#1e3a5f" />
          <circle cx="77" cy="24" r="7" fill="#0ea5e9" opacity="0.2" />
          <circle cx="77" cy="24" r="4" fill="#0ea5e9" opacity="0.4" />
          <circle cx="77" cy="24" r="2" fill="#7dd3fc" />
          <rect x="8" y="46" width="94" height="2" rx="1" fill="#0ea5e9" opacity="0.4" />
        </svg>
      ),
    },
    MOTHERBOARD: {
      bg: '#f0fdf4', accent: '#16a34a',
      svg: (
        <svg viewBox="0 0 100 100" width="62" height="62">
          <rect x="4" y="4" width="92" height="92" rx="4" fill="#14532d" />
          <rect x="8" y="8" width="84" height="84" rx="3" fill="#166534" />
          <rect x="12" y="12" width="30" height="20" rx="2" fill="#15803d" />
          <rect x="46" y="12" width="20" height="20" rx="2" fill="#1f2937" />
          <rect x="12" y="36" width="20" height="20" rx="2" fill="#1f2937" />
          <circle cx="22" cy="22" r="8" fill="#0a0a0a" />
          <circle cx="22" cy="22" r="5" fill="#1a1a1a" />
          <circle cx="22" cy="22" r="2" fill="#374151" />
          {[14,22,30,38,46,54,62,70,78,86].map((x, i) => (
            <rect key={i} x={x} y="68" width="4" height="8" rx="1" fill="#4ade80" opacity="0.6" />
          ))}
          <rect x="46" y="36" width="46" height="24" rx="3" fill="#0f1923" />
          <rect x="48" y="38" width="42" height="20" rx="2" fill="#1e3a5f" />
          <rect x="50" y="40" width="12" height="8" rx="1" fill="#2563eb" opacity="0.4" />
          <rect x="65" y="40" width="12" height="8" rx="1" fill="#2563eb" opacity="0.4" />
        </svg>
      ),
    },
    PSU: {
      bg: '#fefce8', accent: '#ca8a04',
      svg: (
        <svg viewBox="0 0 100 80" width="65" height="52">
          <rect x="4" y="4" width="92" height="72" rx="6" fill="#1c1917" />
          <rect x="8" y="8" width="84" height="64" rx="4" fill="#292524" />
          <circle cx="30" cy="40" r="20" fill="#1c1917" />
          <circle cx="30" cy="40" r="16" fill="#292524" />
          <circle cx="30" cy="40" r="12" fill="#1c1917" />
          <circle cx="30" cy="40" r="8" fill="#44403c" />
          <circle cx="30" cy="40" r="4" fill="#78716c" />
          {[0,60,120,180,240,300].map((angle, i) => {
            const rad = angle * Math.PI / 180;
            return <line key={i} x1={30 + 9*Math.cos(rad)} y1={40 + 9*Math.sin(rad)} x2={30 + 15*Math.cos(rad)} y2={40 + 15*Math.sin(rad)} stroke="#eab308" strokeWidth="2" opacity="0.6" />;
          })}
          {[14,26,38,50].map((y, i) => (
            <rect key={i} x="58" y={y} width="28" height="8" rx="2" fill="#374151" />
          ))}
          <rect x="58" y="62" width="12" height="6" rx="2" fill="#eab308" opacity="0.6" />
          <rect x="74" y="62" width="12" height="6" rx="2" fill="#ef4444" opacity="0.6" />
        </svg>
      ),
    },
  };

  const { bg, accent, svg } = cfg[category] || cfg.SMARTPHONE;

  const brandColor = {
    'Apple': '#555', 'Samsung': '#1428a0', 'Xiaomi': '#ff6900',
    'POCO': '#ffcd06', 'OPPO': '#1d7aff', 'Realme': '#ffc400',
    'Vivo': '#415fff', 'Google': '#4285f4', 'OnePlus': '#f5010c',
    'Nothing': '#000', 'Huawei': '#cf0a2c', 'Sony': '#00439c',
    'Motorola': '#5c88da', 'Nokia': '#124191', 'Tecno': '#1d49b8',
    'Infinix': '#ef4e23', 'NVIDIA': '#76b900', 'AMD': '#ed1c24',
    'Intel': '#0071c5', 'Corsair': '#ffd200', 'G.Skill': '#ff0000',
    'Kingston': '#e30613', 'Crucial': '#006400', 'TeamGroup': '#1e90ff',
    'WD': '#0066cc', 'Seagate': '#00ae42',
    'ASUS': '#00539b', 'MSI': '#e4002b', 'Gigabyte': '#e31837',
    'ASRock': '#b31b1b', 'Seasonic': '#f5a623', 'be quiet!': '#1a1a1a',
    'Thermaltake': '#c0392b', 'EVGA': '#0066cc',
  }[brand] || accent;

  return (
    <div style={{
      width: '100%', height: '100%', background: bg,
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      position: 'relative', overflow: 'hidden',
    }}>
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '3px', background: brandColor }} />
      {svg}
    </div>
  );
};

function DeviceImage({ device, category }) {
  const [urlFailed, setUrlFailed] = useState(false);
  const [localFailed, setLocalFailed] = useState(false);

  useEffect(() => { setUrlFailed(false); setLocalFailed(false); }, [device.name]);

  const imgStyle = {
    width: '100%', height: '100%', objectFit: 'contain',
    padding: '10px', boxSizing: 'border-box', background: '#f8f9ff',
  };

  const urlSrc = device.img || device.image || null;
  const localSrc = device.localImg || null;

  if (urlSrc && !urlFailed)
    return <img src={urlSrc} alt={device.name} onError={() => setUrlFailed(true)} style={imgStyle} />;
  if (localSrc && !localFailed)
    return <img src={localSrc} alt={device.name} onError={() => setLocalFailed(true)} style={imgStyle} />;
  return <CategoryThumbnail category={category} brand={device.brand} name={device.name} />;
}

// ─── Device catalog ───────────────────────────────────────────────────────────
const DEVICE_CATALOG = {
  SMARTPHONE: [
    { name: 'Apple iPhone 16 Pro Max', brand: 'Apple', img: 'https://fdn2.gsmarena.com/vv/bigpic/apple-iphone-16-pro-max.jpg' },
    { name: 'Apple iPhone 16 Pro', brand: 'Apple', img: 'https://fdn2.gsmarena.com/vv/bigpic/apple-iphone-16-pro.jpg' },
    { name: 'Apple iPhone 16 Plus', brand: 'Apple', img: 'https://fdn2.gsmarena.com/vv/bigpic/apple-iphone-16-plus.jpg' },
    { name: 'Apple iPhone 16', brand: 'Apple', img: 'https://fdn2.gsmarena.com/vv/bigpic/apple-iphone-16.jpg' },
    { name: 'Apple iPhone 15 Pro Max', brand: 'Apple', img: 'https://fdn2.gsmarena.com/vv/bigpic/apple-iphone-15-pro-max.jpg' },
    { name: 'Apple iPhone 15 Pro', brand: 'Apple', img: 'https://fdn2.gsmarena.com/vv/bigpic/apple-iphone-15-pro.jpg' },
    { name: 'Apple iPhone 15 Plus', brand: 'Apple', img: 'https://fdn2.gsmarena.com/vv/bigpic/apple-iphone-15-plus.jpg' },
    { name: 'Apple iPhone 15', brand: 'Apple', img: 'https://fdn2.gsmarena.com/vv/bigpic/apple-iphone-15.jpg' },
    { name: 'Apple iPhone 14 Pro Max', brand: 'Apple', img: 'https://fdn2.gsmarena.com/vv/bigpic/apple-iphone-14-pro-max.jpg' },
    { name: 'Apple iPhone 14 Pro', brand: 'Apple', img: 'https://fdn2.gsmarena.com/vv/bigpic/apple-iphone-14-pro.jpg' },
    { name: 'Apple iPhone 14', brand: 'Apple', img: 'https://fdn2.gsmarena.com/vv/bigpic/apple-iphone-14.jpg' },
    { name: 'Apple iPhone 13 Pro Max', brand: 'Apple', img: 'https://fdn2.gsmarena.com/vv/bigpic/apple-iphone-13-pro-max.jpg' },
    { name: 'Apple iPhone 13 Pro', brand: 'Apple', img: 'https://fdn2.gsmarena.com/vv/bigpic/apple-iphone-13-pro.jpg' },
    { name: 'Apple iPhone 13', brand: 'Apple', img: 'https://fdn2.gsmarena.com/vv/bigpic/apple-iphone-13.jpg' },
    { name: 'Apple iPhone 13 Mini', brand: 'Apple', img: 'https://fdn2.gsmarena.com/vv/bigpic/apple-iphone-13-mini.jpg' },
    { name: 'Apple iPhone 12 Pro Max', brand: 'Apple', img: 'https://fdn2.gsmarena.com/vv/bigpic/apple-iphone-12-pro-max.jpg' },
    { name: 'Apple iPhone 12 Pro', brand: 'Apple', img: 'https://fdn2.gsmarena.com/vv/bigpic/apple-iphone-12-pro.jpg' },
    { name: 'Apple iPhone 12', brand: 'Apple', img: 'https://fdn2.gsmarena.com/vv/bigpic/apple-iphone-12.jpg' },
    { name: 'Apple iPhone SE (2022)', brand: 'Apple', img: 'https://fdn2.gsmarena.com/vv/bigpic/apple-iphone-se-2022.jpg' },
    { name: 'Samsung Galaxy S24 Ultra', brand: 'Samsung', img: 'https://fdn2.gsmarena.com/vv/bigpic/samsung-galaxy-s24-ultra-5g.jpg' },
    { name: 'Samsung Galaxy S24+', brand: 'Samsung', img: 'https://fdn2.gsmarena.com/vv/bigpic/samsung-galaxy-s24plus-5g.jpg' },
    { name: 'Samsung Galaxy S24', brand: 'Samsung', img: 'https://fdn2.gsmarena.com/vv/bigpic/samsung-galaxy-s24-5g.jpg' },
    { name: 'Samsung Galaxy S23 Ultra', brand: 'Samsung', img: 'https://fdn2.gsmarena.com/vv/bigpic/samsung-galaxy-s23-ultra-5g.jpg' },
    { name: 'Samsung Galaxy S23', brand: 'Samsung', img: 'https://fdn2.gsmarena.com/vv/bigpic/samsung-galaxy-s23-5g.jpg' },
    { name: 'Samsung Galaxy Z Fold 5', brand: 'Samsung', img: 'https://fdn2.gsmarena.com/vv/bigpic/samsung-galaxy-z-fold5.jpg' },
    { name: 'Samsung Galaxy Z Flip 5', brand: 'Samsung', img: 'https://fdn2.gsmarena.com/vv/bigpic/samsung-galaxy-z-flip5.jpg' },
    { name: 'Samsung Galaxy A55', brand: 'Samsung', img: 'https://fdn2.gsmarena.com/vv/bigpic/samsung-galaxy-a55.jpg' },
    { name: 'Samsung Galaxy A35', brand: 'Samsung', img: 'https://fdn2.gsmarena.com/vv/bigpic/samsung-galaxy-a35.jpg' },
    { name: 'Samsung Galaxy A15', brand: 'Samsung', img: 'https://fdn2.gsmarena.com/vv/bigpic/samsung-galaxy-a15.jpg' },
    { name: 'Xiaomi 14 Ultra', brand: 'Xiaomi', img: 'https://fdn2.gsmarena.com/vv/bigpic/xiaomi-14-ultra.jpg' },
    { name: 'Xiaomi 14', brand: 'Xiaomi', img: 'https://fdn2.gsmarena.com/vv/bigpic/xiaomi-14.jpg' },
    { name: 'Xiaomi Redmi Note 13 Pro+', brand: 'Xiaomi', img: 'https://fdn2.gsmarena.com/vv/bigpic/xiaomi-redmi-note-13-pro-plus.jpg' },
    { name: 'Xiaomi Redmi Note 13 Pro', brand: 'Xiaomi', img: 'https://fdn2.gsmarena.com/vv/bigpic/xiaomi-redmi-note-13-pro.jpg' },
    { name: 'Xiaomi Redmi Note 13', brand: 'Xiaomi', img: 'https://fdn2.gsmarena.com/vv/bigpic/xiaomi-redmi-note-13.jpg' },
    { name: 'POCO F6 Pro', brand: 'POCO', img: 'https://fdn2.gsmarena.com/vv/bigpic/poco-f6-pro.jpg' },
    { name: 'POCO X6 Pro', brand: 'POCO', img: 'https://fdn2.gsmarena.com/vv/bigpic/poco-x6-pro.jpg' },
    { name: 'Google Pixel 9 Pro XL', brand: 'Google', img: 'https://fdn2.gsmarena.com/vv/bigpic/google-pixel-9-pro-xl.jpg' },
    { name: 'Google Pixel 9 Pro', brand: 'Google', img: 'https://fdn2.gsmarena.com/vv/bigpic/google-pixel-9-pro.jpg' },
    { name: 'Google Pixel 9', brand: 'Google', img: 'https://fdn2.gsmarena.com/vv/bigpic/google-pixel-9.jpg' },
    { name: 'OnePlus 12', brand: 'OnePlus', img: 'https://fdn2.gsmarena.com/vv/bigpic/oneplus-12.jpg' },
    { name: 'Nothing Phone (2a)', brand: 'Nothing', img: 'https://fdn2.gsmarena.com/vv/bigpic/nothing-phone-2a-.jpg' },
    { name: 'Sony Xperia 1 VI', brand: 'Sony', img: 'https://fdn2.gsmarena.com/vv/bigpic/sony-xperia-1-vi.jpg' },
    { name: 'Motorola Edge 50 Ultra', brand: 'Motorola', img: 'https://fdn2.gsmarena.com/vv/bigpic/motorola-edge-50-ultra.jpg' },
  ],
  GPU: [
    { name: 'NVIDIA GeForce RTX 4090', brand: 'NVIDIA', localImg: '/images/gpu-nvidia-rtx-4090.png' },
    { name: 'NVIDIA GeForce RTX 4080 Super', brand: 'NVIDIA', localImg: '/images/gpu-nvidia-rtx-4080-super.png' },
    { name: 'NVIDIA GeForce RTX 4080', brand: 'NVIDIA', localImg: '/images/gpu-nvidia-rtx-4080.png' },
    { name: 'NVIDIA GeForce RTX 4070 Ti Super', brand: 'NVIDIA', localImg: '/images/gpu-nvidia-rtx-4070ti-super.png' },
    { name: 'NVIDIA GeForce RTX 4070 Super', brand: 'NVIDIA', localImg: '/images/gpu-nvidia-rtx-4070-super.png' },
    { name: 'NVIDIA GeForce RTX 4070', brand: 'NVIDIA', localImg: '/images/gpu-nvidia-rtx-4070.png' },
    { name: 'NVIDIA GeForce RTX 4060 Ti', brand: 'NVIDIA', localImg: '/images/gpu-nvidia-rtx-4060ti.png' },
    { name: 'NVIDIA GeForce RTX 4060', brand: 'NVIDIA', localImg: '/images/gpu-nvidia-rtx-4060.png' },
    { name: 'NVIDIA GeForce RTX 3080', brand: 'NVIDIA', localImg: '/images/gpu-nvidia-rtx-3080.png' },
    { name: 'NVIDIA GeForce RTX 3070', brand: 'NVIDIA', localImg: '/images/gpu-nvidia-rtx-3070.png' },
    { name: 'NVIDIA GeForce RTX 3060 12GB', brand: 'NVIDIA', localImg: '/images/gpu-nvidia-rtx-3060.png' },
    { name: 'AMD Radeon RX 7900 XTX', brand: 'AMD', localImg: '/images/gpu-amd-rx-7900xtx.png' },
    { name: 'AMD Radeon RX 7800 XT', brand: 'AMD', localImg: '/images/gpu-amd-rx-7800xt.png' },
    { name: 'AMD Radeon RX 7600', brand: 'AMD', localImg: '/images/gpu-amd-rx-7600.png' },
    { name: 'Intel Arc A770 16GB', brand: 'Intel', localImg: '/images/gpu-intel-arc-a770.png' },
  ],
  CPU: [
    { name: 'Intel Core i9-14900K', brand: 'Intel', localImg: '/images/cpu-intel-i9-14900k.png' },
    { name: 'Intel Core i7-14700K', brand: 'Intel', localImg: '/images/cpu-intel-i7-14700k.png' },
    { name: 'Intel Core i5-14600K', brand: 'Intel', localImg: '/images/cpu-intel-i5-14600k.png' },
    { name: 'Intel Core i5-14400F', brand: 'Intel', localImg: '/images/cpu-intel-i5-14600k.png' },
    { name: 'Intel Core i3-14100F', brand: 'Intel', localImg: '/images/cpu-intel-i3-13100.png' },
    { name: 'AMD Ryzen 9 7950X', brand: 'AMD', localImg: '/images/cpu-amd-ryzen9-7950x.png' },
    { name: 'AMD Ryzen 7 7800X3D', brand: 'AMD', localImg: '/images/cpu-amd-ryzen7-7800x3d.png' },
    { name: 'AMD Ryzen 5 7600X', brand: 'AMD', localImg: '/images/cpu-amd-ryzen5-7600x.png' },
    { name: 'AMD Ryzen 7 5800X3D', brand: 'AMD', localImg: '/images/cpu-amd-ryzen7-7800x3d.png' },
    { name: 'AMD Ryzen 5 5600X', brand: 'AMD', localImg: '/images/cpu-amd-ryzen5-5600x.png' },
    { name: 'AMD Ryzen 5 5600', brand: 'AMD', localImg: '/images/cpu-amd-ryzen5-5600x.png' },
  ],
  RAM: [
    { name: 'Corsair Vengeance DDR5 6000MHz', brand: 'Corsair', localImg: '/images/ram-corsair-vengeance-ddr5-32gb.png' },
    { name: 'Corsair Vengeance LPX DDR4 3200', brand: 'Corsair', localImg: '/images/ram-corsair-lpx-ddr4-32gb.png' },
    { name: 'G.Skill Trident Z5 RGB DDR5 6000', brand: 'G.Skill', localImg: '/images/ram-gskill-tridentz5-32gb.png' },
    { name: 'G.Skill Ripjaws V DDR4 3600', brand: 'G.Skill', localImg: '/images/ram-gskill-ripjaws-ddr4-16gb.png' },
    { name: 'Kingston Fury Beast DDR5 6000', brand: 'Kingston', localImg: '/images/ram-kingston-fury-ddr5-32gb.png' },
    { name: 'Kingston Fury Beast DDR4 3600', brand: 'Kingston', localImg: '/images/ram-kingston-fury-ddr4-32gb.png' },
  ],
  SSD: [
    { name: 'Samsung 990 Pro 2TB NVMe', brand: 'Samsung', localImg: '/images/ssd-samsung-990pro-2tb.png' },
    { name: 'WD Black SN850X 2TB NVMe', brand: 'WD', localImg: '/images/ssd-wd-sn850x-2tb.png' },
    { name: 'Kingston NV2 NVMe 1TB', brand: 'Kingston', localImg: '/images/ssd-kingston-nv2-1tb.png' },
    { name: 'Crucial MX500 1TB SATA', brand: 'Crucial', localImg: '/images/ssd-crucial-mx500-2tb.png' },
    { name: 'Seagate FireCuda 530 2TB NVMe', brand: 'Seagate', localImg: '/images/ssd-seagate-firecuda530-2tb.png' },
  ],
  MOTHERBOARD: [
    { name: 'ASUS ROG Strix Z790-E Gaming', brand: 'ASUS', localImg: '/images/mb-asus-rog-strix-z790e.png' },
    { name: 'ASUS TUF Gaming Z790-Plus', brand: 'ASUS', localImg: '/images/mb-asus-rog-strix-z790e.png' },
    { name: 'MSI MAG Z790 Tomahawk', brand: 'MSI', localImg: '/images/mb-msi-mag-z790-tomahawk.png' },
    { name: 'Gigabyte B650 Aorus Elite AX', brand: 'Gigabyte', localImg: '/images/mb-gigabyte-b650-aorus-elite.png' },
    { name: 'Gigabyte Z790 Aorus Elite AX', brand: 'Gigabyte', localImg: '/images/mb-gigabyte-z790-aorus-elite.png' },
  ],
  PSU: [
    { name: 'Corsair RM1000x 1000W Gold', brand: 'Corsair', localImg: '/images/psu-corsair-rm1000x.png' },
    { name: 'Corsair RM850x 850W Gold', brand: 'Corsair', localImg: '/images/psu-corsair-rm850x.png' },
    { name: 'Corsair RM750x 750W Gold', brand: 'Corsair', localImg: '/images/psu-corsair-rm750x.png' },
    { name: 'Seasonic Focus GX-850 850W Gold', brand: 'Seasonic', localImg: '/images/psu-seasonic-focus-gx-750.png' },
    { name: 'Seasonic Focus GX-750 750W Gold', brand: 'Seasonic', localImg: '/images/psu-seasonic-focus-gx-750.png' },
  ],
};

// ─── Quick actions ─────────────────────────────────────────────────────────────
const QUICK_ACTIONS = {
  SMARTPHONE: [
    { id: 'full_specs', label: '📋 Full Specs & Price' },
    { id: 'camera', label: '📷 Camera Performance' },
    { id: 'battery', label: '🔋 Battery Life' },
    { id: 'gaming', label: '🎮 Gaming Performance' },
    { id: 'vs_competitor', label: '⚖️ Compare with Rivals' },
    { id: 'worth_buying', label: '💰 Worth Buying?' },
  ],
  GPU: [
    { id: 'full_specs', label: '📋 Full Specs & Price' },
    { id: 'gaming_1080p', label: '🎮 Gaming at 1080p' },
    { id: 'gaming_1440p', label: '🖥️ Gaming at 1440p' },
    { id: 'gaming_4k', label: '📺 Gaming at 4K' },
    { id: 'vs_competitor', label: '⚖️ Compare with Rivals' },
    { id: 'worth_buying', label: '💰 Worth Buying?' },
  ],
  CPU: [
    { id: 'full_specs', label: '📋 Full Specs & Price' },
    { id: 'gaming', label: '🎮 Gaming Performance' },
    { id: 'productivity', label: '💼 Productivity / Workload' },
    { id: 'compatible_mb', label: '🔌 Compatible Motherboards' },
    { id: 'vs_competitor', label: '⚖️ Compare with Rivals' },
    { id: 'worth_buying', label: '💰 Worth Buying?' },
  ],
  RAM: [
    { id: 'full_specs', label: '📋 Full Specs & Price' },
    { id: 'compatible', label: '🔌 Compatible Motherboards' },
    { id: 'gaming', label: '🎮 Impact on Gaming' },
    { id: 'vs_competitor', label: '⚖️ Compare with Rivals' },
    { id: 'worth_buying', label: '💰 Worth Buying?' },
  ],
  SSD: [
    { id: 'full_specs', label: '📋 Full Specs & Price' },
    { id: 'read_write', label: '⚡ Read/Write Speeds' },
    { id: 'compatible', label: '🔌 Compatible Systems' },
    { id: 'vs_competitor', label: '⚖️ Compare with Rivals' },
    { id: 'worth_buying', label: '💰 Worth Buying?' },
  ],
  MOTHERBOARD: [
    { id: 'full_specs', label: '📋 Full Specs & Price' },
    { id: 'compatible_cpu', label: '🔌 Compatible CPUs' },
    { id: 'compatible_ram', label: '💾 Compatible RAM' },
    { id: 'features', label: '🛠️ Features & Connectivity' },
    { id: 'vs_competitor', label: '⚖️ Compare with Rivals' },
    { id: 'worth_buying', label: '💰 Worth Buying?' },
  ],
  PSU: [
    { id: 'full_specs', label: '📋 Full Specs & Price' },
    { id: 'efficiency', label: '⚡ Efficiency & 80 PLUS' },
    { id: 'compatible', label: '🔌 Compatible Builds' },
    { id: 'vs_competitor', label: '⚖️ Compare with Rivals' },
    { id: 'worth_buying', label: '💰 Worth Buying?' },
  ],
};

function getQuickActionQuery(questionId, deviceName) {
  const map = {
    full_specs: `Give me the full specs, Philippine Peso price, and where to buy the ${deviceName} in 2025.`,
    camera: `How good is the camera on the ${deviceName}? Include photo and video quality details.`,
    battery: `What is the battery life like on the ${deviceName}? Include charging speed.`,
    gaming: `How does the ${deviceName} perform for gaming? Include benchmarks or FPS estimates if possible.`,
    gaming_1080p: `How does the ${deviceName} perform at 1080p gaming? Include average FPS on popular games.`,
    gaming_1440p: `How does the ${deviceName} perform at 1440p gaming? Include average FPS on popular games.`,
    gaming_4k: `How does the ${deviceName} perform at 4K gaming?`,
    productivity: `How does the ${deviceName} perform for productivity tasks like video editing, rendering, and multitasking?`,
    compatible_mb: `Which motherboards are compatible with the ${deviceName}? List specific models available in the Philippines.`,
    compatible_cpu: `Which CPUs are compatible with the ${deviceName} motherboard?`,
    compatible_ram: `What RAM type, speed, and capacity does the ${deviceName} support?`,
    compatible: `What systems or components is the ${deviceName} compatible with?`,
    read_write: `What are the read and write speeds of the ${deviceName}? How does it compare to other SSDs?`,
    features: `What are the key features and connectivity options of the ${deviceName}?`,
    efficiency: `What is the efficiency rating and 80 PLUS certification of the ${deviceName}? How efficient is it?`,
    vs_competitor: `Compare the ${deviceName} against its main competitors in the same price range in the Philippines.`,
    worth_buying: `Is the ${deviceName} worth buying in the Philippines in 2025? Give pros, cons, and a final verdict.`,
  };
  return map[questionId] || `Tell me more about the ${deviceName}.`;
}

// ─── Wizard steps ─────────────────────────────────────────────────────────────
const SMARTPHONE_STEPS = [
  {
    id: 'notch', question: 'What is at the top of the screen?',
    subtitle: 'Turn the phone on and look at the very top of the display.',
    options: [
      { id: 'notch', label: 'Wide black bar (notch)' },
      { id: 'punch_hole', label: 'Small punch hole dot' },
      { id: 'dynamic_island', label: 'Pill shape (Dynamic Island)' },
      { id: 'full_screen', label: 'No cutout — full screen' },
      { id: 'not_sure', label: 'Not sure' },
    ],
    skipLabel: 'Skip this question',
  },
  {
    id: 'color', question: 'What color is the phone?',
    subtitle: 'Pick the closest color to the phone back cover.',
    options: [
      { id: 'black', label: 'Black or Dark' }, { id: 'white', label: 'White or Light' },
      { id: 'blue', label: 'Blue' }, { id: 'green', label: 'Green' },
      { id: 'purple', label: 'Purple / Lavender' }, { id: 'gold', label: 'Gold or Beige' },
      { id: 'other', label: 'Other' }, { id: 'not_sure', label: 'Not sure' },
    ],
    skipLabel: 'Skip this question',
  },
];

const PC_STEPS = [
  {
    id: 'part_type', question: 'What type of PC part is this?',
    subtitle: 'Select the category that best matches the component.',
    options: [
      { id: 'GPU', label: 'GPU (Graphics Card)' }, { id: 'CPU', label: 'CPU (Processor)' },
      { id: 'RAM', label: 'RAM (Memory)' }, { id: 'SSD', label: 'SSD / NVMe Storage' },
      { id: 'MOTHERBOARD', label: 'Motherboard' }, { id: 'PSU', label: 'PSU (Power Supply)' },
      { id: 'not_sure', label: 'Not sure' },
    ],
    skipLabel: 'Skip — just use AI guess',
  },
  {
    id: 'brand', question: 'What brand is it?',
    subtitle: 'Pick the brand shown on the component or its sticker.',
    options: [
      { id: 'NVIDIA', label: 'NVIDIA' }, { id: 'AMD', label: 'AMD' }, { id: 'Intel', label: 'Intel' },
      { id: 'Corsair', label: 'Corsair' }, { id: 'Kingston', label: 'Kingston' },
      { id: 'ASUS', label: 'ASUS' }, { id: 'MSI', label: 'MSI' }, { id: 'Gigabyte', label: 'Gigabyte' },
      { id: 'ASRock', label: 'ASRock' }, { id: 'Seasonic', label: 'Seasonic' },
      { id: 'G.Skill', label: 'G.Skill' }, { id: 'Crucial', label: 'Crucial' },
      { id: 'WD', label: 'WD (Western Digital)' }, { id: 'other', label: 'Other' },
      { id: 'not_sure', label: 'Not sure' },
    ],
    skipLabel: 'Skip this question',
  },
];

// ─── Message renderer ─────────────────────────────────────────────────────────
function renderMessage(content) {
  if (!content) return null;
  return content.split('\n').map((line, i) => {
    if (line.startsWith('**') && line.endsWith('**'))
      return <strong key={i} style={{ display: 'block', marginBottom: '4px' }}>{line.slice(2, -2)}</strong>;
    if (line.startsWith('• ') || line.startsWith('- '))
      return <div key={i} style={{ paddingLeft: '12px', marginBottom: '2px' }}>• {line.slice(2)}</div>;
    const emojiStart = ['🥇','🥈','🥉','✅','❌','⚠️','📱','📷','💡','🎮','🖥️','🧠','💾','⚡','🔌','💰','🛒','🏗️','📡','❄️','📋','⚙️','🔋','🚀','🔥','⏱️','🛡️','🔧','📐','🔊','📎'];
    if (emojiStart.some(e => line.startsWith(e)))
      return <div key={i} style={{ marginBottom: '4px' }}>{line}</div>;
    if (line === '') return <div key={i} style={{ marginBottom: '8px' }} />;
    return <div key={i} style={{ whiteSpace: 'pre-wrap' }}>{line}</div>;
  });
}

function StreamingCursor() {
  return (
    <span style={{
      display: 'inline-block', width: '2px', height: '14px',
      background: 'var(--accent)', marginLeft: '2px',
      verticalAlign: 'middle', animation: 'blink 0.8s step-end infinite',
    }} />
  );
}

// ─── Catalog modal ────────────────────────────────────────────────────────────
const CATALOG_TABS = ['SMARTPHONE', 'GPU', 'CPU', 'RAM', 'SSD', 'MOTHERBOARD', 'PSU'];
const TAB_LABELS = {
  SMARTPHONE: '📱 Phones', GPU: '🎮 GPU', CPU: '🧠 CPU',
  RAM: '💾 RAM', SSD: '💿 SSD', MOTHERBOARD: '🔌 Motherboard', PSU: '⚡ PSU',
};

function CatalogModal({ initialCategory, onSelect, onClose }) {
  const [activeTab, setActiveTab] = useState(initialCategory || 'SMARTPHONE');
  const [search, setSearch] = useState('');
  const items = (DEVICE_CATALOG[activeTab] || []).filter(d =>
    !search || d.name.toLowerCase().includes(search.toLowerCase()) || d.brand.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 1000, background: 'rgba(0,0,0,0.85)', display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }} onClick={onClose}>
      <div style={{ background: 'var(--bg-1)', borderRadius: '20px 20px 0 0', width: '100%', maxWidth: '820px', maxHeight: '88vh', display: 'flex', flexDirection: 'column', overflow: 'hidden' }} onClick={e => e.stopPropagation()}>
        <div style={{ padding: '16px 20px 0', borderBottom: '1px solid var(--border)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
            <div style={{ fontFamily: 'Syne, sans-serif', fontWeight: 800, fontSize: '16px', color: 'var(--text)' }}>📦 Device Catalog</div>
            <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--text-3)', cursor: 'pointer', fontSize: '22px', lineHeight: 1, padding: '0 4px' }}>×</button>
          </div>
          <div style={{ position: 'relative', marginBottom: '12px' }}>
            <svg style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-3)' }} width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search models..."
              style={{ width: '100%', background: 'var(--bg-3)', border: '1px solid var(--border)', borderRadius: '10px', padding: '8px 12px 8px 30px', fontSize: '13px', color: 'var(--text)', fontFamily: 'inherit', boxSizing: 'border-box', outline: 'none' }} autoFocus />
          </div>
          <div style={{ display: 'flex', gap: '6px', overflowX: 'auto', paddingBottom: '12px' }}>
            {CATALOG_TABS.map(tab => (
              <button key={tab} onClick={() => { setActiveTab(tab); setSearch(''); }}
                style={{ flexShrink: 0, background: activeTab === tab ? 'var(--accent)' : 'var(--bg-3)', border: 'none', borderRadius: '20px', padding: '5px 12px', fontSize: '11px', fontWeight: 600, color: activeTab === tab ? 'white' : 'var(--text-3)', cursor: 'pointer', transition: 'all 0.15s', fontFamily: 'inherit' }}>
                {TAB_LABELS[tab]}
              </button>
            ))}
          </div>
        </div>
        <div style={{ flex: 1, overflowY: 'auto', padding: '16px 20px' }}>
          {items.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-3)', fontSize: '14px' }}>No results found</div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: '12px' }}>
              {items.map((device, i) => (
                <button key={i} onClick={() => onSelect(device.name)}
                  style={{ background: 'var(--bg-2)', border: '1px solid var(--border)', borderRadius: '12px', padding: 0, cursor: 'pointer', overflow: 'hidden', transition: 'all 0.15s', textAlign: 'left' }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--accent)'; e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 4px 16px rgba(99,102,241,0.2)'; }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = 'none'; }}>
                  <div style={{ width: '100%', aspectRatio: '1', overflow: 'hidden', position: 'relative' }}>
                    <DeviceImage device={device} category={activeTab} />
                  </div>
                  <div style={{ padding: '8px 10px 10px' }}>
                    <div style={{ fontSize: '10px', color: 'var(--accent)', fontWeight: 600, marginBottom: '2px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{device.brand}</div>
                    <div style={{ fontSize: '12px', color: 'var(--text)', fontWeight: 600, lineHeight: 1.3 }}>{device.name.replace(device.brand + ' ', '')}</div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
        <div style={{ padding: '12px 20px', borderTop: '1px solid var(--border)', display: 'flex', justifyContent: 'center' }}>
          <button onClick={onClose} style={{ background: 'var(--bg-3)', border: '1px solid var(--border)', borderRadius: '10px', padding: '10px 32px', fontSize: '13px', color: 'var(--text)', cursor: 'pointer', fontFamily: 'inherit' }}>Cancel</button>
        </div>
      </div>
    </div>
  );
}

// ─── UI cards ─────────────────────────────────────────────────────────────────
// ─── Helper: find a device entry from catalog by name ─────────────────────────
function findCatalogDevice(name) {
  if (!name) return null;
  const lower = name.toLowerCase();
  for (const items of Object.values(DEVICE_CATALOG)) {
    const found = items.find(d => d.name.toLowerCase() === lower ||
      lower.includes(d.name.toLowerCase()) ||
      d.name.toLowerCase().includes(lower));
    if (found) return found;
  }
  return null;
}

// ─── Device option button with image ─────────────────────────────────────────
function DeviceOptionButton({ name, isPrimary, category, onClick }) {
  const catalogDevice = findCatalogDevice(name);
  const brand = name?.split(' ')[0] || '';
  const imgSrc = catalogDevice?.img || catalogDevice?.localImg || null;
  const [imgFailed, setImgFailed] = useState(false);

  return (
    <button
      onClick={onClick}
      style={{
        background: isPrimary ? 'var(--accent)' : 'var(--bg-3)',
        border: isPrimary ? '2px solid var(--accent)' : '1px solid var(--border)',
        borderRadius: '12px',
        padding: '0',
        cursor: 'pointer',
        textAlign: 'left',
        transition: 'all 0.15s',
        overflow: 'hidden',
        display: 'flex',
        alignItems: 'center',
        gap: '0',
        width: '100%',
      }}
      onMouseEnter={e => {
        if (!isPrimary) {
          e.currentTarget.style.borderColor = 'var(--accent)';
          e.currentTarget.style.background = 'var(--bg-2)';
        }
        e.currentTarget.style.transform = 'translateY(-1px)';
        e.currentTarget.style.boxShadow = '0 4px 16px rgba(99,102,241,0.2)';
      }}
      onMouseLeave={e => {
        if (!isPrimary) {
          e.currentTarget.style.borderColor = 'var(--border)';
          e.currentTarget.style.background = 'var(--bg-3)';
        }
        e.currentTarget.style.transform = 'none';
        e.currentTarget.style.boxShadow = 'none';
      }}
    >
      {/* Device image thumbnail */}
      <div style={{
        width: '72px', height: '72px', flexShrink: 0,
        background: isPrimary ? 'rgba(255,255,255,0.15)' : 'var(--bg-2)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        overflow: 'hidden', borderRight: isPrimary ? '1px solid rgba(255,255,255,0.2)' : '1px solid var(--border)',
      }}>
        {imgSrc && !imgFailed ? (
          <img
            src={imgSrc}
            alt={name}
            onError={() => setImgFailed(true)}
            style={{ width: '100%', height: '100%', objectFit: 'contain', padding: '6px', boxSizing: 'border-box' }}
          />
        ) : (
          <CategoryThumbnail category={category || 'SMARTPHONE'} brand={brand} />
        )}
      </div>
      {/* Device name */}
      <div style={{ padding: '10px 14px', flex: 1 }}>
        {isPrimary && (
          <div style={{ fontSize: '10px', color: 'rgba(255,255,255,0.7)', fontWeight: 600, marginBottom: '3px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            Best match
          </div>
        )}
        <div style={{
          fontSize: isPrimary ? '15px' : '14px',
          color: isPrimary ? 'white' : 'var(--text)',
          fontWeight: isPrimary ? 700 : 500,
          fontFamily: isPrimary ? 'Syne, sans-serif' : 'inherit',
          lineHeight: 1.3,
        }}>
          {name}
        </div>
      </div>
      {/* Arrow */}
      <div style={{ paddingRight: '14px', color: isPrimary ? 'rgba(255,255,255,0.7)' : 'var(--text-3)' }}>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="m9 18 6-6-6-6"/></svg>
      </div>
    </button>
  );
}

function ConfirmDeviceCard({ displayName, alt1, alt2, category, confidence, onConfirm, onHelpIdentify, onUploadAgain, onSeeMore }) {
  const isHigh = confidence === 'HIGH';
  return (
    <div style={{ background: 'var(--bg-2)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', overflow: 'hidden', marginTop: '4px' }}>
      <div style={{ padding: '16px 18px 12px' }}>
        <div style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text)', marginBottom: '2px', fontFamily: 'Syne, sans-serif' }}>
          {isHigh ? 'Is this your device?' : 'Which device is this?'}
        </div>
        <div style={{ fontSize: '12px', color: 'var(--text-3)', marginBottom: '14px' }}>
          {isHigh ? "We're confident this is the right match. Tap to confirm." : "Tap the correct model to get full specs."}
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <DeviceOptionButton name={displayName} isPrimary={true} category={category} onClick={() => onConfirm(displayName)} />
          {alt1 && alt1 !== 'null' && (
            <DeviceOptionButton name={alt1} isPrimary={false} category={category} onClick={() => onConfirm(alt1)} />
          )}
          {alt2 && alt2 !== 'null' && (
            <DeviceOptionButton name={alt2} isPrimary={false} category={category} onClick={() => onConfirm(alt2)} />
          )}
          <button onClick={onSeeMore} style={{ background: 'none', border: '1px dashed var(--border)', borderRadius: '10px', padding: '10px 16px', fontSize: '13px', color: 'var(--accent)', cursor: 'pointer', textAlign: 'center', fontFamily: 'inherit', fontWeight: 600 }}>📦 See More Models</button>
        </div>
      </div>
      <div style={{ borderTop: '1px solid var(--border)', padding: '10px 18px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
        <div style={{ fontSize: '11px', color: 'var(--text-3)', marginBottom: '2px' }}>Not listed above?</div>
        <button onClick={onHelpIdentify} style={{ background: 'var(--bg-3)', border: '1px solid var(--border)', borderRadius: '10px', padding: '11px 16px', fontSize: '13px', color: 'var(--text)', cursor: 'pointer', fontFamily: 'inherit' }}>Help me identify it</button>
        <button onClick={onUploadAgain} style={{ background: 'none', border: '1px solid var(--border)', borderRadius: '10px', padding: '11px 16px', fontSize: '13px', color: 'var(--text-3)', cursor: 'pointer', fontFamily: 'inherit', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
          Upload Again
        </button>
      </div>
    </div>
  );
}

function WizardStepCard({ step, onSelect, onSkip }) {
  return (
    <div style={{ background: 'var(--bg-2)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', overflow: 'hidden', marginTop: '4px' }}>
      <div style={{ padding: '16px 18px 12px' }}>
        <div style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text)', marginBottom: '4px', fontFamily: 'Syne, sans-serif' }}>{step.question}</div>
        {step.subtitle && <div style={{ fontSize: '12px', color: 'var(--text-3)', marginBottom: '14px' }}>{step.subtitle}</div>}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {step.options.map(opt => (
            <button key={opt.id} onClick={() => onSelect(opt.id, opt.label)}
              style={{ background: 'var(--bg-3)', border: '1px solid var(--border)', borderRadius: '10px', padding: '12px 16px', fontSize: '14px', color: 'var(--text)', cursor: 'pointer', textAlign: 'left', transition: 'all 0.15s', fontFamily: 'inherit', fontWeight: 500 }}
              onMouseEnter={e => { e.currentTarget.style.background = 'var(--accent)'; e.currentTarget.style.color = 'white'; e.currentTarget.style.borderColor = 'var(--accent)'; }}
              onMouseLeave={e => { e.currentTarget.style.background = 'var(--bg-3)'; e.currentTarget.style.color = 'var(--text)'; e.currentTarget.style.borderColor = 'var(--border)'; }}>
              {opt.label}
            </button>
          ))}
        </div>
      </div>
      {step.skipLabel && (
        <div style={{ borderTop: '1px solid var(--border)', padding: '10px 18px' }}>
          <button onClick={onSkip} style={{ background: 'none', border: 'none', color: 'var(--text-3)', fontSize: '13px', cursor: 'pointer', fontFamily: 'inherit' }}>{step.skipLabel}</button>
        </div>
      )}
    </div>
  );
}

function RefinedResultsCard({ reasoning, suggestions, onSelect, onTypeMyself, onSeeMore }) {
  return (
    <div style={{ background: 'var(--bg-2)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', overflow: 'hidden', marginTop: '4px' }}>
      <div style={{ padding: '16px 18px 12px' }}>
        <div style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text)', marginBottom: '8px', fontFamily: 'Syne, sans-serif' }}>Based on your answers:</div>
        {reasoning && <div style={{ fontSize: '12px', color: 'var(--text-3)', marginBottom: '14px', lineHeight: 1.6 }}>{reasoning}</div>}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {suggestions.map((s, i) => (
            <button key={i} onClick={() => onSelect(s)}
              style={{ background: i === 0 ? 'var(--accent)' : 'var(--bg-3)', border: i === 0 ? 'none' : '1px solid var(--border)', borderRadius: '10px', padding: '13px 16px', fontSize: i === 0 ? '15px' : '14px', color: i === 0 ? 'white' : 'var(--text)', cursor: 'pointer', textAlign: 'center', fontFamily: i === 0 ? 'Syne, sans-serif' : 'inherit', fontWeight: i === 0 ? 700 : 500 }}>
              {s}
            </button>
          ))}
          <button onClick={onSeeMore} style={{ background: 'none', border: '1px dashed var(--border)', borderRadius: '10px', padding: '10px 16px', fontSize: '13px', color: 'var(--accent)', cursor: 'pointer', textAlign: 'center', fontFamily: 'inherit', fontWeight: 600 }}>📦 See More Models</button>
        </div>
      </div>
      <div style={{ borderTop: '1px solid var(--border)', padding: '10px 18px' }}>
        <button onClick={onTypeMyself} style={{ background: 'var(--bg-3)', border: '1px solid var(--border)', borderRadius: '10px', padding: '11px 16px', fontSize: '13px', color: 'var(--text)', cursor: 'pointer', fontFamily: 'inherit', width: '100%' }}>Type it myself</button>
      </div>
    </div>
  );
}

function QuickActionCard({ deviceName, category, onSelect }) {
  const actions = QUICK_ACTIONS[category] || [];
  if (!actions.length) return null;
  return (
    <div style={{ background: 'var(--bg-2)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: '14px 16px', marginTop: '4px' }}>
      <div style={{ fontSize: '12px', color: 'var(--text-3)', marginBottom: '10px', fontWeight: 600 }}>
        What would you like to know about the <span style={{ color: 'var(--accent)' }}>{deviceName}</span>?
      </div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
        {actions.map(q => (
          <button key={q.id} onClick={() => onSelect(q.id)}
            style={{ background: 'var(--bg-3)', border: '1px solid var(--border)', borderRadius: '20px', padding: '6px 14px', fontSize: '12px', color: 'var(--text)', cursor: 'pointer', transition: 'all 0.15s', fontFamily: 'inherit' }}
            onMouseEnter={e => { e.currentTarget.style.background = 'var(--accent)'; e.currentTarget.style.color = 'white'; e.currentTarget.style.borderColor = 'var(--accent)'; }}
            onMouseLeave={e => { e.currentTarget.style.background = 'var(--bg-3)'; e.currentTarget.style.color = 'var(--text)'; e.currentTarget.style.borderColor = 'var(--border)'; }}>
            {q.label}
          </button>
        ))}
      </div>
    </div>
  );
}

// ─── Main ChatPage component ──────────────────────────────────────────────────
export default function ChatPage({ onLogout }) {
  const { id } = useParams();
  const navigate = useNavigate();
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);
  const [uploadedFile, setUploadedFile] = useState(null);
  const [uploadedPreview, setUploadedPreview] = useState(null);
  const [modelStatus, setModelStatus] = useState('');
  const [pendingAutoSend, setPendingAutoSend] = useState(null);
  const [wizardState, setWizardState] = useState(null);
  const [catalogOpen, setCatalogOpen] = useState(false);
  const [catalogCategory, setCatalogCategory] = useState('SMARTPHONE');

  const messagesEndRef = useRef();
  const fileRef = useRef();
  const inputRef = useRef();
  const cancelStreamRef = useRef(null);
  const streamingMsgIdRef = useRef(null);
  const savedChatIdRef = useRef(null);

  // ── Load chat history or pending message ──────────────────────────────────
  useEffect(() => {
    const loadHistory = async () => {
      if (id) {
        try {
          const token = localStorage.getItem('token');
          const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/history`, {
            headers: { Authorization: `Bearer ${token}` },
          });
          const data = await res.json();
          const historyItem = data.history?.find(h => h.id === parseInt(id));
          if (historyItem?.messages?.length) {
            savedChatIdRef.current = historyItem.id;
            setMessages(historyItem.messages.map(m => ({ ...m, id: Math.random() })));
            return;
          }
        } catch (err) { console.warn('Could not load history:', err); }
      }

      const pending = sessionStorage.getItem('pendingMessage');
      if (pending) {
        sessionStorage.removeItem('pendingMessage');
        const { content, imageData, imageMime } = JSON.parse(pending);
        setMessages([{ id: 0, role: 'assistant', content: WELCOME_MESSAGE }]);
        if (imageData) {
          setTimeout(() => sendMessage(content || 'What is this hardware? Identify it and give full specs.', imageData, imageMime || 'image/jpeg'), 300);
        } else if (content) {
          setPendingAutoSend(content);
        }
        return;
      }

      setMessages([{ id: 0, role: 'assistant', content: WELCOME_MESSAGE }]);
    };
    loadHistory();
  }, [id]); // eslint-disable-line

  const WELCOME_MESSAGE = "👋 Hi! I'm SpecSmart AI, your specialized tech advisor for the Philippine market.\n\nI can help with:\n• PC Components (CPU, GPU, RAM, Storage, Motherboards, PSU)\n• Smartphones\n• Laptops\n\nAsk me anything, or upload a hardware image for AI identification! Prices are in Philippine Peso (₱).";

  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages, wizardState]);
  useEffect(() => { return () => { if (cancelStreamRef.current) cancelStreamRef.current(); }; }, []);

  // ── Confirm device and fetch specs ────────────────────────────────────────
  const confirmDevice = useCallback(async (deviceName, category) => {
    setWizardState(null);
    setCatalogOpen(false);
    setIsLoading(true);
    setMessages(prev => [...prev, { id: Date.now(), role: 'user', content: `✅ That's the ${deviceName}` }]);

    try {
      const token = localStorage.getItem('token');
      const API_BASE = import.meta.env.DEV ? 'http://localhost:5000' : 'https://specsmart-production.up.railway.app';
      const res = await fetch(`${API_BASE}/api/ai/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...(token && { Authorization: `Bearer ${token}` }) },
        body: JSON.stringify({
          messages: [{
            role: 'user',
            content: `I confirmed this device: ${deviceName}.\n\nProvide full specs, Philippine price (PHP, as of 2025), where to buy in the Philippines, and a brief verdict. Plain language, no markdown symbols.`,
          }],
        }),
      });
      const data = await res.json();
      setMessages(prev => [...prev, { id: Date.now() + 1, role: 'assistant', content: data.content || 'Could not fetch specs.' }]);
      setIsLoading(false);
      const cat = category?.toUpperCase();
      if (QUICK_ACTIONS[cat]) setWizardState({ phase: 'quick_actions', deviceName, category: cat });
    } catch {
      setIsLoading(false);
      setMessages(prev => [...prev, { id: Date.now() + 1, role: 'assistant', content: '⚠️ Could not fetch specs. Please try again.' }]);
    }
  }, []);

  // ── Wizard ────────────────────────────────────────────────────────────────
  const startWizard = useCallback((scanResult, category) => {
    const steps = category === 'SMARTPHONE' ? SMARTPHONE_STEPS : PC_STEPS;
    setWizardState({ phase: 'steps', scanResult, category, steps, stepIndex: 0, answers: {} });
  }, []);

  const handleWizardOption = useCallback((optionId, optionLabel) => {
    setWizardState(prev => {
      if (!prev || prev.phase !== 'steps') return prev;
      const newAnswers = { ...prev.answers, [prev.steps[prev.stepIndex].id]: { id: optionId, label: optionLabel } };
      const nextIndex = prev.stepIndex + 1;
      if (nextIndex < prev.steps.length) return { ...prev, stepIndex: nextIndex, answers: newAnswers };
      return { ...prev, phase: 'refining', answers: newAnswers };
    });
  }, []);

  useEffect(() => {
    if (!wizardState || wizardState.phase !== 'refining') return;
    const { scanResult, category, answers } = wizardState;
    const answerSummary = Object.entries(answers).map(([k, v]) => `${k}: ${v.label}`).join(', ');
    const prompt = category === 'SMARTPHONE'
      ? `A smartphone was scanned. Visual clues: ${answerSummary}. AI identified: "${scanResult.displayName}", alternatives: "${scanResult.alternative1}", "${scanResult.alternative2}". Based on the visual clues, list 3 most likely exact models. Respond ONLY with JSON: { "reasoning": "one sentence", "suggestions": ["Model 1", "Model 2", "Model 3"] }`
      : `A PC component was scanned (AI guess: "${scanResult.displayName}"). Clues: ${answerSummary}. List 3 most likely exact models. Respond ONLY with JSON: { "reasoning": "one sentence", "suggestions": ["Model 1", "Model 2", "Model 3"] }`;

    setIsLoading(true);
    const token = localStorage.getItem('token');
    const API_BASE = import.meta.env.DEV ? 'http://localhost:5000' : 'https://specsmart-production.up.railway.app';
    fetch(`${API_BASE}/api/ai/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...(token && { Authorization: `Bearer ${token}` }) },
      body: JSON.stringify({ messages: [{ role: 'user', content: prompt }] }),
    })
      .then(r => r.json())
      .then(data => {
        setIsLoading(false);
        try {
          const parsed = JSON.parse((data.content || '').replace(/```json|```/g, '').trim());
          setWizardState(prev => ({ ...prev, phase: 'refined', reasoning: parsed.reasoning || '', suggestions: parsed.suggestions || [scanResult.displayName] }));
        } catch {
          setWizardState(prev => ({ ...prev, phase: 'refined', reasoning: '', suggestions: [scanResult.displayName, scanResult.alternative1, scanResult.alternative2].filter(Boolean) }));
        }
      })
      .catch(() => {
        setIsLoading(false);
        setWizardState(prev => ({ ...prev, phase: 'refined', reasoning: '', suggestions: [scanResult.displayName] }));
      });
  }, [wizardState?.phase]); // eslint-disable-line

  const handleQuickAction = useCallback((questionId) => {
    if (!wizardState || wizardState.phase !== 'quick_actions') return;
    const query = getQuickActionQuery(questionId, wizardState.deviceName);
    setWizardState(null);
    sendMessage(query);
  }, [wizardState]); // eslint-disable-line

  const openCatalog = useCallback((category) => {
    setCatalogCategory(category || 'SMARTPHONE');
    setCatalogOpen(true);
  }, []);

  // ── Send message ──────────────────────────────────────────────────────────
  const sendMessage = useCallback(async (messageContent, imageData, imageMime) => {
    const textContent = messageContent || input;
    if (!textContent && !imageData) return;
    setWizardState(null);
    setCatalogOpen(false);

    const userMessage = {
      id: Date.now(),
      role: 'user',
      content: textContent,
      image: imageData,
      imageMime: imageMime || 'image/jpeg',
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setUploadedFile(null);
    setUploadedPreview(null);
    if (fileRef.current) fileRef.current.value = '';
    setIsLoading(true);

    try {
      // ── Image analysis path ─────────────────────────────────────────────
      if (imageData) {
        setModelStatus('🔍 Analyzing with Groq Vision AI...');
        let scanResult;
        try {
          scanResult = await analyzeImageWithGroq(imageData, imageMime || 'image/jpeg', textContent);
        } catch (e) {
          throw new Error('Image analysis failed: ' + e.message);
        }
        setModelStatus('');
        setIsLoading(false);

        if (scanResult.isUnsupported) {
          setMessages(prev => [...prev, { id: Date.now() + 1, role: 'assistant', content: scanResult.message }]);
          return;
        }

        // Sanitize ALL model names — strip any "X or Y" combined answers the AI might return
        const sanitizeName = (name) => {
          if (!name || name === 'null') return '';
          return name.includes(' or ') ? name.split(' or ')[0].trim() : name;
        };

        const rawDisplayName = scanResult.displayName || 'Unknown Device';
        const displayName = sanitizeName(rawDisplayName) || rawDisplayName;
        const { category, confidence } = scanResult;

        // Sanitize alternatives — also hide them if confidence is HIGH (no need to show alternatives)
        const rawAlt1 = sanitizeName(scanResult.alternative1 || '');
        const rawAlt2 = sanitizeName(scanResult.alternative2 || '');
        // Don't show alts that are the same as displayName, or if HIGH confidence auto-confirmed
        const alt1 = (rawAlt1 && rawAlt1 !== displayName) ? rawAlt1 : '';
        const alt2 = (rawAlt2 && rawAlt2 !== displayName && rawAlt2 !== rawAlt1) ? rawAlt2 : '';
        const confEmoji = confidence === 'HIGH' ? '🟢' : confidence === 'MEDIUM' ? '🟡' : '🔴';
        const confNote = confidence === 'LOW'
          ? '\n⚠️ Low confidence — please confirm the correct model below.'
          : confidence === 'MEDIUM'
          ? '\n🟡 Medium confidence — please verify with the options below.'
          : '';

        const isSpecDB = scanResult.notes?.includes('Spec DB');

        setMessages(prev => [...prev, {
          id: Date.now() + 1,
          role: 'assistant',
          content: `📷 Identified: **${displayName}** (${category}) ${confEmoji} ${confidence || ''} confidence${confNote}${isSpecDB ? '\n✅ Specs verified from database' : ''}`,
        }]);

        const cat = category?.toUpperCase();

        // Always show confirm card — user must click to confirm
        // Hide alternatives when confidence is HIGH — only show the best match
        const sanitizedScanResult = {
          ...scanResult,
          displayName,
          alternative1: confidence === 'HIGH' ? '' : alt1,
          alternative2: confidence === 'HIGH' ? '' : alt2,
        };
        setWizardState({ phase: 'confirm', scanResult: sanitizedScanResult, category: cat, displayName, confidence });

        setMessages(prev => {
          const all = prev.filter(m => m.role && m.content && m.id !== 0);
          if (all.length >= 2) {
            saveChat(`Image scan: ${displayName}`, all.map(m => ({ role: m.role, content: m.content })), savedChatIdRef.current)
              .then(s => { if (s?.id) savedChatIdRef.current = s.id; });
          }
          return prev;
        });
        return;
      }

      // ── Text chat path ──────────────────────────────────────────────────
      const apiMessages = [
        ...messages.filter(m => !(m.role === 'assistant' && m.id === 0)),
        userMessage,
      ].map(m => ({
        role: m.role,
        content: typeof m.content === 'string' ? m.content : JSON.stringify(m.content),
      }));

      const streamingId = Date.now() + 1;
      streamingMsgIdRef.current = streamingId;
      setMessages(prev => [...prev, { id: streamingId, role: 'assistant', content: '', streaming: true }]);
      setIsLoading(false);
      setIsStreaming(true);

      cancelStreamRef.current = await askAIStream(
        apiMessages,
        token => {
          setMessages(prev => prev.map(msg =>
            msg.id === streamingId ? { ...msg, content: msg.content + token } : msg
          ));
          messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
        },
        () => {
          setMessages(prev => {
            const updated = prev.map(msg => msg.id === streamingId ? { ...msg, streaming: false } : msg);
            const all = updated.filter(m => m.role && m.content && m.id !== 0);
            if (all.length >= 2) {
              const t = all.find(m => m.role === 'user');
              saveChat(
                t ? t.content.slice(0, 60) : 'Chat',
                all.map(m => ({ role: m.role, content: m.content })),
                savedChatIdRef.current
              ).then(s => { if (s?.id) savedChatIdRef.current = s.id; });
            }
            return updated;
          });
          setIsStreaming(false);
          cancelStreamRef.current = null;
        },
        err => {
          setModelStatus('');
          setMessages(prev => prev.map(msg =>
            msg.id === streamingId ? { ...msg, content: err.message || '⚠️ Something went wrong.', streaming: false } : msg
          ));
          setIsStreaming(false);
          cancelStreamRef.current = null;
        }
      );
    } catch (err) {
      console.error('Chat error:', err);
      setModelStatus('');
      setIsLoading(false);
      setIsStreaming(false);
      setMessages(prev => [...prev, { id: Date.now() + 1, role: 'assistant', content: err.message || '⚠️ Something went wrong. Please try again.' }]);
    }
  }, [input, messages]);

  useEffect(() => {
    if (pendingAutoSend && messages.length > 0) {
      const timer = setTimeout(() => { sendMessage(pendingAutoSend); setPendingAutoSend(null); }, 300);
      return () => clearTimeout(timer);
    }
  }, [pendingAutoSend, messages, sendMessage]);

  // ── Form submit ───────────────────────────────────────────────────────────
  const handleSubmit = async e => {
    e.preventDefault();
    if (!input.trim() && !uploadedFile) return;
    if (isLoading || isStreaming) return;
    if (uploadedFile) {
      const reader = new FileReader();
      reader.onload = async ev => {
        const base64 = ev.target.result.split(',')[1];
        const mime = uploadedFile.type || 'image/jpeg';
        await sendMessage(input || 'What is this hardware? Identify it and give full specs.', base64, mime);
      };
      reader.readAsDataURL(uploadedFile);
    } else {
      await sendMessage(input);
    }
  };

  const handleFileChange = e => {
    const file = e.target.files[0];
    if (!file) return;
    setUploadedFile(file);
    setUploadedPreview(URL.createObjectURL(file));
  };

  const handleStopStream = () => {
    if (cancelStreamRef.current) { cancelStreamRef.current(); cancelStreamRef.current = null; }
    setMessages(prev => prev.map(msg => msg.streaming ? { ...msg, streaming: false } : msg));
    setIsStreaming(false);
  };

  // ── Wizard renderer ───────────────────────────────────────────────────────
  const renderWizard = () => {
    if (!wizardState) return null;
    if (wizardState.phase === 'confirm') return (
      <ConfirmDeviceCard
        displayName={wizardState.displayName || wizardState.scanResult.displayName}
        alt1={wizardState.scanResult.alternative1 || ''}
        alt2={wizardState.scanResult.alternative2 || ''}
        category={wizardState.category}
        confidence={wizardState.confidence || wizardState.scanResult.confidence}
        onConfirm={(name) => confirmDevice(name, wizardState.category)}
        onHelpIdentify={() => startWizard(wizardState.scanResult, wizardState.category)}
        onUploadAgain={() => { setWizardState(null); fileRef.current?.click(); }}
        onSeeMore={() => openCatalog(wizardState.category)}
      />
    );
    if (wizardState.phase === 'steps') return (
      <WizardStepCard
        step={wizardState.steps[wizardState.stepIndex]}
        onSelect={handleWizardOption}
        onSkip={() => handleWizardOption('skipped', 'Skipped')}
      />
    );
    if (wizardState.phase === 'refined') return (
      <RefinedResultsCard
        reasoning={wizardState.reasoning}
        suggestions={wizardState.suggestions}
        onSelect={(name) => confirmDevice(name, wizardState.category)}
        onTypeMyself={() => { setWizardState(null); inputRef.current?.focus(); }}
        onSeeMore={() => openCatalog(wizardState.category)}
      />
    );
    if (wizardState.phase === 'quick_actions') return (
      <QuickActionCard
        deviceName={wizardState.deviceName}
        category={wizardState.category}
        onSelect={handleQuickAction}
      />
    );
    return null;
  };

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="page" style={{ display: 'flex', flexDirection: 'column', height: '100vh' }}>
      <style>{`
        @keyframes blink { 0%, 100% { opacity: 1; } 50% { opacity: 0; } }
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>

      <Navbar onLogout={onLogout} />

      {/* Top bar */}
      <div style={{ padding: '12px 24px 0', maxWidth: '800px', margin: '0 auto', width: '100%', display: 'flex', alignItems: 'center', gap: '12px' }}>
        <button onClick={() => navigate(-1)} className="btn btn-ghost" style={{ padding: '6px 14px', fontSize: '13px' }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="m15 18-6-6 6-6" /></svg>
          Back
        </button>
        {modelStatus && <span style={{ fontSize: '12px', color: 'var(--text-3)', fontStyle: 'italic' }}>{modelStatus}</span>}
        {isStreaming && (
          <span style={{ fontSize: '12px', color: 'var(--accent)', fontStyle: 'italic', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ width: '7px', height: '7px', borderRadius: '50%', background: 'var(--accent)', display: 'inline-block', animation: 'blink 1s ease infinite' }} />
            SpecSmart is typing...
          </span>
        )}
      </div>

      {/* Messages */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '20px 24px 160px' }}>
        <div className="chat-messages">
          {messages.map(msg => (
            <div key={msg.id} className={`message ${msg.role === 'user' ? 'user' : 'ai'}`}>
              <div className={`message-avatar ${msg.role === 'user' ? 'user-av' : 'ai'}`}>
                {msg.role === 'user' ? 'AM' : 'SS'}
              </div>
              <div className="message-bubble">
                {msg.image && (
                  <div style={{ marginBottom: '10px' }}>
                    <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.6)', marginBottom: '6px' }}>📎 Hardware Image</div>
                    <img
                      src={`data:${msg.imageMime || 'image/jpeg'};base64,${msg.image}`}
                      alt="Uploaded hardware"
                      style={{ maxWidth: '200px', borderRadius: '8px', display: 'block' }}
                    />
                  </div>
                )}
                <div style={{ lineHeight: '1.6', fontSize: '14px' }}>
                  {msg.content === '' && msg.streaming
                    ? <StreamingCursor />
                    : <>{renderMessage(msg.content)}{msg.streaming && <StreamingCursor />}</>
                  }
                </div>
              </div>
            </div>
          ))}

          {/* Wizard cards */}
          {wizardState && !isLoading && !isStreaming && (
            <div className="message ai" style={{ alignItems: 'flex-start' }}>
              <div className="message-avatar ai">SS</div>
              <div style={{ flex: 1 }}>{renderWizard()}</div>
            </div>
          )}

          {/* Loading dots */}
          {isLoading && (
            <div className="message ai">
              <div className="message-avatar ai">SS</div>
              <div className="message-bubble">
                <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
                  <div className="typing-dot" />
                  <div className="typing-dot" />
                  <div className="typing-dot" />
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input bar */}
      <div className="chat-wrapper">
        <div style={{ width: '100%', maxWidth: '760px' }}>
          {/* Image preview */}
          {uploadedPreview && (
            <div style={{ background: 'var(--bg-2)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: '10px 14px', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '12px' }} onClick={e => e.stopPropagation()}>
              <img src={uploadedPreview} alt="preview" style={{ width: '40px', height: '40px', objectFit: 'cover', borderRadius: '6px' }} />
              <div>
                <div style={{ fontSize: '12px', fontWeight: '500', color: 'var(--text)' }}>{uploadedFile?.name}</div>
                <div style={{ fontSize: '11px', color: 'var(--accent)' }}>🤖 Ready to analyze with Groq Vision AI</div>
              </div>
              <button
                type="button"
                onClick={e => {
                  e.stopPropagation();
                  setUploadedFile(null);
                  setUploadedPreview(null);
                  if (fileRef.current) fileRef.current.value = '';
                }}
                style={{ marginLeft: 'auto', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-3)', padding: '4px', borderRadius: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
              </button>
            </div>
          )}

          <form className="chat-bar" onSubmit={handleSubmit} style={{ borderRadius: 'var(--radius)' }}>
            <input ref={fileRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleFileChange} />
            <button type="button" className="upload-btn" onClick={() => fileRef.current.click()} title="Upload hardware image">
              {uploadedFile
                ? <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="2" /><circle cx="8.5" cy="8.5" r="1.5" /><polyline points="21 15 16 10 5 21" /></svg>
                : <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="17 8 12 3 7 8" /><line x1="12" y1="3" x2="12" y2="15" /></svg>
              }
            </button>
            <input
              ref={inputRef}
              className="chat-input"
              type="text"
              placeholder="Ask about CPUs, GPUs, phones... or upload a hardware image for identification"
              value={input}
              onChange={e => setInput(e.target.value)}
              disabled={isLoading || isStreaming}
            />
            {isStreaming
              ? (
                <button type="button" className="chat-send" onClick={handleStopStream} style={{ background: 'var(--text-3)' }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><rect x="4" y="4" width="16" height="16" rx="2" /></svg>
                </button>
              )
              : (
                <button type="submit" className="chat-send" disabled={isLoading}>
                  {isLoading
                    ? <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ animation: 'spin 1s linear infinite' }}><circle cx="12" cy="12" r="10" strokeOpacity="0.2" /><path d="M22 12a10 10 0 0 1-10 10" /></svg>
                    : <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="22" y1="2" x2="11" y2="13" /><polygon points="22 2 15 22 11 13 2 9 22 2" /></svg>
                  }
                </button>
              )
            }
          </form>
        </div>
      </div>

      {/* Catalog modal */}
      {catalogOpen && (
        <CatalogModal
          initialCategory={catalogCategory}
          onSelect={(name) => confirmDevice(name, catalogCategory)}
          onClose={() => setCatalogOpen(false)}
        />
      )}
    </div>
  );
}