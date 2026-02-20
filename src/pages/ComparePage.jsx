import { useState } from 'react';
import Navbar from '../components/Navbar';
import { devices } from '../data/devices';

const SPEC_ROWS = [
  { key: 'launch', label: 'Price' },
  { key: 'category', label: 'Category' },
  { key: 'brand', label: 'Brand' },
  { key: 'specs', label: 'Key Specs' },
];

const DETAIL_ROWS = [
  'display', 'processor', 'cores', 'threads', 'baseClock', 'boostClock', 'tdp', 'socket',
  'cache', 'memory', 'vram', 'cudaCores', 'streamProc', 'capacity', 'type', 'speed',
  'latency', 'readSpeed', 'writeSpeed', 'tbw', 'formFactor', 'interface', 'ram', 'storage',
  'mainCamera', 'battery', 'os', 'layout', 'switches', 'connectivity', 'sensor', 'dpi',
  'pollRate', 'weight', 'wattage', 'efficiency', 'modular', 'warranty', 'chipset', 'memType',
  'memSlots', 'pcie', 'm2Slots', 'usbPorts'
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
  memSlots: 'Memory Slots', pcie: 'PCIe', m2Slots: 'M.2 Slots', usbPorts: 'USB Ports'
};

export default function ComparePage() {
  const [device1, setDevice1] = useState(null);
  const [device2, setDevice2] = useState(null);
  const [search1, setSearch1] = useState('');
  const [search2, setSearch2] = useState('');
  const [showDropdown1, setShowDropdown1] = useState(false);
  const [showDropdown2, setShowDropdown2] = useState(false);

  const filtered1 = devices.filter(d =>
    d.name.toLowerCase().includes(search1.toLowerCase()) ||
    d.category.toLowerCase().includes(search1.toLowerCase())
  ).slice(0, 8);

  const filtered2 = devices.filter(d =>
    d.name.toLowerCase().includes(search2.toLowerCase()) ||
    d.category.toLowerCase().includes(search2.toLowerCase())
  ).slice(0, 8);

  // Get all detail keys that either device has
  const detailKeys = device1 || device2
    ? DETAIL_ROWS.filter(k =>
        (device1?.details?.[k]) || (device2?.details?.[k])
      )
    : [];

  return (
    <div className="page">
      <Navbar />

      <div className="page-content">
        <h1 style={{ fontFamily: 'Syne', fontSize: '28px', fontWeight: '800', marginBottom: '32px', textAlign: 'center' }}>
          Compare Devices
        </h1>

        {/* Device selectors */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr', gap: '20px', alignItems: 'start', marginBottom: '32px' }}>
          {/* Device 1 */}
          <div style={{ position: 'relative' }}>
            <div style={{ fontSize: '12px', color: 'var(--text-3)', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: '600' }}>
              Compare:
            </div>
            <input
              className="search-input"
              type="text"
              placeholder="Search device 1..."
              value={search1}
              onChange={e => { setSearch1(e.target.value); setShowDropdown1(true); }}
              onFocus={() => setShowDropdown1(true)}
              onBlur={() => setTimeout(() => setShowDropdown1(false), 200)}
              style={{ borderRadius: 'var(--radius-sm)' }}
            />
            {showDropdown1 && filtered1.length > 0 && (
              <div style={{ position: 'absolute', top: 'calc(100% + 4px)', left: 0, right: 0, zIndex: 50, background: 'var(--bg-2)', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', overflow: 'hidden', boxShadow: 'var(--shadow)' }}>
                {filtered1.map(d => (
                  <div key={d.id} onClick={() => { setDevice1(d); setSearch1(d.name); setShowDropdown1(false); }}
                    style={{ padding: '10px 14px', cursor: 'pointer', display: 'flex', gap: '10px', alignItems: 'center', fontSize: '13px', transition: 'background 0.1s' }}
                    onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-3)'}
                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                    <span style={{ fontSize: '20px' }}>{d.emoji}</span>
                    <div>
                      <div style={{ color: 'var(--text)', fontWeight: '500' }}>{d.name}</div>
                      <div style={{ color: 'var(--text-3)', fontSize: '11px' }}>{d.category} · {d.price}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Device 1 preview */}
            {device1 && (
              <div style={{ marginTop: '12px', background: 'var(--bg-2)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: '20px', textAlign: 'center' }}>
                <div style={{ fontSize: '52px', marginBottom: '12px' }}>{device1.emoji}</div>
                <div style={{ fontSize: '11px', color: 'var(--accent)', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: '4px' }}>{device1.category}</div>
                <div style={{ fontFamily: 'Syne', fontSize: '16px', fontWeight: '700', marginBottom: '4px' }}>{device1.name}</div>
                <div style={{ fontSize: '12px', color: 'var(--text-2)', marginBottom: '8px' }}>{device1.specs}</div>
                <div style={{ fontFamily: 'Syne', fontSize: '18px', fontWeight: '700', color: 'var(--accent)' }}>{device1.price}</div>
              </div>
            )}
          </div>

          {/* VS */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', paddingTop: '28px' }}>
            <div style={{ fontFamily: 'Syne', fontSize: '20px', fontWeight: '800', color: 'var(--text-3)', padding: '10px 14px', background: 'var(--bg-2)', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)' }}>
              VS
            </div>
          </div>

          {/* Device 2 */}
          <div style={{ position: 'relative' }}>
            <div style={{ fontSize: '12px', color: 'var(--text-3)', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: '600' }}>
              Compare with:
            </div>
            <input
              className="search-input"
              type="text"
              placeholder="Search device 2..."
              value={search2}
              onChange={e => { setSearch2(e.target.value); setShowDropdown2(true); }}
              onFocus={() => setShowDropdown2(true)}
              onBlur={() => setTimeout(() => setShowDropdown2(false), 200)}
              style={{ borderRadius: 'var(--radius-sm)' }}
            />
            {showDropdown2 && filtered2.length > 0 && (
              <div style={{ position: 'absolute', top: 'calc(100% + 4px)', left: 0, right: 0, zIndex: 50, background: 'var(--bg-2)', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', overflow: 'hidden', boxShadow: 'var(--shadow)' }}>
                {filtered2.map(d => (
                  <div key={d.id} onClick={() => { setDevice2(d); setSearch2(d.name); setShowDropdown2(false); }}
                    style={{ padding: '10px 14px', cursor: 'pointer', display: 'flex', gap: '10px', alignItems: 'center', fontSize: '13px', transition: 'background 0.1s' }}
                    onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-3)'}
                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                    <span style={{ fontSize: '20px' }}>{d.emoji}</span>
                    <div>
                      <div style={{ color: 'var(--text)', fontWeight: '500' }}>{d.name}</div>
                      <div style={{ color: 'var(--text-3)', fontSize: '11px' }}>{d.category} · {d.price}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {device2 && (
              <div style={{ marginTop: '12px', background: 'var(--bg-2)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: '20px', textAlign: 'center' }}>
                <div style={{ fontSize: '52px', marginBottom: '12px' }}>{device2.emoji}</div>
                <div style={{ fontSize: '11px', color: 'var(--accent)', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: '4px' }}>{device2.category}</div>
                <div style={{ fontFamily: 'Syne', fontSize: '16px', fontWeight: '700', marginBottom: '4px' }}>{device2.name}</div>
                <div style={{ fontSize: '12px', color: 'var(--text-2)', marginBottom: '8px' }}>{device2.specs}</div>
                <div style={{ fontFamily: 'Syne', fontSize: '18px', fontWeight: '700', color: 'var(--accent)' }}>{device2.price}</div>
              </div>
            )}
          </div>
        </div>

        {/* Comparison table */}
        {(device1 || device2) && (
          <div style={{ background: 'var(--bg-2)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', overflow: 'hidden', marginBottom: '80px' }}>
            {/* Base info rows */}
            {[
              { label: 'Brand', v1: device1?.brand, v2: device2?.brand },
              { label: 'Category', v1: device1?.category, v2: device2?.category },
              { label: 'Key Specs', v1: device1?.specs, v2: device2?.specs },
              { label: 'Price', v1: device1?.price, v2: device2?.price },
            ].map((row, i) => (
              <div key={i} style={{
                display: 'grid', gridTemplateColumns: '140px 1fr 1fr',
                borderBottom: '1px solid var(--border)',
                background: i % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.01)'
              }}>
                <div style={{ padding: '14px 16px', fontSize: '13px', fontWeight: '500', color: 'var(--text-2)', borderRight: '1px solid var(--border)' }}>{row.label}</div>
                <div style={{ padding: '14px 16px', fontSize: '13px', color: 'var(--text)', borderRight: '1px solid var(--border)' }}>{row.v1 || '—'}</div>
                <div style={{ padding: '14px 16px', fontSize: '13px', color: 'var(--text)' }}>{row.v2 || '—'}</div>
              </div>
            ))}

            {/* Detail rows */}
            {detailKeys.map((key, i) => (
              <div key={key} style={{
                display: 'grid', gridTemplateColumns: '140px 1fr 1fr',
                borderBottom: i < detailKeys.length - 1 ? '1px solid var(--border)' : 'none',
                background: (i + 4) % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.01)'
              }}>
                <div style={{ padding: '14px 16px', fontSize: '13px', fontWeight: '500', color: 'var(--text-2)', borderRight: '1px solid var(--border)' }}>{LABELS[key] || key}</div>
                <div style={{ padding: '14px 16px', fontSize: '13px', color: 'var(--text)', borderRight: '1px solid var(--border)' }}>{device1?.details?.[key] || '—'}</div>
                <div style={{ padding: '14px 16px', fontSize: '13px', color: 'var(--text)' }}>{device2?.details?.[key] || '—'}</div>
              </div>
            ))}
          </div>
        )}

        {!device1 && !device2 && (
          <div style={{ textAlign: 'center', padding: '80px 0', color: 'var(--text-3)' }}>
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>⚖️</div>
            <div style={{ fontFamily: 'Syne', fontSize: '18px', fontWeight: '700', marginBottom: '8px', color: 'var(--text-2)' }}>Select two devices to compare</div>
            <div style={{ fontSize: '14px' }}>Search for any PC part, smartphone, keyboard, or mouse above</div>
          </div>
        )}
      </div>
    </div>
  );
}