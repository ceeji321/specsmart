export const devices = [
  // CPUs
  { id: 1, category: 'CPU', name: 'Intel Core i9-14900K', emoji: '🔲', specs: '24 Cores, 6.0GHz Boost', price: '₱25,990', brand: 'Intel',
    details: { cores: '24 (8P+16E)', threads: '32', baseClock: '3.2 GHz', boostClock: '6.0 GHz', tdp: '125W', socket: 'LGA1700', cache: '36MB L3', memory: 'DDR4/DDR5' } },
  { id: 2, category: 'CPU', name: 'AMD Ryzen 9 7950X', emoji: '🔲', specs: '16 Cores, 5.7GHz Boost', price: '₱28,500', brand: 'AMD',
    details: { cores: '16', threads: '32', baseClock: '4.5 GHz', boostClock: '5.7 GHz', tdp: '170W', socket: 'AM5', cache: '64MB L3', memory: 'DDR5' } },
  { id: 3, category: 'CPU', name: 'Intel Core i5-13600K', emoji: '🔲', specs: '14 Cores, 5.1GHz Boost', price: '₱14,500', brand: 'Intel',
    details: { cores: '14 (6P+8E)', threads: '20', baseClock: '3.5 GHz', boostClock: '5.1 GHz', tdp: '125W', socket: 'LGA1700', cache: '24MB L3', memory: 'DDR4/DDR5' } },
  { id: 4, category: 'CPU', name: 'AMD Ryzen 5 7600X', emoji: '🔲', specs: '6 Cores, 5.3GHz Boost', price: '₱11,990', brand: 'AMD',
    details: { cores: '6', threads: '12', baseClock: '4.7 GHz', boostClock: '5.3 GHz', tdp: '105W', socket: 'AM5', cache: '32MB L3', memory: 'DDR5' } },

  // GPUs
  { id: 5, category: 'GPU', name: 'NVIDIA RTX 4090', emoji: '🎮', specs: '24GB GDDR6X, 16,384 CUDA', price: '₱89,990', brand: 'NVIDIA',
    details: { vram: '24GB GDDR6X', cudaCores: '16,384', boostClock: '2.52 GHz', tdp: '450W', connector: 'PCIe 4.0 x16', output: '3x DP 1.4a, HDMI 2.1', rayTracing: 'Yes (3rd Gen)' } },
  { id: 6, category: 'GPU', name: 'AMD RX 7900 XTX', emoji: '🎮', specs: '24GB GDDR6, 6144 SPs', price: '₱52,990', brand: 'AMD',
    details: { vram: '24GB GDDR6', streamProc: '6,144', boostClock: '2.5 GHz', tdp: '355W', connector: 'PCIe 4.0 x16', output: '2x DP 2.1, 2x HDMI 2.1', rayTracing: 'Yes (2nd Gen)' } },
  { id: 7, category: 'GPU', name: 'NVIDIA RTX 4070 Ti', emoji: '🎮', specs: '12GB GDDR6X, 7680 CUDA', price: '₱42,500', brand: 'NVIDIA',
    details: { vram: '12GB GDDR6X', cudaCores: '7,680', boostClock: '2.61 GHz', tdp: '285W', connector: 'PCIe 4.0 x16', output: '3x DP 1.4a, HDMI 2.1', rayTracing: 'Yes (3rd Gen)' } },

  // RAM
  { id: 8, category: 'RAM', name: 'Corsair Vengeance 32GB DDR5', emoji: '💾', specs: '6000MHz, CL36', price: '₱6,990', brand: 'Corsair',
    details: { capacity: '32GB (2x16GB)', type: 'DDR5', speed: '6000MHz', latency: 'CL36', voltage: '1.35V', profile: 'XMP 3.0', formFactor: 'DIMM' } },
  { id: 9, category: 'RAM', name: 'G.Skill Trident Z5 64GB', emoji: '💾', specs: 'DDR5-6400, CL32', price: '₱14,990', brand: 'G.Skill',
    details: { capacity: '64GB (2x32GB)', type: 'DDR5', speed: '6400MHz', latency: 'CL32', voltage: '1.4V', profile: 'XMP 3.0 / EXPO', formFactor: 'DIMM' } },

  // Storage
  { id: 10, category: 'SSD', name: 'Samsung 990 Pro 2TB', emoji: '💿', specs: 'PCIe 4.0, 7450MB/s Read', price: '₱7,490', brand: 'Samsung',
    details: { capacity: '2TB', interface: 'PCIe 4.0 x4, NVMe 2.0', readSpeed: '7,450 MB/s', writeSpeed: '6,900 MB/s', tbw: '1,200 TBW', formFactor: 'M.2 2280', cache: 'DRAM Included' } },
  { id: 11, category: 'SSD', name: 'WD Black SN850X 1TB', emoji: '💿', specs: 'PCIe 4.0, 7300MB/s Read', price: '₱4,990', brand: 'WD',
    details: { capacity: '1TB', interface: 'PCIe 4.0 x4, NVMe 2.0', readSpeed: '7,300 MB/s', writeSpeed: '6,600 MB/s', tbw: '600 TBW', formFactor: 'M.2 2280', cache: 'DRAM Included' } },

  // Motherboards
  { id: 12, category: 'Motherboard', name: 'ASUS ROG Maximus Z790', emoji: '🖥️', specs: 'LGA1700, DDR5, ATX', price: '₱38,990', brand: 'ASUS',
    details: { socket: 'LGA1700', chipset: 'Intel Z790', memType: 'DDR5', memSlots: '4 DIMM (128GB max)', pcie: 'PCIe 5.0 x16', m2Slots: '5x M.2', usbPorts: 'USB4, USB 3.2 Gen 2x2', formFactor: 'ATX' } },
  { id: 13, category: 'Motherboard', name: 'MSI MAG B650 TOMAHAWK', emoji: '🖥️', specs: 'AM5, DDR5, ATX', price: '₱12,990', brand: 'MSI',
    details: { socket: 'AM5', chipset: 'AMD B650', memType: 'DDR5', memSlots: '4 DIMM (128GB max)', pcie: 'PCIe 4.0 x16', m2Slots: '3x M.2', usbPorts: 'USB 3.2 Gen 2', formFactor: 'ATX' } },

  // Smartphones
  { id: 14, category: 'Smartphone', name: 'Samsung Galaxy S24 Ultra', emoji: '📱', specs: 'Snapdragon 8 Gen 3, 12GB RAM', price: '₱74,990', brand: 'Samsung',
    details: { display: '6.8" QHD+ AMOLED, 120Hz', processor: 'Snapdragon 8 Gen 3', ram: '12GB', storage: '256GB / 512GB / 1TB', mainCamera: '200MP + 12MP + 10MP + 50MP', battery: '5000mAh, 45W', os: 'Android 14 / One UI 6.1' } },
  { id: 15, category: 'Smartphone', name: 'iPhone 15 Pro Max', emoji: '📱', specs: 'A17 Pro, 8GB RAM', price: '₱82,990', brand: 'Apple',
    details: { display: '6.7" Super Retina XDR, 120Hz', processor: 'Apple A17 Pro', ram: '8GB', storage: '256GB / 512GB / 1TB', mainCamera: '48MP + 12MP + 12MP', battery: '4422mAh, 27W', os: 'iOS 17' } },
  { id: 16, category: 'Smartphone', name: 'Google Pixel 8 Pro', emoji: '📱', specs: 'Tensor G3, 12GB RAM', price: '₱52,990', brand: 'Google',
    details: { display: '6.7" LTPO OLED, 120Hz', processor: 'Google Tensor G3', ram: '12GB', storage: '128GB / 256GB / 1TB', mainCamera: '50MP + 48MP + 48MP', battery: '5050mAh, 30W', os: 'Android 14' } },
  { id: 17, category: 'Smartphone', name: 'Xiaomi 14 Ultra', emoji: '📱', specs: 'Snapdragon 8 Gen 3, 16GB RAM', price: '₱62,990', brand: 'Xiaomi',
    details: { display: '6.73" LTPO AMOLED, 120Hz', processor: 'Snapdragon 8 Gen 3', ram: '16GB', storage: '512GB', mainCamera: '50MP Leica + 50MP + 50MP + 50MP', battery: '5000mAh, 90W', os: 'Android 14 / HyperOS' } },
  { id: 18, category: 'Smartphone', name: 'ASUS ROG Phone 8 Pro', emoji: '📱', specs: 'Snapdragon 8 Gen 3, 24GB RAM', price: '₱65,990', brand: 'ASUS',
    details: { display: '6.78" AMOLED, 165Hz', processor: 'Snapdragon 8 Gen 3', ram: '24GB', storage: '1TB', mainCamera: '50MP + 13MP + 32MP', battery: '5500mAh, 65W', os: 'Android 14 / ROG UI' } },

  // Keyboards
  { id: 19, category: 'Keyboard', name: 'Keychron Q6 Pro', emoji: '⌨️', specs: 'Full-size, QMK/VIA, Wireless', price: '₱8,990', brand: 'Keychron',
    details: { layout: 'Full-size (100%)', switches: 'Gateron G Pro (Hot-swap)', connectivity: 'Bluetooth 5.1 / USB-C', battery: '4000mAh', body: 'Aluminum', backlight: 'South-facing RGB', compatibility: 'Windows / Mac' } },
  { id: 20, category: 'Keyboard', name: 'Logitech MX Keys S', emoji: '⌨️', specs: 'Wireless, Multi-device, Backlit', price: '₱6,490', brand: 'Logitech',
    details: { layout: 'Full-size', switches: 'Scissor (35g actuation)', connectivity: 'Logi Bolt / Bluetooth', battery: '10 days (backlit) / 5 months', body: 'Brushed Aluminum', backlight: 'Smart backlit', compatibility: 'Windows / Mac / Linux' } },
  { id: 21, category: 'Keyboard', name: 'Ducky One 3 TKL', emoji: '⌨️', specs: 'TKL, Hot-swap, RGB', price: '₱5,990', brand: 'Ducky',
    details: { layout: 'TKL (80%)', switches: 'Cherry MX (Hot-swap)', connectivity: 'USB-C (detachable)', body: 'Polycarbonate', backlight: 'RGB per-key', nkro: 'Full NKRO', compatibility: 'Windows / Mac' } },

  // Mice
  { id: 22, category: 'Mouse', name: 'Logitech G Pro X Superlight 2', emoji: '🖱️', specs: '32000 DPI, 63g, Wireless', price: '₱7,990', brand: 'Logitech',
    details: { sensor: 'HERO 25K', dpi: '100-32,000', pollRate: '2000Hz (USB)', weight: '63g', connectivity: 'LIGHTSPEED Wireless', battery: '95 hours', buttons: '5', cable: 'Wireless only' } },
  { id: 23, category: 'Mouse', name: 'Razer DeathAdder V3 HyperSpeed', emoji: '🖱️', specs: '26000 DPI, 71g, Wireless', price: '₱4,990', brand: 'Razer',
    details: { sensor: 'Razer Focus Pro 30K', dpi: '100-26,000', pollRate: '1000Hz', weight: '71g', connectivity: 'HyperSpeed Wireless', battery: '300 hours', buttons: '6', shape: 'Ergonomic right-hand' } },
  { id: 24, category: 'Mouse', name: 'Zowie EC2-C', emoji: '🖱️', specs: '3200 DPI, 73g, Wired', price: '₱3,990', brand: 'Zowie',
    details: { sensor: 'PMW3360', dpi: '400-3200', pollRate: '1000Hz', weight: '73g', connectivity: 'USB (paracord)', battery: 'Wired', buttons: '5', shape: 'Ergonomic right-hand' } },
  { id: 25, category: 'Mouse', name: 'SteelSeries Aerox 3 Wireless', emoji: '🖱️', specs: '18000 DPI, 68g, AquaBarrier', price: '₱5,490', brand: 'SteelSeries',
    details: { sensor: 'TrueMove Air', dpi: '200-18,000', pollRate: '1000Hz', weight: '68g', connectivity: 'Quantum 2.0 Wireless / BT', battery: '200 hours', buttons: '6', special: 'AquaBarrier IP54' } },

  // PSU
  { id: 26, category: 'PSU', name: 'Corsair RM1000x 1000W', emoji: '⚡', specs: '1000W, 80+ Gold, Fully Modular', price: '₱8,990', brand: 'Corsair',
    details: { wattage: '1000W', efficiency: '80+ Gold', modular: 'Fully Modular', fan: '135mm Rifle Bearing', pcie5: 'Yes (12VHPWR)', warranty: '10 Years', atx: 'ATX 3.0' } },
  { id: 27, category: 'PSU', name: 'EVGA SuperNOVA 850 G7', emoji: '⚡', specs: '850W, 80+ Gold, Fully Modular', price: '₱6,490', brand: 'EVGA',
    details: { wattage: '850W', efficiency: '80+ Gold', modular: 'Fully Modular', fan: '135mm Double Ball Bearing', pcie5: 'Yes', warranty: '10 Years', atx: 'ATX 3.0' } },
];

export const categories = ['All', 'CPU', 'GPU', 'RAM', 'SSD', 'Motherboard', 'Smartphone', 'Keyboard', 'Mouse', 'PSU'];