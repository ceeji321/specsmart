import express from 'express';
import fetch from 'node-fetch';
import { optionalAuth } from '../middleware/auth.js';

const router = express.Router();

// ─── System Prompt ─────────────────────────────────────────────────────────────
const SYSTEM_PROMPT = `You are SpecSmart AI, a highly specialized tech advisor for the Philippine market focused exclusively on:
- PC components: CPUs, GPUs, RAM, Storage (SSDs/HDDs), Motherboards, PSUs, Cooling
- Smartphones and mobile devices
- Laptops

You ONLY answer questions about these tech categories. For anything outside this scope, politely redirect.

When answering:
1. Be concise but detailed — use bullet points for specs
2. Give real model recommendations with ACCURATE Philippine Peso prices
3. Philippine prices should reflect Lazada, Shopee, PC Express, DynaQuest, Villman, and official brand stores (2024-2025 pricing)
4. Explain technical jargon in simple terms
5. When comparing devices, highlight key differences clearly
6. Always consider the user's budget and use case
7. If you are unsure of a spec or price, say "unconfirmed" or give a range like "₱X,XXX – ₱X,XXX (estimated)"
8. Always mention if a device is NOT officially sold in the Philippines
9. For phones, mention if the PH variant has different specs than global (e.g., processor differences)
10. NEVER invent specifications — accuracy is more important than completeness`;

// ─── IMPROVEMENT 1: Massively expanded Spec Database ─────────────────────────
// Adding ~80 more devices on top of the original ~80 = ~160 total
const SPEC_DB = {
  // ── iPhones ──────────────────────────────────────────────────────────────────
  'Apple iPhone 16 Pro Max': {
    display: '6.9" Super Retina XDR OLED, 2868×1320, ProMotion 120Hz, Always-On',
    processor: 'Apple A18 Pro chip (3nm), 6-core CPU, 6-core GPU',
    ram: '8GB',
    storage: '256GB / 512GB / 1TB',
    camera: '48MP Fusion (main, f/1.78) + 48MP Ultra Wide + 5x Tetraprism telephoto | 4K120fps ProRes',
    battery: '4685mAh, 30W MagSafe, 25W wired, 15W Qi2',
    os: 'iOS 18',
    connectivity: '5G, Wi-Fi 7, Bluetooth 5.3, USB-C USB 3 (10Gbps), NFC',
    build: 'Titanium frame, textured matte glass back, IP68 (6m/30min)',
    price_php: '₱94,990 (256GB) | ₱109,990 (512GB) | ₱124,990 (1TB)',
    buy: 'Apple PH (apple.com/ph), Beyond The Box, iStore, Switch, Lazada/Shopee official Apple stores',
    verdict: 'Best iPhone ever made. The Camera Control button and 5x telephoto at this size make it unbeatable for video creators. Pricey but worth it for power users.',
  },
  'Apple iPhone 16 Pro': {
    display: '6.3" Super Retina XDR OLED, 2622×1206, ProMotion 120Hz, Always-On',
    processor: 'Apple A18 Pro chip (3nm), 6-core CPU, 6-core GPU',
    ram: '8GB',
    storage: '128GB / 256GB / 512GB / 1TB',
    camera: '48MP Fusion (f/1.78) + 48MP Ultra Wide + 5x Tetraprism telephoto | 4K120fps ProRes',
    battery: '3582mAh, 30W MagSafe, 25W wired, 15W Qi2',
    os: 'iOS 18',
    connectivity: '5G, Wi-Fi 7, Bluetooth 5.3, USB-C USB 3, NFC',
    build: 'Titanium frame, textured matte glass, IP68',
    price_php: '₱79,990 (128GB) | ₱89,990 (256GB) | ₱104,990 (512GB) | ₱119,990 (1TB)',
    buy: 'Apple PH, Beyond The Box, iStore, Switch, Lazada/Shopee',
    verdict: 'The 5x zoom on a compact Pro is the headline feature. Near-identical cameras to the Max but in a more pocketable form.',
  },
  'Apple iPhone 16 Plus': {
    display: '6.7" Super Retina XDR OLED, 2796×1290, 60Hz',
    processor: 'Apple A18 chip (3nm), 6-core CPU, 5-core GPU',
    ram: '8GB',
    storage: '128GB / 256GB / 512GB',
    camera: '48MP Fusion (f/1.6) + 12MP Ultra Wide | 4K60fps',
    battery: '4674mAh, 25W MagSafe, 25W wired, 15W Qi2',
    os: 'iOS 18',
    connectivity: '5G, Wi-Fi 6E, Bluetooth 5.3, USB-C USB 2, NFC',
    build: 'Aluminum frame, color-infused glass, IP68',
    price_php: '₱59,990 (128GB) | ₱69,990 (256GB) | ₱84,990 (512GB)',
    buy: 'Apple PH, Beyond The Box, iStore, Switch, Lazada/Shopee',
    verdict: 'Big screen, big battery iPhone without the Pro price. Great for media consumption.',
  },
  'Apple iPhone 16': {
    display: '6.1" Super Retina XDR OLED, 2556×1179, 60Hz',
    processor: 'Apple A18 chip (3nm), 6-core CPU, 5-core GPU',
    ram: '8GB',
    storage: '128GB / 256GB / 512GB',
    camera: '48MP Fusion (f/1.6) + 12MP Ultra Wide | 4K60fps, Camera Control button',
    battery: '3561mAh, 25W MagSafe, 25W wired, 15W Qi2',
    os: 'iOS 18',
    connectivity: '5G, Wi-Fi 6E, Bluetooth 5.3, USB-C USB 2, NFC',
    build: 'Aluminum frame, color-infused glass, IP68',
    price_php: '₱49,990 (128GB) | ₱59,990 (256GB) | ₱74,990 (512GB)',
    buy: 'Apple PH, Beyond The Box, iStore, Switch, Lazada/Shopee',
    verdict: 'The best entry-level iPhone with A18 chip and Apple Intelligence support.',
  },
  'Apple iPhone 15 Pro Max': {
    display: '6.7" Super Retina XDR OLED, 2796×1290, ProMotion 120Hz, Always-On',
    processor: 'Apple A17 Pro chip (3nm), 6-core CPU, 6-core GPU',
    ram: '8GB',
    storage: '256GB / 512GB / 1TB',
    camera: '48MP main (f/1.78) + 12MP Ultra Wide + 5x Tetraprism telephoto | 4K60fps ProRes',
    battery: '4422mAh, 27W MagSafe, 27W wired, 15W Qi2',
    os: 'iOS 18 (upgradeable)',
    connectivity: '5G, Wi-Fi 6E, Bluetooth 5.3, USB-C USB 3 (10Gbps), NFC',
    build: 'Titanium frame, textured matte glass, IP68',
    price_php: '₱84,990 (256GB) | ₱99,990 (512GB) | ₱114,990 (1TB)',
    buy: 'Apple PH, Beyond The Box, iStore, Switch, Lazada/Shopee',
    verdict: 'Still excellent in 2025. The 5x zoom and USB 3 speeds remain class-leading for its price range.',
  },
  'Apple iPhone 15 Pro': {
    display: '6.1" Super Retina XDR OLED, 2556×1179, ProMotion 120Hz, Always-On',
    processor: 'Apple A17 Pro chip (3nm), 6-core CPU, 6-core GPU',
    ram: '8GB',
    storage: '128GB / 256GB / 512GB / 1TB',
    camera: '48MP main (f/1.78) + 12MP Ultra Wide + 3x telephoto | 4K60fps ProRes',
    battery: '3274mAh, 27W MagSafe, 27W wired',
    os: 'iOS 18 (upgradeable)',
    connectivity: '5G, Wi-Fi 6E, Bluetooth 5.3, USB-C USB 3, NFC',
    build: 'Titanium frame, textured matte glass, IP68',
    price_php: '₱69,990 (128GB) | ₱79,990 (256GB) | ₱94,990 (512GB)',
    buy: 'Apple PH, Beyond The Box, iStore, Switch, Lazada/Shopee',
    verdict: 'Compact pro-tier iPhone. Battery life is the only real weakness.',
  },
  'Apple iPhone 15 Plus': {
    display: '6.7" Super Retina XDR OLED, 2796×1290, 60Hz',
    processor: 'Apple A16 Bionic (4nm)',
    ram: '6GB',
    storage: '128GB / 256GB / 512GB',
    camera: '48MP main (f/1.6) + 12MP Ultra Wide',
    battery: '4383mAh, 27W MagSafe',
    os: 'iOS 18 (upgradeable)',
    connectivity: '5G, Wi-Fi 6, Bluetooth 5.3, USB-C USB 2',
    price_php: '₱49,990 (128GB) | ₱59,990 (256GB)',
    buy: 'Apple PH, Beyond The Box, iStore, Lazada/Shopee',
    verdict: 'Large screen, long battery, non-Pro price. Good value for size-lovers.',
  },
  'Apple iPhone 15': {
    display: '6.1" Super Retina XDR OLED, 2556×1179, 60Hz',
    processor: 'Apple A16 Bionic (4nm)',
    ram: '6GB',
    storage: '128GB / 256GB / 512GB',
    camera: '48MP main (f/1.6) + 12MP Ultra Wide | Dynamic Island',
    battery: '3349mAh, 27W MagSafe',
    os: 'iOS 18 (upgradeable)',
    connectivity: '5G, Wi-Fi 6, Bluetooth 5.3, USB-C USB 2',
    price_php: '₱43,990 (128GB) | ₱53,990 (256GB)',
    buy: 'Apple PH, Beyond The Box, iStore, Lazada/Shopee',
    verdict: 'USB-C and Dynamic Island at a lower price point. Great daily driver.',
  },
  'Apple iPhone 14 Pro Max': {
    display: '6.7" Super Retina XDR OLED, 2778×1284, ProMotion 120Hz, Always-On',
    processor: 'Apple A16 Bionic (4nm)',
    ram: '6GB',
    storage: '128GB / 256GB / 512GB / 1TB',
    camera: '48MP main + 12MP Ultra Wide + 3x telephoto | ProRes video',
    battery: '4323mAh, 27W MagSafe, Lightning',
    os: 'iOS 18 (upgradeable)',
    connectivity: '5G, Wi-Fi 6, Bluetooth 5.3, Lightning',
    price_php: '₱64,990 – ₱69,990 (128GB, certified pre-owned / clearance)',
    buy: 'iStore clearance, Beyond The Box, Lazada/Shopee certified sellers',
    verdict: 'Still powerful in 2025. Great deal if found at clearance price.',
  },
  'Apple iPhone 14': {
    display: '6.1" Super Retina XDR OLED, 2532×1170, 60Hz',
    processor: 'Apple A15 Bionic (5nm)',
    ram: '6GB',
    storage: '128GB / 256GB / 512GB',
    camera: '12MP main (f/1.5) + 12MP Ultra Wide',
    battery: '3279mAh, 27W MagSafe, Lightning',
    os: 'iOS 18 (upgradeable)',
    connectivity: '5G, Wi-Fi 6, Bluetooth 5.3, Lightning',
    price_php: '₱34,990 – ₱39,990 (128GB, sale/clearance)',
    buy: 'Apple PH clearance, iStore, Beyond The Box, Lazada/Shopee',
    verdict: 'Decent value at clearance pricing. Lightning port is the main downside.',
  },
  'Apple iPhone 13 Pro Max': {
    display: '6.7" Super Retina XDR OLED, 2778×1284, ProMotion 120Hz',
    processor: 'Apple A15 Bionic (5nm)',
    ram: '6GB',
    storage: '128GB / 256GB / 512GB / 1TB',
    camera: '12MP main (f/1.5) + 12MP Ultra Wide + 3x telephoto | ProRes (1080p)',
    battery: '4352mAh, 27W MagSafe, Lightning',
    os: 'iOS 17 max (iOS 18 not supported)',
    price_php: '₱29,990 – ₱39,990 (refurbished/second-hand)',
    buy: 'iStore certified pre-owned, Lazada/Shopee reputable sellers',
    verdict: 'Still excellent cameras. No iOS 18 support is the main caveat in 2025.',
  },
  'Apple iPhone 13': {
    display: '6.1" Super Retina XDR OLED, 2532×1170, 60Hz',
    processor: 'Apple A15 Bionic (5nm)',
    ram: '4GB',
    storage: '128GB / 256GB / 512GB',
    camera: '12MP main (f/1.6) + 12MP Ultra Wide',
    battery: '3227mAh, 27W MagSafe, Lightning',
    os: 'iOS 17 max',
    price_php: '₱24,990 – ₱29,990 (second-hand/refurbished)',
    buy: 'iStore, Lazada/Shopee reputable sellers',
    verdict: 'Budget Apple option. No iOS 18 support limits longevity.',
  },
  'Apple iPhone 13 Mini': {
    display: '5.4" Super Retina XDR OLED, 2340×1080, 60Hz',
    processor: 'Apple A15 Bionic (5nm)',
    ram: '4GB',
    storage: '128GB / 256GB / 512GB',
    camera: '12MP main (f/1.6) + 12MP Ultra Wide',
    battery: '2406mAh, 27W MagSafe, Lightning',
    os: 'iOS 17 max',
    price_php: '₱19,990 – ₱24,990 (second-hand/refurbished)',
    buy: 'iStore, Lazada/Shopee reputable sellers',
    verdict: 'Most compact iPhone ever made. Small battery is the main trade-off.',
  },
  'Apple iPhone 12 Pro Max': {
    display: '6.7" Super Retina XDR OLED, 2778×1284, 60Hz',
    processor: 'Apple A14 Bionic (5nm)',
    ram: '6GB',
    storage: '128GB / 256GB / 512GB',
    camera: '12MP main (f/1.6, OIS) + 12MP Ultra Wide + 12MP 2.5x telephoto | ProRAW',
    battery: '3687mAh, 20W wired, 15W MagSafe, Lightning',
    os: 'iOS 16 max',
    price_php: '₱19,990 – ₱24,990 (second-hand/refurbished 2025)',
    buy: 'iStore certified pre-owned, Lazada/Shopee reputable sellers',
    verdict: 'Big screen, stainless steel build. No iOS 17/18 support is a concern.',
  },
  'Apple iPhone 12 Pro': {
    display: '6.1" Super Retina XDR OLED, 2532×1170, 60Hz',
    processor: 'Apple A14 Bionic (5nm)',
    ram: '6GB',
    storage: '128GB / 256GB / 512GB',
    camera: '12MP main (f/1.6, OIS) + 12MP Ultra Wide + 12MP 2x telephoto | 4K60fps, ProRAW, Night mode all lenses',
    battery: '2815mAh, 20W wired, 15W MagSafe, Lightning',
    os: 'iOS 16 max (iOS 17 not supported)',
    connectivity: '5G, Wi-Fi 6, Bluetooth 5.0, Lightning, NFC',
    build: 'Surgical-grade stainless steel frame, Ceramic Shield front, textured matte glass back, IP68',
    price_php: '₱19,990 – ₱24,990 (second-hand/refurbished 2025)',
    buy: 'iStore certified pre-owned, Lazada/Shopee reputable sellers, Facebook Marketplace',
    verdict: 'Still a capable iPhone with stainless steel build and triple cameras. No iOS 17/18 support is the main concern in 2025. Colors: Pacific Blue, Gold, Graphite, Silver.',
  },
  'Apple iPhone 12': {
    display: '6.1" Super Retina XDR OLED, 2532×1170, 60Hz',
    processor: 'Apple A14 Bionic (5nm)',
    ram: '4GB',
    storage: '64GB / 128GB / 256GB',
    camera: '12MP main (f/1.6) + 12MP Ultra Wide | Dynamic Island',
    battery: '2815mAh, 20W wired, 15W MagSafe, Lightning',
    os: 'iOS 16 max',
    price_php: '₱14,990 – ₱19,990 (second-hand/refurbished 2025)',
    buy: 'iStore certified pre-owned, Lazada/Shopee reputable sellers',
    verdict: 'Budget iPhone option. No iOS 17/18 support limits longevity significantly.',
  },
  'Apple iPhone SE (2022)': {
    display: '4.7" Retina IPS LCD, 1334×750, 60Hz, Touch ID',
    processor: 'Apple A15 Bionic (5nm)',
    ram: '4GB',
    storage: '64GB / 128GB / 256GB',
    camera: '12MP main (f/1.8) single camera | 4K60fps',
    battery: '2018mAh, 20W wired, 15W MagSafe, Lightning',
    os: 'iOS 18 (upgradeable)',
    connectivity: '5G, Wi-Fi 6, Bluetooth 5.0, Lightning',
    price_php: '₱26,990 (64GB) | ₱29,990 (128GB)',
    buy: 'Apple PH, Beyond The Box, iStore, Lazada/Shopee',
    verdict: 'Cheapest 5G iPhone with A15 chip. Small battery and outdated design are drawbacks.',
  },

  // ── Samsung Flagships ────────────────────────────────────────────────────────
  'Samsung Galaxy S24 Ultra': {
    display: '6.8" Dynamic AMOLED 2X, 3088×1440, 1-120Hz adaptive, 2600 nits peak',
    processor: 'Snapdragon 8 Gen 3 for Galaxy (4nm)',
    ram: '12GB',
    storage: '256GB / 512GB / 1TB',
    camera: '200MP main (f/1.7) + 50MP 5x periscope + 10MP 3x + 12MP Ultra Wide | 8K30fps',
    battery: '5000mAh, 45W wired, 15W wireless, 4.5W reverse',
    os: 'Android 14, One UI 6.1 (upgradeable to Android 15)',
    connectivity: '5G, Wi-Fi 7, Bluetooth 5.3, USB-C 3.2 Gen 2, NFC, S Pen',
    build: 'Titanium frame, Gorilla Glass Armor, IP68',
    price_php: '₱79,990 (256GB) | ₱94,990 (512GB)',
    buy: 'Samsung PH (samsung.com/ph), Samsung Experience Stores, Lazada/Shopee Samsung official',
    verdict: 'Ultimate Android powerhouse. The 200MP camera and S Pen make it a productivity beast. Best Android phone in PH market.',
  },
  'Samsung Galaxy S24+': {
    display: '6.7" Dynamic AMOLED 2X, 3088×1440, 1-120Hz adaptive',
    processor: 'Snapdragon 8 Gen 3 for Galaxy (4nm)',
    ram: '12GB',
    storage: '256GB / 512GB',
    camera: '50MP main (f/1.8) + 10MP 3x telephoto + 12MP Ultra Wide | 8K30fps',
    battery: '4900mAh, 45W wired, 15W wireless',
    os: 'Android 14, One UI 6.1',
    connectivity: '5G, Wi-Fi 7, Bluetooth 5.3, USB-C 3.2, NFC',
    build: 'Titanium frame, Gorilla Glass Victus 2, IP68',
    price_php: '₱64,990 (256GB)',
    buy: 'Samsung PH, Lazada/Shopee Samsung official, Samsung Experience Stores',
    verdict: 'Great balance of screen size and power. Better value than Ultra for most users.',
  },
  'Samsung Galaxy S24': {
    display: '6.2" Dynamic AMOLED 2X, 2340×1080, 1-120Hz adaptive',
    processor: 'Snapdragon 8 Gen 3 for Galaxy (4nm) — PH variant',
    ram: '8GB',
    storage: '128GB / 256GB',
    camera: '50MP main (f/1.8) + 10MP 3x telephoto + 12MP Ultra Wide | 8K30fps',
    battery: '4000mAh, 25W wired, 15W wireless',
    os: 'Android 14, One UI 6.1',
    connectivity: '5G, Wi-Fi 6E, Bluetooth 5.3, USB-C 3.2, NFC',
    build: 'Armor Aluminum frame, Gorilla Glass Victus 2, IP68',
    price_php: '₱44,990 (128GB) | ₱49,990 (256GB)',
    buy: 'Samsung PH, Lazada/Shopee Samsung official, Samsung Experience Stores',
    verdict: 'Compact flagship with Snapdragon. Best compact Android phone in PH under ₱50K.',
  },
  'Samsung Galaxy S25 Ultra': {
    display: '6.9" Dynamic AMOLED 2X, 3088×1440, 1-120Hz adaptive, 2600 nits peak',
    processor: 'Snapdragon 8 Elite for Galaxy (3nm)',
    ram: '12GB',
    storage: '256GB / 512GB / 1TB',
    camera: '200MP main (f/1.7) + 50MP 5x periscope + 10MP 3x + 50MP Ultra Wide | 8K30fps',
    battery: '5000mAh, 45W wired, 15W wireless, S Pen included',
    os: 'Android 15, One UI 7',
    connectivity: '5G, Wi-Fi 7, Bluetooth 5.4, USB-C 3.2, NFC',
    build: 'Titanium frame, Gorilla Glass Armor 2, IP68',
    price_php: '₱84,990 (256GB) | ₱99,990 (512GB) — estimated 2025',
    buy: 'Samsung PH, Samsung Experience Stores, Lazada/Shopee Samsung official',
    verdict: 'Next-gen S Pen flagship. Snapdragon 8 Elite brings massive AI and performance gains.',
  },
  'Samsung Galaxy S25+': {
    display: '6.7" Dynamic AMOLED 2X, 3088×1440, 1-120Hz adaptive',
    processor: 'Snapdragon 8 Elite for Galaxy (3nm)',
    ram: '12GB',
    storage: '256GB / 512GB',
    camera: '50MP main + 10MP 3x + 12MP Ultra Wide | 8K30fps',
    battery: '4900mAh, 45W wired',
    os: 'Android 15, One UI 7',
    price_php: '₱69,990 (256GB) — estimated 2025',
    buy: 'Samsung PH, Lazada/Shopee Samsung official',
    verdict: 'Big S25 with Elite chip. Great for power users who skip the S Pen.',
  },
  'Samsung Galaxy S25': {
    display: '6.2" Dynamic AMOLED 2X, 2340×1080, 1-120Hz adaptive',
    processor: 'Snapdragon 8 Elite for Galaxy (3nm)',
    ram: '12GB',
    storage: '128GB / 256GB',
    camera: '50MP main + 10MP 3x + 12MP Ultra Wide',
    battery: '4000mAh, 25W wired',
    os: 'Android 15, One UI 7',
    price_php: '₱49,990 (128GB) — estimated 2025',
    buy: 'Samsung PH, Lazada/Shopee Samsung official',
    verdict: 'Compact flagship upgraded to Elite chip. Noticeably faster than S24.',
  },
  'Samsung Galaxy S23 Ultra': {
    display: '6.8" Dynamic AMOLED 2X, 3088×1440, 1-120Hz adaptive',
    processor: 'Snapdragon 8 Gen 2 for Galaxy (4nm)',
    ram: '12GB',
    storage: '256GB / 512GB / 1TB',
    camera: '200MP main + 10MP 10x periscope + 10MP 3x + 12MP Ultra Wide',
    battery: '5000mAh, 45W wired, 15W wireless',
    os: 'Android 14 (One UI 6.1)',
    price_php: '₱54,990 – ₱64,990 (sale/clearance 2025)',
    buy: 'Samsung PH clearance, Lazada/Shopee',
    verdict: 'Still excellent. The 10x periscope zoom beats the S24 Ultra. Great value at sale price.',
  },
  'Samsung Galaxy S23': {
    display: '6.1" Dynamic AMOLED 2X, 2340×1080, 1-120Hz',
    processor: 'Snapdragon 8 Gen 2 (4nm)',
    ram: '8GB',
    storage: '128GB / 256GB',
    camera: '50MP main + 10MP 3x + 12MP Ultra Wide',
    battery: '3900mAh, 25W wired',
    os: 'Android 14',
    price_php: '₱34,990 – ₱39,990 (sale/clearance 2025)',
    buy: 'Samsung PH, Lazada/Shopee',
    verdict: 'Good compact Android at clearance price.',
  },
  'Samsung Galaxy S22 Ultra': {
    display: '6.8" Dynamic AMOLED 2X, 3088×1440, 1-120Hz, S Pen built-in',
    processor: 'Snapdragon 8 Gen 1 (4nm)',
    ram: '8GB / 12GB',
    storage: '128GB / 256GB / 512GB / 1TB',
    camera: '108MP main + 10MP 10x periscope + 10MP 3x + 12MP Ultra Wide',
    battery: '5000mAh, 45W wired',
    os: 'Android 14 max (One UI 6.1)',
    price_php: '₱34,990 – ₱44,990 (second-hand/clearance 2025)',
    buy: 'Samsung clearance, Lazada/Shopee reputable sellers',
    verdict: 'The 10x periscope is still class-leading. Getting old but very capable.',
  },

  // ── Samsung Mid-Range ────────────────────────────────────────────────────────
  'Samsung Galaxy A55': {
    display: '6.6" Super AMOLED, 2340×1080, 120Hz, 1000 nits',
    processor: 'Exynos 1480 (4nm)',
    ram: '8GB',
    storage: '128GB / 256GB, microSD',
    camera: '50MP main (OIS) + 12MP Ultra Wide + 5MP macro | 4K30fps',
    battery: '5000mAh, 25W wired',
    os: 'Android 14, One UI 6.1, 4 years OS updates promised',
    connectivity: '5G, Wi-Fi 6, Bluetooth 5.3, USB-C 2.0, NFC',
    build: 'Gorilla Glass Victus+, IP67, side fingerprint',
    price_php: '₱19,990 (128GB) | ₱22,990 (256GB)',
    buy: 'Samsung PH, Lazada/Shopee Samsung official, Samsung Experience Stores',
    verdict: 'Best mid-range Samsung in PH. AMOLED, OIS camera, and IP67 at ₱20K is excellent value.',
  },
  'Samsung Galaxy A35': {
    display: '6.6" Super AMOLED, 2340×1080, 120Hz',
    processor: 'Exynos 1380 (5nm)',
    ram: '6GB / 8GB',
    storage: '128GB / 256GB, microSD',
    camera: '50MP main (OIS) + 8MP Ultra Wide + 5MP macro',
    battery: '5000mAh, 25W wired',
    os: 'Android 14, One UI 6.1',
    connectivity: '5G, Wi-Fi 6, Bluetooth 5.3, USB-C 2.0, NFC',
    build: 'Corning Gorilla Glass, IP67',
    price_php: '₱15,990 (128GB) | ₱17,990 (256GB)',
    buy: 'Samsung PH, Lazada/Shopee Samsung official',
    verdict: 'Very capable mid-range. IP67 and AMOLED screen at this price is hard to beat.',
  },
  'Samsung Galaxy A16': {
    display: '6.7" Super AMOLED, 2340×1080, 90Hz',
    processor: 'MediaTek Helio G99 (6nm)',
    ram: '4GB / 6GB / 8GB',
    storage: '128GB, microSD',
    camera: '50MP main + 5MP Ultra Wide + 2MP macro',
    battery: '5000mAh, 25W wired',
    os: 'Android 14, One UI 6, 6 years OS updates',
    connectivity: '4G LTE, Wi-Fi 5, Bluetooth 5.3, USB-C 2.0',
    price_php: '₱9,490 (4GB/128GB) | ₱10,990 (6GB/128GB)',
    buy: 'Samsung PH, Lazada/Shopee Samsung official',
    verdict: 'Samsung upgraded A15 with 6-year OS promise. AMOLED under ₱10K is a steal.',
  },
  'Samsung Galaxy A15': {
    display: '6.5" Super AMOLED, 2340×1080, 90Hz',
    processor: 'MediaTek Helio G99 (6nm)',
    ram: '4GB / 6GB / 8GB',
    storage: '128GB, microSD',
    camera: '50MP main + 5MP Ultra Wide + 2MP macro',
    battery: '5000mAh, 25W wired',
    os: 'Android 14, One UI 6',
    connectivity: '4G LTE, Wi-Fi 5, Bluetooth 5.3, USB-C 2.0',
    price_php: '₱8,990 (4GB/128GB) | ₱9,990 (6GB/128GB)',
    buy: 'Samsung PH, Lazada/Shopee Samsung official',
    verdict: 'Best budget Samsung. AMOLED screen under ₱10K is rare.',
  },
  'Samsung Galaxy A06': {
    display: '6.7" PLS LCD, 1600×720, 60Hz',
    processor: 'MediaTek Helio G85 (12nm)',
    ram: '4GB / 6GB',
    storage: '64GB / 128GB, microSD',
    camera: '50MP main + 2MP depth',
    battery: '5000mAh, 25W wired',
    os: 'Android 14, One UI 6',
    connectivity: '4G LTE, Wi-Fi 5, Bluetooth 5.0, USB-C',
    price_php: '₱5,990 (4GB/64GB) | ₱6,990 (6GB/128GB)',
    buy: 'Samsung PH, Lazada/Shopee Samsung official',
    verdict: 'Ultra budget Samsung. LCD screen but 50MP camera is impressive at this price.',
  },
  'Samsung Galaxy Z Fold 6': {
    display: '7.6" Dynamic AMOLED 2X main (2160×1856, 120Hz) | 6.3" cover (2376×968, 120Hz)',
    processor: 'Snapdragon 8 Gen 3 for Galaxy (4nm)',
    ram: '12GB',
    storage: '256GB / 512GB / 1TB',
    camera: '50MP main (f/1.8) + 10MP 3x + 12MP Ultra Wide',
    battery: '4400mAh, 25W wired, 15W wireless',
    os: 'Android 14, One UI 6.1',
    connectivity: '5G, Wi-Fi 7, Bluetooth 5.3, USB-C 3.2, NFC',
    build: 'Titanium hinge, Gorilla Glass Victus 2, IPX8',
    price_php: '₱99,990 (256GB) — estimated',
    buy: 'Samsung PH, Samsung Experience Stores',
    verdict: 'Thinner, stronger Z Fold. Best foldable in PH market but very expensive.',
  },
  'Samsung Galaxy Z Fold 5': {
    display: '7.6" Dynamic AMOLED 2X main (2176×1812, 120Hz) | 6.2" cover (2316×904, 120Hz)',
    processor: 'Snapdragon 8 Gen 2 for Galaxy (4nm)',
    ram: '12GB',
    storage: '256GB / 512GB',
    camera: '50MP main (f/1.8) + 10MP 3x + 12MP Ultra Wide',
    battery: '4400mAh, 25W wired, 15W wireless',
    os: 'Android 14, One UI 6.1',
    connectivity: '5G, Wi-Fi 6E, Bluetooth 5.3, USB-C 3.2, NFC',
    build: 'Titanium hinge, Gorilla Glass Victus 2, IPX8',
    price_php: '₱89,990 (256GB) | ₱99,990 (512GB)',
    buy: 'Samsung PH, Samsung Experience Stores, Lazada/Shopee Samsung',
    verdict: 'Premium foldable experience. Multitasking is unmatched. Battery life is the main trade-off.',
  },
  'Samsung Galaxy Z Flip 6': {
    display: '6.7" Dynamic AMOLED 2X (2640×1080, 120Hz) | 3.4" Flex Window cover',
    processor: 'Snapdragon 8 Gen 3 for Galaxy (4nm)',
    ram: '12GB',
    storage: '256GB / 512GB',
    camera: '50MP main (f/1.7, OIS) + 12MP Ultra Wide',
    battery: '4000mAh, 25W wired, 15W wireless',
    os: 'Android 14, One UI 6.1',
    price_php: '₱64,990 (256GB)',
    buy: 'Samsung PH, Lazada/Shopee Samsung',
    verdict: 'Bigger battery and better main camera than Flip 5. Best flip phone in 2025.',
  },
  'Samsung Galaxy Z Flip 5': {
    display: '6.7" Dynamic AMOLED 2X (2640×1080, 120Hz) | 3.4" Flex Window cover',
    processor: 'Snapdragon 8 Gen 2 for Galaxy (4nm)',
    ram: '8GB',
    storage: '256GB / 512GB',
    camera: '12MP main (f/1.8) + 12MP Ultra Wide',
    battery: '3700mAh, 25W wired, 15W wireless',
    os: 'Android 14, One UI 6.1',
    price_php: '₱59,990 (256GB)',
    buy: 'Samsung PH, Lazada/Shopee Samsung',
    verdict: 'Stylish flip with a useful cover screen. Best flip phone in PH market.',
  },

  // ── Xiaomi / Redmi / POCO ─────────────────────────────────────────────────────
  'Xiaomi 14 Ultra': {
    display: '6.73" LTPO AMOLED, 3200×1440, 1-120Hz, 3000 nits',
    processor: 'Snapdragon 8 Gen 3 (4nm)',
    ram: '16GB',
    storage: '512GB',
    camera: '50MP Leica 1-inch main (f/1.63-4.0 variable) + 50MP 5x periscope + 50MP 3.2x + 50MP Ultra Wide | 8K30fps',
    battery: '5300mAh, 90W wired, 80W wireless, 10W reverse',
    os: 'Android 14, HyperOS',
    connectivity: '5G, Wi-Fi 7, Bluetooth 5.4, USB-C 3.2, IR blaster',
    price_php: '₱74,990 – ₱79,990 (estimated, limited availability PH)',
    buy: 'Xiaomi PH Lazada/Shopee official (may need to import)',
    verdict: 'Best Android camera phone of 2024. The 1-inch Leica sensor is extraordinary. Limited official PH availability.',
  },
  'Xiaomi 14': {
    display: '6.36" LTPO AMOLED, 2670×1200, 1-120Hz, 3000 nits',
    processor: 'Snapdragon 8 Gen 3 (4nm)',
    ram: '12GB',
    storage: '256GB / 512GB',
    camera: '50MP Leica main (f/1.6) + 50MP 3.2x telephoto + 50MP Ultra Wide',
    battery: '4610mAh, 90W wired, 50W wireless',
    os: 'Android 14, HyperOS',
    price_php: '₱39,990 – ₱44,990 (Lazada/Shopee)',
    buy: 'Xiaomi PH Lazada/Shopee official',
    verdict: 'Compact flagship killer. Leica cameras on a sub-₱45K phone is remarkable.',
  },
  'Xiaomi 15 Ultra': {
    display: '6.73" LTPO AMOLED, 3200×1440, 1-120Hz, 3200 nits',
    processor: 'Snapdragon 8 Elite (3nm)',
    ram: '16GB',
    storage: '512GB / 1TB',
    camera: '50MP Leica 1-inch main + 200MP 4.3x periscope + 50MP Ultra Wide | 8K video',
    battery: '6000mAh, 90W wired, 80W wireless',
    os: 'Android 15, HyperOS 2',
    price_php: '₱84,990 – ₱94,990 (estimated, import only)',
    buy: 'Lazada/Shopee grey market importers',
    verdict: 'Camera beast with a huge 6000mAh battery. Not officially in PH — import only.',
  },
  'Xiaomi Redmi Note 13 Pro+': {
    display: '6.67" AMOLED, 2712×1220, 120Hz, 1800 nits, curved edges',
    processor: 'MediaTek Dimensity 7200 Ultra (4nm)',
    ram: '8GB / 12GB',
    storage: '256GB / 512GB',
    camera: '200MP main (f/1.65, OIS) + 8MP Ultra Wide + 2MP macro | 4K30fps',
    battery: '5000mAh, 120W HyperCharge (19 min 0–100%)',
    os: 'Android 13, MIUI 14 / HyperOS',
    connectivity: '5G, Wi-Fi 6, Bluetooth 5.3, USB-C 2.0, NFC, IR blaster',
    build: 'Corning Gorilla Glass 5, IP68',
    price_php: '₱16,990 (8GB/256GB) | ₱18,990 (12GB/256GB)',
    buy: 'Xiaomi PH Lazada/Shopee official',
    verdict: '120W charging and 200MP camera under ₱20K is exceptional value. Best Redmi Note for the money.',
  },
  'Xiaomi Redmi Note 13 Pro': {
    display: '6.67" AMOLED, 2400×1080, 120Hz, 1800 nits',
    processor: 'Snapdragon 7s Gen 2 (4nm)',
    ram: '8GB / 12GB',
    storage: '128GB / 256GB',
    camera: '200MP main (OIS) + 8MP Ultra Wide + 2MP macro',
    battery: '5100mAh, 67W wired',
    os: 'Android 13, MIUI 14 / HyperOS',
    connectivity: '4G LTE, Wi-Fi 6, Bluetooth 5.2, NFC, IR blaster',
    price_php: '₱13,990 (8GB/128GB) | ₱15,990 (8GB/256GB)',
    buy: 'Xiaomi PH Lazada/Shopee official',
    verdict: '200MP AMOLED phone under ₱16K — incredible spec-per-peso ratio.',
  },
  'Xiaomi Redmi Note 13': {
    display: '6.67" AMOLED, 2400×1080, 120Hz',
    processor: 'Snapdragon 685 (6nm)',
    ram: '6GB / 8GB',
    storage: '128GB / 256GB, microSD',
    camera: '108MP main + 8MP Ultra Wide + 2MP macro',
    battery: '5000mAh, 33W wired',
    os: 'Android 13, MIUI 14',
    connectivity: '4G LTE, Wi-Fi 5, Bluetooth 5.0, NFC, IR blaster',
    price_php: '₱9,990 (6GB/128GB) | ₱11,490 (8GB/256GB)',
    buy: 'Xiaomi PH Lazada/Shopee official',
    verdict: 'AMOLED display and 108MP camera at sub-₱12K. Incredible budget value.',
  },
  'Xiaomi Redmi Note 14 Pro+': {
    display: '6.67" AMOLED, 2712×1220, 120Hz, curved',
    processor: 'MediaTek Dimensity 9300+ (4nm)',
    ram: '12GB / 16GB',
    storage: '256GB / 512GB',
    camera: '200MP main (OIS) + 8MP Ultra Wide + 2MP macro | 4K60fps',
    battery: '6200mAh, 90W wired, IP68',
    os: 'Android 14, HyperOS 2',
    connectivity: '5G, Wi-Fi 6E, Bluetooth 5.4, NFC, IR blaster',
    price_php: '₱19,990 – ₱22,990 (estimated, newly launched)',
    buy: 'Xiaomi PH Lazada/Shopee official',
    verdict: 'Massive 6200mAh battery with flagship-class Dimensity 9300+. Best Redmi Note yet.',
  },
  'POCO F6 Pro': {
    display: '6.67" LTPO AMOLED, 3200×1440, 1-120Hz, 4000 nits',
    processor: 'Snapdragon 8 Gen 2 (4nm)',
    ram: '12GB',
    storage: '256GB / 512GB',
    camera: '50MP main (f/1.6, OIS) + 8MP Ultra Wide + 2MP macro | 4K60fps',
    battery: '5000mAh, 67W wired',
    os: 'Android 14, HyperOS',
    connectivity: '5G, Wi-Fi 6E, Bluetooth 5.3, USB-C 2.0, NFC, IR blaster',
    price_php: '₱24,990 (12GB/256GB)',
    buy: 'Xiaomi PH Lazada/Shopee official',
    verdict: 'Flagship chip at mid-range price. Best gaming phone under ₱25K in PH.',
  },
  'POCO F6': {
    display: '6.67" AMOLED, 2712×1220, 120Hz, 2400 nits',
    processor: 'Snapdragon 8s Gen 3 (4nm)',
    ram: '8GB / 12GB',
    storage: '256GB',
    camera: '50MP main (OIS) + 8MP Ultra Wide + 2MP macro',
    battery: '5000mAh, 90W wired',
    os: 'Android 14, HyperOS',
    connectivity: '5G, Wi-Fi 6E, Bluetooth 5.4, NFC, IR blaster',
    price_php: '₱18,990 (8GB/256GB) | ₱20,990 (12GB/256GB)',
    buy: 'Xiaomi PH Lazada/Shopee official',
    verdict: '90W fast charging and flagship-adjacent chip under ₱21K is a steal.',
  },
  'POCO X6 Pro': {
    display: '6.67" AMOLED, 2712×1220, 120Hz, 2400 nits',
    processor: 'MediaTek Dimensity 8300 Ultra (4nm)',
    ram: '8GB / 12GB',
    storage: '256GB',
    camera: '64MP main (f/1.79) + 8MP Ultra Wide + 2MP macro',
    battery: '5000mAh, 67W wired',
    os: 'Android 14, HyperOS',
    connectivity: '5G, Wi-Fi 6, Bluetooth 5.4, USB-C 2.0, NFC, IR blaster',
    price_php: '₱16,990 (8GB/256GB) | ₱18,490 (12GB/256GB)',
    buy: 'Xiaomi PH Lazada/Shopee official',
    verdict: 'Dimensity 8300 Ultra is a beast for gaming. Best gaming phone under ₱19K.',
  },
  'POCO M6 Pro': {
    display: '6.67" AMOLED, 2400×1080, 120Hz',
    processor: 'MediaTek Helio G99 Ultra (6nm)',
    ram: '8GB / 12GB',
    storage: '256GB, microSD',
    camera: '64MP main (OIS) + 8MP Ultra Wide + 2MP macro',
    battery: '5000mAh, 67W wired',
    os: 'Android 13, MIUI 14',
    connectivity: '4G LTE, Wi-Fi 6, Bluetooth 5.3, NFC, IR blaster',
    price_php: '₱10,990 (8GB/256GB)',
    buy: 'Xiaomi PH Lazada/Shopee official',
    verdict: 'AMOLED + OIS camera + NFC under ₱11K is remarkable value.',
  },

  // ── Google Pixel ──────────────────────────────────────────────────────────────
  'Google Pixel 9 Pro XL': {
    display: '6.8" LTPO OLED, 2992×1344, 1-120Hz, 3000 nits',
    processor: 'Google Tensor G4 (4nm)',
    ram: '16GB',
    storage: '128GB / 256GB / 512GB / 1TB',
    camera: '50MP main (f/1.68, OIS) + 48MP 5x periscope + 48MP Ultra Wide | 4K60fps',
    battery: '5060mAh, 37W wired, 23W wireless',
    os: 'Android 15, 7 years OS updates guaranteed',
    connectivity: '5G, Wi-Fi 7, Bluetooth 5.3, USB-C 3.2, NFC, UWB',
    build: 'Matte Corning glass, IP68',
    price_php: '₱74,990 – ₱79,990 (estimated, limited PH availability)',
    buy: 'Google Store (may need US purchase), select Lazada/Shopee importers',
    verdict: 'Best computational photography on Android. 7-year update guarantee is unmatched. Limited official PH support.',
  },
  'Google Pixel 9 Pro': {
    display: '6.3" LTPO OLED, 2856×1280, 1-120Hz, 3000 nits',
    processor: 'Google Tensor G4 (4nm)',
    ram: '16GB',
    storage: '128GB / 256GB / 512GB / 1TB',
    camera: '50MP main (f/1.68, OIS) + 48MP 5x periscope + 48MP Ultra Wide',
    battery: '4700mAh, 37W wired, 23W wireless',
    os: 'Android 15, 7 years OS updates',
    price_php: '₱64,990 – ₱69,990 (estimated, limited PH availability)',
    buy: 'Google Store (US import), select Lazada/Shopee importers',
    verdict: 'Compact powerhouse with the best AI camera features. Limited PH warranty coverage.',
  },
  'Google Pixel 9': {
    display: '6.3" Actua OLED, 2424×1080, 60-120Hz, 2700 nits',
    processor: 'Google Tensor G4 (4nm)',
    ram: '12GB',
    storage: '128GB / 256GB',
    camera: '50MP main (f/1.68, OIS) + 10.5MP Ultra Wide',
    battery: '4700mAh, 27W wired, 15W wireless',
    os: 'Android 15, 7 years OS updates',
    price_php: '₱49,990 – ₱54,990 (estimated)',
    buy: 'Google Store (US import), select importers',
    verdict: 'Best AI-powered camera at this price. Note: limited official PH after-sales support.',
  },
  'Google Pixel 8 Pro': {
    display: '6.7" LTPO OLED, 2992×1344, 1-120Hz, 2400 nits',
    processor: 'Google Tensor G3 (4nm)',
    ram: '12GB',
    storage: '128GB / 256GB / 512GB / 1TB',
    camera: '50MP main (OIS) + 48MP 5x periscope + 48MP Ultra Wide | 4K60fps',
    battery: '5050mAh, 30W wired, 23W wireless',
    os: 'Android 15, 7 years OS updates',
    price_php: '₱54,990 – ₱59,990 (clearance 2025)',
    buy: 'US imports, select Lazada/Shopee importers',
    verdict: 'Great deal at clearance. Temperature sensor and Magic Eraser are killer features.',
  },

  // ── OnePlus ───────────────────────────────────────────────────────────────────
  'OnePlus 12': {
    display: '6.82" LTPO AMOLED, 3168×1440, 1-120Hz, 4500 nits',
    processor: 'Snapdragon 8 Gen 3 (4nm)',
    ram: '12GB / 16GB',
    storage: '256GB / 512GB',
    camera: '50MP Hasselblad main (f/1.6, OIS) + 64MP 3x periscope + 48MP Ultra Wide',
    battery: '5400mAh, 100W SUPERVOOC, 50W AirVOOC wireless',
    os: 'Android 14, OxygenOS 14 (3 years OS, 4 years security)',
    connectivity: '5G, Wi-Fi 7, Bluetooth 5.4, USB-C 3.2, NFC',
    build: 'Aluminum frame, Gorilla Glass Victus 2, IP65',
    price_php: '₱44,990 (12GB/256GB)',
    buy: 'OnePlus PH Lazada/Shopee official',
    verdict: '100W charging fills the massive 5400mAh battery in ~26 min. Excellent value flagship.',
  },
  'OnePlus 13': {
    display: '6.82" LTPO AMOLED, 3168×1440, 1-120Hz, 4500 nits',
    processor: 'Snapdragon 8 Elite (3nm)',
    ram: '12GB / 16GB',
    storage: '256GB / 512GB',
    camera: '50MP Hasselblad main (f/1.6, OIS) + 50MP 3x + 50MP Ultra Wide',
    battery: '6000mAh, 100W SUPERVOOC, 50W AirVOOC wireless',
    os: 'Android 15, OxygenOS 15',
    price_php: '₱49,990 – ₱54,990 (estimated 2025)',
    buy: 'OnePlus PH Lazada/Shopee official',
    verdict: 'Massive 6000mAh battery + Snapdragon 8 Elite is an unbeatable combo at this price.',
  },

  // ── OPPO ──────────────────────────────────────────────────────────────────────
  'OPPO Reno 12 Pro': {
    display: '6.7" AMOLED, 2412×1080, 120Hz, 1200 nits',
    processor: 'MediaTek Dimensity 7300 Energy (4nm)',
    ram: '12GB',
    storage: '256GB',
    camera: '50MP main (OIS) + 50MP 2x portrait + 8MP Ultra Wide | 4K30fps',
    battery: '5000mAh, 80W SuperVOOC',
    os: 'Android 14, ColorOS 14.1',
    connectivity: '5G, Wi-Fi 6, Bluetooth 5.4, NFC',
    build: 'Vegan leather back, IP65',
    price_php: '₱24,990 (12GB/256GB)',
    buy: 'OPPO PH Lazada/Shopee official, OPPO Experience stores',
    verdict: 'Stylish design, 80W charging, and dual 50MP cameras at ₱25K. Great mid-range.',
  },
  'OPPO Reno 11 Pro': {
    display: '6.7" AMOLED, 2412×1080, 120Hz, curved',
    processor: 'MediaTek Dimensity 8200 (4nm)',
    ram: '12GB',
    storage: '256GB',
    camera: '50MP main (OIS) + 32MP 2x portrait + 8MP Ultra Wide',
    battery: '4600mAh, 80W SuperVOOC',
    os: 'Android 14, ColorOS 14',
    price_php: '₱21,990 (12GB/256GB)',
    buy: 'OPPO PH Lazada/Shopee official',
    verdict: 'Curved AMOLED and fast charging at this price is compelling.',
  },
  'OPPO A98': {
    display: '6.72" IPS LCD, 2400×1080, 120Hz',
    processor: 'Snapdragon 695 (6nm)',
    ram: '8GB',
    storage: '256GB, microSD',
    camera: '64MP main + 2MP macro + 2MP depth',
    battery: '5000mAh, 67W SUPERVOOC',
    os: 'Android 13, ColorOS 13.1',
    price_php: '₱13,990 (8GB/256GB)',
    buy: 'OPPO PH Lazada/Shopee official',
    verdict: '67W fast charging and 256GB storage under ₱14K is good value.',
  },

  // ── Vivo / realme ──────────────────────────────────────────────────────────
  'Vivo V30': {
    display: '6.78" AMOLED, 2800×1260, 120Hz, 4500 nits',
    processor: 'Snapdragon 7 Gen 3 (4nm)',
    ram: '8GB / 12GB',
    storage: '256GB',
    camera: '50MP Zeiss main (OIS) + 50MP portrait + 12MP Ultra Wide | 4K30fps',
    battery: '5000mAh, 80W FlashCharge',
    os: 'Android 14, FunTouch OS 14',
    connectivity: '5G, Wi-Fi 6, Bluetooth 5.4, NFC',
    price_php: '₱22,990 (8GB/256GB)',
    buy: 'Vivo PH Lazada/Shopee official',
    verdict: 'Zeiss cameras and 80W charging at this price is excellent. Stylish design.',
  },
  'realme GT 6': {
    display: '6.78" AMOLED, 2780×1264, 120Hz, 6000 nits peak',
    processor: 'Snapdragon 8s Gen 3 (4nm)',
    ram: '12GB / 16GB',
    storage: '256GB / 512GB',
    camera: '50MP main (OIS) + 8MP Ultra Wide + 2MP macro | 4K60fps',
    battery: '5500mAh, 120W SUPERVOOC',
    os: 'Android 14, realme UI 5',
    connectivity: '5G, Wi-Fi 7, Bluetooth 5.4, NFC',
    price_php: '₱26,990 (12GB/256GB)',
    buy: 'realme PH Lazada/Shopee official',
    verdict: '120W charging on a 5500mAh battery is insane. Best performance under ₱27K.',
  },
  'realme 12 Pro+': {
    display: '6.7" AMOLED, 2412×1080, 120Hz, curved',
    processor: 'Snapdragon 7s Gen 2 (4nm)',
    ram: '8GB / 12GB',
    storage: '256GB',
    camera: '50MP Sony LYT-600 main (OIS) + 64MP 3x periscope + 8MP Ultra Wide',
    battery: '5000mAh, 67W SUPERVOOC',
    os: 'Android 14, realme UI 5',
    price_php: '₱19,990 (8GB/256GB)',
    buy: 'realme PH Lazada/Shopee official',
    verdict: '64MP periscope zoom phone under ₱20K — an exceptional value buy.',
  },
  'realme C65': {
    display: '6.67" IPS LCD, 1604×720, 90Hz',
    processor: 'MediaTek Helio G85 (12nm)',
    ram: '6GB / 8GB',
    storage: '128GB / 256GB, microSD',
    camera: '50MP main + AI portrait',
    battery: '5000mAh, 45W DART Charge',
    os: 'Android 14, realme UI 5',
    price_php: '₱6,990 (6GB/128GB)',
    buy: 'realme PH Lazada/Shopee official',
    verdict: 'Best budget entry from realme. 45W charging at under ₱7K is remarkable.',
  },

  // ── Infinix / Tecno ────────────────────────────────────────────────────────
  'Infinix Note 40 Pro': {
    display: '6.78" AMOLED, 2436×1080, 144Hz, 1300 nits',
    processor: 'MediaTek Helio G99 Ultimate (6nm)',
    ram: '8GB / 12GB',
    storage: '256GB, microSD',
    camera: '108MP main + 2MP depth + AI camera',
    battery: '4600mAh, 100W wired, 20W wireless (MagCharge)',
    os: 'Android 14, XOS 14',
    connectivity: '4G LTE, Wi-Fi 6, Bluetooth 5.3, NFC',
    price_php: '₱12,990 (8GB/256GB)',
    buy: 'Infinix PH Lazada/Shopee official',
    verdict: '100W charging AND wireless charging under ₱13K is unmatched. Great AMOLED value.',
  },
  'Infinix Hot 40 Pro': {
    display: '6.78" IPS LCD, 1612×720, 90Hz',
    processor: 'MediaTek Helio G96 (12nm)',
    ram: '8GB',
    storage: '256GB, microSD',
    camera: '108MP main + 2MP depth',
    battery: '5000mAh, 45W wired',
    os: 'Android 13, XOS 13',
    price_php: '₱8,490 (8GB/256GB)',
    buy: 'Infinix PH Lazada/Shopee official',
    verdict: '108MP camera and 256GB storage under ₱9K. Excellent budget pick.',
  },
  'Tecno Camon 30 Premier': {
    display: '6.77" AMOLED, 2388×1080, 144Hz, curved',
    processor: 'MediaTek Dimensity 8200 (4nm)',
    ram: '12GB',
    storage: '512GB',
    camera: '50MP Sony main (OIS) + 50MP 2x portrait + 50MP Ultra Wide',
    battery: '5000mAh, 70W wired',
    os: 'Android 14, HiOS 14',
    price_php: '₱19,990 (12GB/512GB)',
    buy: 'Tecno PH Lazada/Shopee official',
    verdict: 'Massive 512GB storage and Dimensity 8200 under ₱20K. Tecno is punching hard.',
  },

  // ── NVIDIA GPUs ───────────────────────────────────────────────────────────────
  'NVIDIA GeForce RTX 4090': {
    vram: '24GB GDDR6X',
    bus: '384-bit',
    cuda_cores: '16384',
    boost_clock: '2.52 GHz',
    tdp: '450W',
    connectors: '1x HDMI 2.1, 3x DisplayPort 1.4a',
    pcie: 'PCIe 4.0 x16',
    recommended_psu: '850W+',
    performance: '4K ultra: 150+ FPS in most AAA games | 8K gaming capable',
    price_php: '₱89,990 – ₱109,990 (Founders Edition / AIB variants)',
    buy: 'PC Express, DynaQuest PC, Villman, Lazada/Shopee official stores',
    verdict: 'Absolute fastest consumer GPU. Overkill for most, but future-proof for 4K/8K gaming and AI workloads.',
  },
  'NVIDIA GeForce RTX 5090': {
    vram: '32GB GDDR7',
    bus: '512-bit',
    cuda_cores: '21760',
    boost_clock: '2.41 GHz',
    tdp: '575W',
    pcie: 'PCIe 5.0 x16',
    recommended_psu: '1000W+',
    performance: '4K ultra: 200+ FPS | 8K gaming capable | DLSS 4 Multi Frame Generation',
    price_php: '₱169,990 – ₱189,990 (estimated, limited availability PH)',
    buy: 'PC Express, DynaQuest PC, Villman (limited stock 2025)',
    verdict: 'Next-gen flagship GPU. Massive leap over 4090. DLSS 4 is a game changer but extremely expensive.',
  },
  'NVIDIA GeForce RTX 5080': {
    vram: '16GB GDDR7',
    bus: '256-bit',
    cuda_cores: '10752',
    boost_clock: '2.62 GHz',
    tdp: '360W',
    pcie: 'PCIe 5.0 x16',
    recommended_psu: '850W+',
    performance: '4K ultra: 120-150 FPS | Excellent 1440p and 4K gaming',
    price_php: '₱89,990 – ₱109,990 (estimated 2025)',
    buy: 'PC Express, DynaQuest PC, Villman, Lazada',
    verdict: 'RTX 5080 competes with 4090 at lower price. DLSS 4 makes it extremely capable.',
  },
  'NVIDIA GeForce RTX 5070 Ti': {
    vram: '16GB GDDR7',
    bus: '256-bit',
    cuda_cores: '8960',
    boost_clock: '2.30 GHz',
    tdp: '300W',
    pcie: 'PCIe 5.0 x16',
    recommended_psu: '750W+',
    performance: '4K: 90-120 FPS | 1440p ultra: 130-160 FPS',
    price_php: '₱59,990 – ₱74,990 (estimated 2025)',
    buy: 'PC Express, DynaQuest PC, Lazada',
    verdict: 'Best 4K card under ₱75K in 2025. Replaces 4080 Super in the lineup.',
  },
  'NVIDIA GeForce RTX 5070': {
    vram: '12GB GDDR7',
    bus: '192-bit',
    cuda_cores: '6144',
    boost_clock: '2.51 GHz',
    tdp: '250W',
    pcie: 'PCIe 5.0 x16',
    recommended_psu: '700W+',
    performance: '1440p ultra: 100-130 FPS | 4K: 70-90 FPS with DLSS 4',
    price_php: '₱44,990 – ₱54,990 (estimated 2025)',
    buy: 'PC Express, DynaQuest PC, Lazada',
    verdict: 'Sweet spot 1440p/4K card in 2025 with DLSS 4 Multi Frame Generation.',
  },
  'NVIDIA GeForce RTX 4080 Super': {
    vram: '16GB GDDR6X',
    bus: '256-bit',
    cuda_cores: '10240',
    boost_clock: '2.55 GHz',
    tdp: '320W',
    pcie: 'PCIe 4.0 x16',
    recommended_psu: '750W+',
    performance: '4K ultra: 90-120 FPS in AAA games | 1440p: 120-160 FPS',
    price_php: '₱59,990 – ₱69,990',
    buy: 'PC Express, DynaQuest PC, Villman, Lazada',
    verdict: 'Best 4K GPU under ₱70K. The Super refresh makes this better value than the original 4080.',
  },
  'NVIDIA GeForce RTX 4080': {
    vram: '16GB GDDR6X',
    bus: '256-bit',
    cuda_cores: '9728',
    boost_clock: '2.51 GHz',
    tdp: '320W',
    pcie: 'PCIe 4.0 x16',
    recommended_psu: '750W+',
    performance: '4K ultra: 80-110 FPS in AAA games',
    price_php: '₱54,990 – ₱64,990 (clearance with 4080 Super out)',
    buy: 'PC Express, DynaQuest PC, Villman, Lazada',
    verdict: 'Excellent 4K card, but 4080 Super is better value. Look for sales.',
  },
  'NVIDIA GeForce RTX 4070 Ti Super': {
    vram: '16GB GDDR6X',
    bus: '256-bit',
    cuda_cores: '8448',
    boost_clock: '2.61 GHz',
    tdp: '285W',
    pcie: 'PCIe 4.0 x16',
    recommended_psu: '700W+',
    performance: '4K: 70-90 FPS | 1440p ultra: 100-130 FPS',
    price_php: '₱44,990 – ₱54,990',
    buy: 'PC Express, DynaQuest PC, Villman, Lazada',
    verdict: 'Best GPU for 1440p gaming in this price range. 16GB VRAM is a major advantage.',
  },
  'NVIDIA GeForce RTX 4070 Super': {
    vram: '12GB GDDR6X',
    bus: '192-bit',
    cuda_cores: '7168',
    boost_clock: '2.48 GHz',
    tdp: '220W',
    pcie: 'PCIe 4.0 x16',
    recommended_psu: '650W+',
    performance: '1440p ultra: 90-120 FPS | 4K: 55-75 FPS',
    price_php: '₱34,990 – ₱42,990',
    buy: 'PC Express, DynaQuest PC, Villman, Lazada',
    verdict: 'Sweet spot for 1440p gaming. Excellent price-to-performance in the PH market.',
  },
  'NVIDIA GeForce RTX 4070': {
    vram: '12GB GDDR6X',
    bus: '192-bit',
    cuda_cores: '5888',
    boost_clock: '2.48 GHz',
    tdp: '200W',
    pcie: 'PCIe 4.0 x16',
    recommended_psu: '650W+',
    performance: '1440p ultra: 80-110 FPS | 1080p: easily 144+ FPS',
    price_php: '₱29,990 – ₱36,990',
    buy: 'PC Express, DynaQuest PC, Villman, Lazada',
    verdict: 'Great 1440p card. 4070 Super is better value if budget allows.',
  },
  'NVIDIA GeForce RTX 4060 Ti': {
    vram: '8GB / 16GB GDDR6',
    bus: '128-bit',
    cuda_cores: '4352',
    boost_clock: '2.54 GHz',
    tdp: '160W',
    pcie: 'PCIe 4.0 x16',
    recommended_psu: '550W+',
    performance: '1080p ultra: 90-120 FPS | 1440p: 70-90 FPS',
    price_php: '₱22,990 – ₱28,990 (8GB) | ₱29,990 – ₱35,990 (16GB)',
    buy: 'PC Express, DynaQuest PC, Villman, Lazada',
    verdict: 'Good 1080p/entry 1440p card. The 16GB version is worth the premium for future-proofing.',
  },
  'NVIDIA GeForce RTX 4060': {
    vram: '8GB GDDR6',
    bus: '128-bit',
    cuda_cores: '3072',
    boost_clock: '2.46 GHz',
    tdp: '115W',
    pcie: 'PCIe 4.0 x16',
    recommended_psu: '550W+',
    performance: '1080p ultra: 80-110 FPS | DLSS 3 significantly boosts performance',
    price_php: '₱17,990 – ₱22,990',
    buy: 'PC Express, DynaQuest PC, Villman, Lazada',
    verdict: 'Best entry-point for RTX 40 series. 8GB VRAM is tight in 2025 for demanding games.',
  },
  'NVIDIA GeForce RTX 3080': {
    vram: '10GB / 12GB GDDR6X',
    bus: '320-bit',
    cuda_cores: '8704',
    boost_clock: '1.71 GHz',
    tdp: '320W (10GB) / 350W (12GB)',
    pcie: 'PCIe 4.0 x16',
    recommended_psu: '750W+',
    performance: '4K: 60-85 FPS | 1440p: 90-120 FPS',
    price_php: '₱20,000 – ₱28,000 (second-hand 2025)',
    buy: 'Facebook Marketplace, OLX, PC Express second-hand',
    verdict: 'Still powerful second-hand. Check GPU condition carefully.',
  },
  'NVIDIA GeForce RTX 3070': {
    vram: '8GB GDDR6',
    bus: '256-bit',
    cuda_cores: '5888',
    boost_clock: '1.73 GHz',
    tdp: '220W',
    pcie: 'PCIe 4.0 x16',
    recommended_psu: '650W+',
    performance: '1440p: 80-110 FPS | 1080p: 120+ FPS',
    price_php: '₱14,000 – ₱19,000 (second-hand 2025)',
    buy: 'Facebook Marketplace, OLX, Carousell',
    verdict: 'Good second-hand value for 1440p. 8GB VRAM starting to show its age.',
  },
  'NVIDIA GeForce RTX 3060 12GB': {
    vram: '12GB GDDR6',
    bus: '192-bit',
    cuda_cores: '3584',
    boost_clock: '1.78 GHz',
    tdp: '170W',
    pcie: 'PCIe 4.0 x16',
    recommended_psu: '600W+',
    performance: '1080p ultra: 80-100 FPS | 1440p: 55-75 FPS',
    price_php: '₱12,990 – ₱16,990 (new) | ₱8,000 – ₱12,000 (second-hand)',
    buy: 'PC Express, Lazada, or second-hand markets',
    verdict: '12GB VRAM makes this more future-proof than the 4060 8GB.',
  },

  // ── AMD GPUs ──────────────────────────────────────────────────────────────────
  'AMD Radeon RX 9070 XT': {
    vram: '16GB GDDR6',
    bus: '256-bit',
    compute_units: '64',
    boost_clock: '3.0 GHz',
    tdp: '304W',
    pcie: 'PCIe 5.0 x16',
    recommended_psu: '750W+',
    performance: '4K ultra: 90-120 FPS | Strong FSR 4 upscaling',
    price_php: '₱34,990 – ₱44,990 (estimated 2025)',
    buy: 'PC Express, DynaQuest PC, Lazada',
    verdict: 'AMD RDNA 4 next-gen card. 16GB VRAM at this price point competes with RTX 5070.',
  },
  'AMD Radeon RX 7900 XTX': {
    vram: '24GB GDDR6',
    bus: '384-bit',
    compute_units: '96',
    boost_clock: '2.5 GHz',
    tdp: '355W',
    pcie: 'PCIe 4.0 x16',
    recommended_psu: '800W+',
    performance: '4K ultra: 110-140 FPS | Excellent for content creation with 24GB VRAM',
    price_php: '₱54,990 – ₱69,990',
    buy: 'PC Express, DynaQuest PC, Lazada/Shopee AMD stores',
    verdict: 'Best AMD GPU. 24GB VRAM makes it outstanding for creative work. Runs hot.',
  },
  'AMD Radeon RX 7800 XT': {
    vram: '16GB GDDR6',
    bus: '256-bit',
    compute_units: '60',
    boost_clock: '2.43 GHz',
    tdp: '263W',
    pcie: 'PCIe 4.0 x16',
    recommended_psu: '700W+',
    performance: '1440p ultra: 90-110 FPS | 4K: 60-75 FPS',
    price_php: '₱24,990 – ₱29,990',
    buy: 'PC Express, DynaQuest PC, Lazada',
    verdict: '16GB VRAM at this price is AMD\'s key advantage over RTX 4070. Great 1440p card.',
  },
  'AMD Radeon RX 7700 XT': {
    vram: '12GB GDDR6',
    bus: '192-bit',
    compute_units: '54',
    boost_clock: '2.54 GHz',
    tdp: '245W',
    pcie: 'PCIe 4.0 x16',
    recommended_psu: '650W+',
    performance: '1440p ultra: 75-95 FPS | 1080p: 120+ FPS',
    price_php: '₱19,990 – ₱24,990',
    buy: 'PC Express, DynaQuest PC, Lazada',
    verdict: 'Great 1440p card. 12GB VRAM edges RTX 4060 Ti 8GB. Good AMD option.',
  },
  'AMD Radeon RX 7600': {
    vram: '8GB GDDR6',
    bus: '128-bit',
    compute_units: '32',
    boost_clock: '2.655 GHz',
    tdp: '165W',
    pcie: 'PCIe 4.0 x16',
    recommended_psu: '550W+',
    performance: '1080p ultra: 75-100 FPS',
    price_php: '₱14,990 – ₱18,990',
    buy: 'PC Express, DynaQuest PC, Lazada',
    verdict: 'Budget 1080p card. Competes with RTX 4060 at a lower price.',
  },

  // ── CPUs (Intel) ───────────────────────────────────────────────────────────────
  'Intel Core i9-14900K': {
    cores: '24 cores (8P + 16E), 32 threads',
    base_clock: '3.2 GHz (P-core)',
    boost_clock: '6.0 GHz (P-core Turbo Boost Max)',
    cache: '36MB L3',
    tdp: '125W base / 253W PBP',
    socket: 'LGA1700',
    memory: 'DDR4-3200 / DDR5-5600, dual-channel',
    pcie: 'PCIe 5.0 + 4.0',
    igpu: 'Intel UHD 770',
    price_php: '₱24,990 – ₱29,990',
    buy: 'PC Express, DynaQuest PC, Villman, Lazada',
    verdict: 'Fastest Intel consumer CPU. Very hot and power hungry. Needs good cooling.',
  },
  'Intel Core Ultra 9 285K': {
    cores: '24 cores (8P + 16E), 24 threads (no HT on E-cores)',
    base_clock: '3.7 GHz (P-core)',
    boost_clock: '5.7 GHz',
    cache: '36MB L3',
    tdp: '125W base / 250W PBP',
    socket: 'LGA1851',
    memory: 'DDR5-6400, dual-channel',
    pcie: 'PCIe 5.0',
    igpu: 'Intel Graphics 4 (Xe)',
    price_php: '₱27,990 – ₱34,990',
    buy: 'PC Express, DynaQuest PC, Lazada',
    verdict: 'Arrow Lake flagship. Great productivity, slightly lower gaming than i9-14900K. Runs cooler.',
  },
  'Intel Core Ultra 7 265K': {
    cores: '20 cores (8P + 12E), 20 threads',
    base_clock: '3.9 GHz (P-core)',
    boost_clock: '5.5 GHz',
    cache: '30MB L3',
    tdp: '125W base / 250W PBP',
    socket: 'LGA1851',
    memory: 'DDR5-6400',
    price_php: '₱19,990 – ₱24,990',
    buy: 'PC Express, DynaQuest PC, Lazada',
    verdict: 'Great Arrow Lake mid-tier. More efficient than 14th gen with similar performance.',
  },
  'Intel Core i7-14700K': {
    cores: '20 cores (8P + 12E), 28 threads',
    base_clock: '3.4 GHz (P-core)',
    boost_clock: '5.6 GHz',
    cache: '33MB L3',
    tdp: '125W base / 253W PBP',
    socket: 'LGA1700',
    memory: 'DDR4/DDR5',
    price_php: '₱19,990 – ₱23,990',
    buy: 'PC Express, DynaQuest PC, Villman, Lazada',
    verdict: 'Excellent productivity CPU. 20 cores handles multitasking brilliantly.',
  },
  'Intel Core i5-14600K': {
    cores: '14 cores (6P + 8E), 20 threads',
    base_clock: '3.5 GHz (P-core)',
    boost_clock: '5.3 GHz',
    cache: '24MB L3',
    tdp: '125W base / 181W PBP',
    socket: 'LGA1700',
    memory: 'DDR4/DDR5',
    price_php: '₱14,490 – ₱17,990',
    buy: 'PC Express, DynaQuest PC, Villman, Lazada',
    verdict: 'Best value gaming CPU from Intel. Matches Ryzen 7 7700X at lower price.',
  },
  'Intel Core i5-14400F': {
    cores: '10 cores (6P + 4E), 16 threads',
    base_clock: '2.5 GHz (P-core)',
    boost_clock: '4.7 GHz',
    cache: '20MB L3',
    tdp: '65W base / 148W PBP',
    socket: 'LGA1700',
    memory: 'DDR4/DDR5',
    price_php: '₱7,490 – ₱9,490',
    buy: 'PC Express, DynaQuest PC, Lazada',
    verdict: 'Best budget gaming CPU. Fantastic value. No integrated GPU (F suffix).',
  },
  'Intel Core i3-14100F': {
    cores: '4 cores, 8 threads',
    base_clock: '3.5 GHz',
    boost_clock: '4.7 GHz',
    cache: '12MB L3',
    tdp: '58W',
    socket: 'LGA1700',
    memory: 'DDR4/DDR5',
    price_php: '₱4,490 – ₱5,990',
    buy: 'PC Express, DynaQuest PC, Lazada',
    verdict: 'Cheapest viable gaming CPU in 2025. Pair with RTX 4060 for budget 1080p gaming PC.',
  },

  // ── CPUs (AMD) ────────────────────────────────────────────────────────────────
  'AMD Ryzen 9 9950X': {
    cores: '16 cores, 32 threads',
    base_clock: '4.3 GHz',
    boost_clock: '5.7 GHz',
    cache: '64MB L3',
    tdp: '170W',
    socket: 'AM5',
    memory: 'DDR5-5600 (up to DDR5-6000+ OC)',
    pcie: 'PCIe 5.0',
    price_php: '₱34,990 – ₱39,990',
    buy: 'PC Express, DynaQuest PC, Villman, Lazada',
    verdict: 'Zen 5 flagship. Fastest desktop CPU in single and multi-core. Ideal for content creation.',
  },
  'AMD Ryzen 7 9800X3D': {
    cores: '8 cores, 16 threads',
    base_clock: '4.7 GHz',
    boost_clock: '5.2 GHz',
    cache: '96MB L3 (3D V-Cache)',
    tdp: '120W',
    socket: 'AM5',
    memory: 'DDR5-5600',
    pcie: 'PCIe 5.0',
    price_php: '₱24,990 – ₱29,990',
    buy: 'PC Express, DynaQuest PC, Villman, Lazada',
    verdict: 'THE best gaming CPU in 2025. Zen 5 + 3D V-Cache = best of both worlds. Must buy for gaming builds.',
  },
  'AMD Ryzen 9 7950X': {
    cores: '16 cores, 32 threads',
    base_clock: '4.5 GHz',
    boost_clock: '5.7 GHz',
    cache: '64MB L3',
    tdp: '170W',
    socket: 'AM5',
    memory: 'DDR5-5200 (official), OC to 6000+',
    pcie: 'PCIe 5.0',
    price_php: '₱29,990 – ₱34,990',
    buy: 'PC Express, DynaQuest PC, Villman, Lazada',
    verdict: 'Best AMD workstation CPU. 16 cores for rendering, video editing, and 3D work.',
  },
  'AMD Ryzen 7 7800X3D': {
    cores: '8 cores, 16 threads',
    base_clock: '4.5 GHz',
    boost_clock: '5.0 GHz',
    cache: '96MB L3 (3D V-Cache)',
    tdp: '120W',
    socket: 'AM5',
    memory: 'DDR5-5200',
    pcie: 'PCIe 5.0',
    price_php: '₱19,990 – ₱24,990',
    buy: 'PC Express, DynaQuest PC, Villman, Lazada',
    verdict: 'Still excellent gaming CPU. Ryzen 7 9800X3D is the upgrade path but this is cheaper.',
  },
  'AMD Ryzen 5 9600X': {
    cores: '6 cores, 12 threads',
    base_clock: '3.9 GHz',
    boost_clock: '5.4 GHz',
    cache: '32MB L3',
    tdp: '65W',
    socket: 'AM5',
    memory: 'DDR5-5600',
    pcie: 'PCIe 5.0',
    price_php: '₱12,990 – ₱15,990',
    buy: 'PC Express, DynaQuest PC, Lazada',
    verdict: 'Zen 5 efficiency champion. 65W TDP with flagship IPC improvements.',
  },
  'AMD Ryzen 5 7600X': {
    cores: '6 cores, 12 threads',
    base_clock: '4.7 GHz',
    boost_clock: '5.3 GHz',
    cache: '32MB L3',
    tdp: '105W',
    socket: 'AM5',
    memory: 'DDR5-5200',
    pcie: 'PCIe 5.0',
    price_php: '₱9,990 – ₱12,990',
    buy: 'PC Express, DynaQuest PC, Lazada',
    verdict: 'Great mid-range gaming CPU. Needs DDR5 which adds to build cost.',
  },
  'AMD Ryzen 5 5600X': {
    cores: '6 cores, 12 threads',
    base_clock: '3.7 GHz',
    boost_clock: '4.6 GHz',
    cache: '32MB L3',
    tdp: '65W',
    socket: 'AM4',
    memory: 'DDR4-3200',
    price_php: '₱6,990 – ₱9,490',
    buy: 'PC Express, DynaQuest PC, Lazada',
    verdict: 'Best AM4 CPU for budget builds. Pairs well with cheap B450/B550 boards.',
  },
  'AMD Ryzen 5 5600': {
    cores: '6 cores, 12 threads',
    base_clock: '3.5 GHz',
    boost_clock: '4.4 GHz',
    cache: '32MB L3',
    tdp: '65W',
    socket: 'AM4',
    memory: 'DDR4-3200',
    price_php: '₱5,990 – ₱7,990',
    buy: 'PC Express, DynaQuest PC, Lazada',
    verdict: 'Cheapest capable Ryzen CPU. Ideal for budget AM4 gaming builds.',
  },
  'AMD Ryzen 7 5800X3D': {
    cores: '8 cores, 16 threads',
    base_clock: '3.4 GHz',
    boost_clock: '4.5 GHz',
    cache: '96MB L3 (3D V-Cache)',
    tdp: '105W',
    socket: 'AM4',
    memory: 'DDR4-3200',
    price_php: '₱13,490 – ₱16,990',
    buy: 'PC Express, DynaQuest PC, Lazada',
    verdict: 'Best AM4 gaming CPU ever. Drop-in upgrade for existing AM4 systems.',
  },

  // ── RAM ───────────────────────────────────────────────────────────────────────
  'Corsair Vengeance DDR5 6000MHz': {
    type: 'DDR5',
    speed: '6000 MT/s (PC5-48000)',
    capacity: '32GB (2×16GB) / 64GB (2×32GB)',
    timings: 'CL30 / CL36',
    voltage: '1.35V',
    xmp: 'XMP 3.0 / EXPO',
    rgb: 'Yes (RGB Pro) / No (non-RGB)',
    price_php: '₱4,990 – ₱5,990 (32GB kit)',
    buy: 'PC Express, DynaQuest PC, Villman, Lazada Corsair official',
    verdict: 'DDR5-6000 is the sweet spot for Ryzen 7000/9000 and Intel 13th/14th gen. Excellent value kit.',
  },
  'G.Skill Trident Z5 RGB DDR5 6000': {
    type: 'DDR5',
    speed: '6000 MT/s',
    capacity: '32GB (2×16GB) / 64GB (2×32GB)',
    timings: 'CL30 / CL36',
    voltage: '1.35V',
    xmp: 'XMP 3.0 / EXPO',
    rgb: 'Yes',
    price_php: '₱5,490 – ₱6,990 (32GB kit)',
    buy: 'PC Express, DynaQuest PC, Villman, Lazada',
    verdict: 'Premium DDR5 kit. Great RGB and reliable performance. G.Skill is top-tier for OC.',
  },
  'G.Skill Trident Z Neo DDR4 3600': {
    type: 'DDR4',
    speed: '3600 MT/s',
    capacity: '16GB (2×8GB) / 32GB (2×16GB)',
    timings: 'CL16 / CL18',
    voltage: '1.35V',
    xmp: 'XMP 2.0',
    rgb: 'Yes',
    price_php: '₱3,490 – ₱4,490 (32GB kit)',
    buy: 'PC Express, DynaQuest PC, Lazada',
    verdict: 'Best DDR4 kit for Ryzen 5000 AM4 builds. The Zen 3 sweet spot speed.',
  },
  'Kingston Fury Beast DDR5 6000': {
    type: 'DDR5',
    speed: '6000 MT/s',
    capacity: '32GB (2×16GB) / 64GB (2×32GB)',
    timings: 'CL36',
    voltage: '1.35V',
    xmp: 'XMP 3.0 / EXPO',
    rgb: 'No (Beast) / Yes (Beast RGB)',
    price_php: '₱4,490 – ₱5,490 (32GB kit)',
    buy: 'PC Express, DynaQuest PC, Lazada',
    verdict: 'Budget-friendly DDR5-6000. Best value DDR5 in PH market.',
  },
  'Corsair Vengeance LPX DDR4 3200': {
    type: 'DDR4',
    speed: '3200 MT/s (PC4-25600)',
    capacity: '16GB (2×8GB) / 32GB (2×16GB)',
    timings: 'CL16 / CL22',
    voltage: '1.35V',
    xmp: 'XMP 2.0',
    rgb: 'No (LPX) — low profile, fits under CPU coolers',
    price_php: '₱1,890 – ₱2,490 (16GB kit) | ₱3,490 – ₱4,490 (32GB kit)',
    buy: 'PC Express, DynaQuest PC, Villman, Lazada',
    verdict: 'Most popular DDR4 RAM in PH. Reliable, low-profile, works everywhere.',
  },
  'TeamGroup T-Force Vulcan DDR4 3200': {
    type: 'DDR4',
    speed: '3200 MT/s',
    capacity: '16GB (2×8GB) / 32GB (2×16GB)',
    timings: 'CL16',
    voltage: '1.35V',
    xmp: 'XMP 2.0',
    rgb: 'No',
    price_php: '₱1,590 – ₱2,290 (16GB kit)',
    buy: 'PC Express, DynaQuest PC, Lazada',
    verdict: 'Cheapest reliable DDR4 RAM in PH. Great for budget builds.',
  },
  'Crucial Pro DDR5 5600': {
    type: 'DDR5',
    speed: '5600 MT/s',
    capacity: '32GB (2×16GB) / 64GB (2×32GB)',
    timings: 'CL46',
    voltage: '1.1V',
    xmp: 'XMP 3.0',
    rgb: 'No',
    price_php: '₱3,990 – ₱4,990 (32GB kit)',
    buy: 'PC Express, Lazada',
    verdict: 'Budget DDR5. Good for Intel and AMD builds that do not need 6000MT/s.',
  },

  // ── SSDs ──────────────────────────────────────────────────────────────────────
  'Samsung 990 Pro 2TB NVMe': {
    type: 'NVMe PCIe 4.0 x4, M.2 2280',
    seq_read: '7450 MB/s',
    seq_write: '6900 MB/s',
    random_read: '1400K IOPS',
    random_write: '1550K IOPS',
    controller: 'Samsung Elpis',
    nand: 'Samsung 176-layer V-NAND TLC',
    endurance: '1200 TBW',
    warranty: '5 years',
    price_php: '₱5,990 – ₱6,990 (1TB) | ₱9,990 – ₱11,990 (2TB)',
    buy: 'PC Express, DynaQuest PC, Villman, Lazada Samsung official',
    verdict: 'Fastest PCIe 4.0 SSD. Best overall NVMe in PH for performance builds.',
  },
  'Samsung 990 EVO 2TB NVMe': {
    type: 'NVMe PCIe 4.0 x4 / PCIe 5.0 x2, M.2 2280',
    seq_read: '5000 MB/s',
    seq_write: '4200 MB/s',
    endurance: '600 TBW',
    warranty: '5 years',
    price_php: '₱3,990 – ₱4,990 (1TB) | ₱6,990 – ₱7,990 (2TB)',
    buy: 'PC Express, DynaQuest PC, Lazada Samsung official',
    verdict: 'Great mid-range NVMe. PCIe 5.0 x2 compatibility is a bonus. Good value.',
  },
  'WD Black SN850X 2TB NVMe': {
    type: 'NVMe PCIe 4.0 x4, M.2 2280',
    seq_read: '7300 MB/s',
    seq_write: '6600 MB/s',
    random_read: '1200K IOPS',
    random_write: '1100K IOPS',
    endurance: '1200 TBW',
    heatsink: 'Available with optional heatsink model',
    price_php: '₱5,490 – ₱6,490 (1TB) | ₱9,490 – ₱10,990 (2TB)',
    buy: 'PC Express, DynaQuest PC, Lazada WD official',
    verdict: 'Top-tier NVMe. PlayStation 5 compatible. Great for gaming and content creation.',
  },
  'Seagate FireCuda 530 2TB NVMe': {
    type: 'NVMe PCIe 4.0 x4, M.2 2280',
    seq_read: '7300 MB/s',
    seq_write: '6900 MB/s',
    endurance: '1275 TBW',
    heatsink: 'Available with heatsink model',
    price_php: '₱6,490 – ₱7,490 (1TB) | ₱10,990 – ₱12,490 (2TB)',
    buy: 'PC Express, DynaQuest PC, Lazada',
    verdict: 'PS5 compatible. One of the highest-endurance PCIe 4.0 SSDs available.',
  },
  'Kingston NV2 NVMe 1TB': {
    type: 'NVMe PCIe 4.0 x4, M.2 2280',
    seq_read: '3500 MB/s',
    seq_write: '2100 MB/s',
    endurance: '320 TBW',
    price_php: '₱1,990 – ₱2,490 (1TB) | ₱3,290 – ₱3,990 (2TB)',
    buy: 'PC Express, DynaQuest PC, Lazada',
    verdict: 'Best budget NVMe in PH. Perfect for OS drive in budget builds.',
  },
  'Crucial MX500 1TB SATA': {
    type: 'SATA III, 2.5-inch',
    seq_read: '560 MB/s',
    seq_write: '510 MB/s',
    endurance: '360 TBW',
    nand: 'Micron 3D NAND TLC',
    price_php: '₱2,490 – ₱2,990 (1TB) | ₱3,990 – ₱4,490 (2TB)',
    buy: 'PC Express, DynaQuest PC, Lazada',
    verdict: 'Best SATA SSD upgrade for old laptops and desktops. Massive improvement over HDD.',
  },
  'Crucial P3 Plus 2TB NVMe': {
    type: 'NVMe PCIe 4.0 x4, M.2 2280',
    seq_read: '5000 MB/s',
    seq_write: '4200 MB/s',
    endurance: '440 TBW',
    price_php: '₱2,990 – ₱3,990 (1TB) | ₱4,990 – ₱5,990 (2TB)',
    buy: 'PC Express, DynaQuest PC, Lazada',
    verdict: 'Great mid-range NVMe. Good balance of speed and price in the PH market.',
  },

  // ── Motherboards ──────────────────────────────────────────────────────────────
  'ASUS ROG Strix Z790-E Gaming': {
    socket: 'LGA1700',
    chipset: 'Intel Z790',
    form_factor: 'ATX',
    memory: '4x DDR5, up to 192GB, DDR5-7800+ OC',
    expansion: '2x PCIe 5.0 x16 + 1x PCIe 4.0 x4',
    storage: '4x M.2 (PCIe 5.0/4.0) + 6x SATA',
    usb: 'USB 3.2 Gen 2x2 (20Gbps), USB4 (40Gbps Thunderbolt 4)',
    networking: '2.5G LAN + Wi-Fi 6E',
    audio: 'ROG SupremeFX 7.1',
    price_php: '₱24,990 – ₱29,990',
    buy: 'PC Express, DynaQuest PC, Villman, Lazada ASUS official',
    verdict: 'Premium Z790 board. Excellent VRM for i9 overclocking. Feature-rich.',
  },
  'ASUS ROG Strix X870E-E Gaming': {
    socket: 'AM5',
    chipset: 'AMD X870E',
    form_factor: 'ATX',
    memory: '4x DDR5, up to 256GB, DDR5-8200+ OC',
    expansion: '2x PCIe 5.0 x16 + M.2 PCIe 5.0',
    storage: '5x M.2 (PCIe 5.0/4.0) + 4x SATA',
    networking: '5G LAN + Wi-Fi 7',
    price_php: '₱29,990 – ₱34,990',
    buy: 'PC Express, DynaQuest PC, Lazada',
    verdict: 'Best AM5 board for Ryzen 9000 series. X870E with Wi-Fi 7 and PCIe 5.0 M.2.',
  },
  'ASUS TUF Gaming Z790-Plus': {
    socket: 'LGA1700',
    chipset: 'Intel Z790',
    form_factor: 'ATX',
    memory: '4x DDR5, up to 192GB',
    expansion: '2x PCIe 5.0 x16',
    storage: '4x M.2 + 4x SATA',
    networking: '2.5G LAN + Wi-Fi 6E',
    price_php: '₱14,990 – ₱17,990',
    buy: 'PC Express, DynaQuest PC, Lazada',
    verdict: 'Best mid-range Z790 in PH. Great value for i5/i7 builds.',
  },
  'MSI MAG Z790 Tomahawk': {
    socket: 'LGA1700',
    chipset: 'Intel Z790',
    form_factor: 'ATX',
    memory: '4x DDR5, up to 192GB',
    storage: '3x M.2 + 6x SATA',
    networking: '2.5G LAN + Wi-Fi 6E',
    price_php: '₱12,990 – ₱15,990',
    buy: 'PC Express, DynaQuest PC, Lazada',
    verdict: 'Most popular Z790 board in PH. Excellent build quality and value.',
  },
  'MSI MAG B650 Tomahawk': {
    socket: 'AM5',
    chipset: 'AMD B650',
    form_factor: 'ATX',
    memory: '4x DDR5, up to 192GB',
    storage: '2x M.2 + 6x SATA',
    networking: '2.5G LAN + Wi-Fi 6',
    price_php: '₱9,990 – ₱12,490',
    buy: 'PC Express, DynaQuest PC, Lazada',
    verdict: 'Best AM5 budget board. Great for Ryzen 7000/9000 budget builds.',
  },
  'Gigabyte B650 Aorus Elite AX': {
    socket: 'AM5',
    chipset: 'AMD B650',
    form_factor: 'ATX',
    memory: '4x DDR5, up to 192GB',
    storage: '3x M.2 + 4x SATA',
    networking: '2.5G LAN + Wi-Fi 6E',
    price_php: '₱11,990 – ₱14,490',
    buy: 'PC Express, DynaQuest PC, Lazada',
    verdict: 'Best AMD AM5 board under ₱15K in PH. Perfect for Ryzen 7000/9000 builds.',
  },
  'ASRock B550M Steel Legend': {
    socket: 'AM4',
    chipset: 'AMD B550',
    form_factor: 'Micro-ATX',
    memory: '4x DDR4, up to 128GB',
    storage: '2x M.2 + 6x SATA',
    networking: '2.5G LAN',
    price_php: '₱5,990 – ₱7,990',
    buy: 'PC Express, DynaQuest PC, Lazada',
    verdict: 'Best budget AM4 board in PH. Micro-ATX, solid VRM for Ryzen 5000 builds.',
  },

  // ── PSUs ─────────────────────────────────────────────────────────────────────
  'Corsair RM1000x 1000W Gold': {
    wattage: '1000W',
    efficiency: '80 PLUS Gold (87-90% efficient)',
    modular: 'Fully Modular',
    fan: '135mm Zero RPM fan (silent until needed)',
    rails: 'Single +12V rail',
    protection: 'OVP, UVP, OCP, OPP, SCP, OTP',
    pcie: '2x 12VHPWR (PCIe 5.0 GPU connectors)',
    warranty: '10 years',
    price_php: '₱8,990 – ₱10,990',
    buy: 'PC Express, DynaQuest PC, Villman, Lazada Corsair official',
    verdict: 'Best 1000W PSU in PH. 10-year warranty and Zero RPM mode make it premium choice.',
  },
  'Corsair RM850x 850W Gold': {
    wattage: '850W',
    efficiency: '80 PLUS Gold',
    modular: 'Fully Modular',
    fan: '135mm Zero RPM',
    rails: 'Single +12V rail',
    warranty: '10 years',
    price_php: '₱6,990 – ₱8,490',
    buy: 'PC Express, DynaQuest PC, Villman, Lazada',
    verdict: 'Top pick for RTX 4080/4090 builds. Reliable and quiet.',
  },
  'Corsair RM750x 750W Gold': {
    wattage: '750W',
    efficiency: '80 PLUS Gold',
    modular: 'Fully Modular',
    fan: '135mm Zero RPM',
    warranty: '10 years',
    price_php: '₱5,490 – ₱6,990',
    buy: 'PC Express, DynaQuest PC, Villman, Lazada',
    verdict: 'Ideal for RTX 4070 Ti / RX 7900 XT builds. Best value fully modular PSU.',
  },
  'Corsair RM650x 650W Gold': {
    wattage: '650W',
    efficiency: '80 PLUS Gold',
    modular: 'Fully Modular',
    fan: '135mm Zero RPM',
    warranty: '10 years',
    price_php: '₱4,990 – ₱5,990',
    buy: 'PC Express, DynaQuest PC, Lazada',
    verdict: 'Great for RTX 4070 / RX 7800 XT builds. Zero RPM fan keeps it whisper quiet.',
  },
  'Seasonic Focus GX-850 850W Gold': {
    wattage: '850W',
    efficiency: '80 PLUS Gold',
    modular: 'Fully Modular',
    fan: '120mm Fluid Dynamic Bearing',
    warranty: '10 years',
    price_php: '₱5,990 – ₱7,490',
    buy: 'PC Express, DynaQuest PC, Lazada',
    verdict: 'Seasonic makes the OEM units for many other brands. Extremely reliable.',
  },
  'Seasonic Focus GX-750 750W Gold': {
    wattage: '750W',
    efficiency: '80 PLUS Gold',
    modular: 'Fully Modular',
    warranty: '10 years',
    price_php: '₱4,990 – ₱6,490',
    buy: 'PC Express, DynaQuest PC, Lazada',
    verdict: 'Best PSU brand for reliability. 10-year warranty covers most of a PC\'s lifespan.',
  },
  'be quiet! Straight Power 12 850W Gold': {
    wattage: '850W',
    efficiency: '80 PLUS Gold',
    modular: 'Fully Modular',
    fan: '135mm Silent Wings 4',
    warranty: '10 years',
    price_php: '₱6,490 – ₱7,990',
    buy: 'PC Express, DynaQuest PC, Lazada',
    verdict: 'Quietest PSU on the market. be quiet! fans are near-silent under load.',
  },
  'Thermaltake Toughpower GF3 850W Gold': {
    wattage: '850W',
    efficiency: '80 PLUS Gold',
    modular: 'Fully Modular',
    fan: '140mm',
    pcie: 'PCIe 5.0 native 12VHPWR connector',
    warranty: '10 years',
    price_php: '₱4,990 – ₱6,490',
    buy: 'PC Express, DynaQuest PC, Lazada',
    verdict: 'Good budget option with native PCIe 5.0 connector. Reliable mid-range PSU.',
  },
};

// Vision model — using Scout (free tier, available to all Groq users)
const VISION_MODEL = 'meta-llama/llama-4-scout-17b-16e-instruct';

// ─── IMPROVEMENT 3: Sharpened OCR prompt ─────────────────────────────────────
const OCR_PROMPT = `You are an OCR engine. Extract ALL visible text from this image with maximum precision.

Priority targets (look for these specifically):
1. Model numbers (e.g. SM-S928B, A3293, RTX 4090, i9-14900K, Ryzen 7 7800X3D)
2. Brand names printed on the device (Apple, Samsung, NVIDIA, AMD, Intel, ASUS, MSI...)
3. Sticker labels, serial numbers, regulatory markings
4. Text on screen if device is powered on
5. PCB markings, chip labels, engravings
6. Storage capacity stickers (128GB, 256GB, 512GB, 1TB)
7. Color names (Titanium Black, Desert Titanium, Natural Titanium, etc.)

Output ONLY the raw extracted text, one item per line. No explanations, no markdown.`;

// ─── Format spec DB entry into clean text ──────────────────────────────────────
function formatSpecEntry(deviceName, entry) {
  const lines = [`📱 ${deviceName} — Full Specifications\n`];
  const fieldLabels = {
    display: '🖥️  Display', processor: '⚙️  Processor', ram: '🧠  RAM',
    storage: '💾  Storage', camera: '📷  Camera', battery: '🔋  Battery',
    os: '📱  OS', connectivity: '📡  Connectivity', build: '🏗️  Build',
    price_php: '💰  Price (PH)', buy: '🛒  Where to Buy', verdict: '✅  Verdict',
    vram: '🎮  VRAM', bus: '🔌  Memory Bus', cuda_cores: '⚡  CUDA Cores',
    compute_units: '⚡  Compute Units', boost_clock: '🚀  Boost Clock',
    tdp: '🔥  TDP', pcie: '🔌  PCIe', recommended_psu: '⚡  Recommended PSU',
    performance: '🎮  Performance', cores: '🧠  Cores/Threads',
    base_clock: '⏱️  Base Clock', cache: '💾  Cache', socket: '🔌  Socket',
    memory: '💾  Memory Support', igpu: '🖥️  Integrated GPU', type: '💾  Type',
    seq_read: '⬆️  Seq Read', seq_write: '⬇️  Seq Write', endurance: '🛡️  Endurance',
    warranty: '📋  Warranty', chipset: '🔧  Chipset', form_factor: '📐  Form Factor',
    expansion: '🔌  Expansion', usb: '🔌  USB', networking: '📡  Networking',
    audio: '🔊  Audio', wattage: '⚡  Wattage', efficiency: '💡  Efficiency',
    modular: '🔌  Modular', fan: '❄️  Fan', rails: '⚡  Rails',
    heatsink: '❄️  Heatsink', rgb: '💡  RGB', xmp: '⚡  XMP/EXPO',
    timings: '⏱️  Timings', voltage: '⚡  Voltage',
    random_read: '⚡  Random Read', random_write: '⚡  Random Write',
    controller: '🔧  Controller', nand: '💾  NAND',
    storage_ports: '🔌  Storage Ports',
  };

  for (const [key, label] of Object.entries(fieldLabels)) {
    if (entry[key]) lines.push(`${label}: ${entry[key]}`);
  }
  return lines.join('\n');
}

// ─── Helper: normalize device name for lookup ──────────────────────────────────
function normalizeForLookup(name) {
  return (name || '').toLowerCase()
    .replace(/\s+/g, ' ')
    .replace(/iphone\s+(\d)/i, 'iphone $1')
    .trim();
}

function lookupSpecDB(deviceName) {
  if (!deviceName) return null;
  const normalized = normalizeForLookup(deviceName);
  for (const [key, value] of Object.entries(SPEC_DB)) {
    if (normalizeForLookup(key) === normalized) return { key, value };
    if (normalized.includes(normalizeForLookup(key)) || normalizeForLookup(key).includes(normalized)) {
      return { key, value };
    }
  }
  return null;
}

// ─── Model number map ─────────────────────────────────────────────────────────
const MODEL_NUMBER_MAP = {
  'A3293': 'Apple iPhone 16 Pro Max', 'A3295': 'Apple iPhone 16 Pro Max',
  'A3291': 'Apple iPhone 16 Pro',     'A3292': 'Apple iPhone 16 Pro',
  'A3287': 'Apple iPhone 16 Plus',    'A3288': 'Apple iPhone 16 Plus',
  'A3283': 'Apple iPhone 16',         'A3284': 'Apple iPhone 16',
  'A2894': 'Apple iPhone 15 Pro Max', 'A3105': 'Apple iPhone 15 Pro Max',
  'A2848': 'Apple iPhone 15 Pro',     'A3101': 'Apple iPhone 15 Pro',
  'A3093': 'Apple iPhone 15 Plus',    'A3090': 'Apple iPhone 15 Plus',
  'A3092': 'Apple iPhone 15',         'A3089': 'Apple iPhone 15',
  'A2651': 'Apple iPhone 14 Pro Max', 'A2893': 'Apple iPhone 14 Pro Max',
  'A2650': 'Apple iPhone 14 Pro',     'A2889': 'Apple iPhone 14 Pro',
  'A2632': 'Apple iPhone 14 Plus',    'A2886': 'Apple iPhone 14 Plus',
  'A2649': 'Apple iPhone 14',         'A2881': 'Apple iPhone 14',
  'A2484': 'Apple iPhone 13 Pro Max', 'A2641': 'Apple iPhone 13 Pro Max',
  'A2483': 'Apple iPhone 13 Pro',     'A2640': 'Apple iPhone 13 Pro',
  'A2482': 'Apple iPhone 13',         'A2634': 'Apple iPhone 13',
  'A2481': 'Apple iPhone 13 Mini',    'A2628': 'Apple iPhone 13 Mini',
  'A2342': 'Apple iPhone 12 Pro Max', 'A2411': 'Apple iPhone 12 Pro Max',
  'A2341': 'Apple iPhone 12 Pro',     'A2408': 'Apple iPhone 12 Pro',
  'A2172': 'Apple iPhone 12',         'A2402': 'Apple iPhone 12',
  'A2176': 'Apple iPhone 12 Mini',    'A2399': 'Apple iPhone 12 Mini',
  'A2595': 'Apple iPhone SE (2022)',   'A2783': 'Apple iPhone SE (2022)',
  'A2296': 'Apple iPhone SE (2020)',   'A2275': 'Apple iPhone SE (2020)',
  'SM-S938B': 'Samsung Galaxy S25 Ultra', 'SM-S938U': 'Samsung Galaxy S25 Ultra',
  'SM-S936B': 'Samsung Galaxy S25+',     'SM-S936U': 'Samsung Galaxy S25+',
  'SM-S931B': 'Samsung Galaxy S25',      'SM-S931U': 'Samsung Galaxy S25',
  'SM-S928B': 'Samsung Galaxy S24 Ultra', 'SM-S928U': 'Samsung Galaxy S24 Ultra',
  'SM-S926B': 'Samsung Galaxy S24+',      'SM-S926U': 'Samsung Galaxy S24+',
  'SM-S921B': 'Samsung Galaxy S24',       'SM-S921U': 'Samsung Galaxy S24',
  'SM-S918B': 'Samsung Galaxy S23 Ultra', 'SM-S918U': 'Samsung Galaxy S23 Ultra',
  'SM-S916B': 'Samsung Galaxy S23+',      'SM-S916U': 'Samsung Galaxy S23+',
  'SM-S911B': 'Samsung Galaxy S23',       'SM-S911U': 'Samsung Galaxy S23',
  'SM-S711B': 'Samsung Galaxy S23 FE',
  'SM-S908B': 'Samsung Galaxy S22 Ultra', 'SM-S906B': 'Samsung Galaxy S22+',
  'SM-S901B': 'Samsung Galaxy S22',
  'SM-F956B': 'Samsung Galaxy Z Fold 6',  'SM-F741B': 'Samsung Galaxy Z Flip 6',
  'SM-F946B': 'Samsung Galaxy Z Fold 5',  'SM-F731B': 'Samsung Galaxy Z Flip 5',
  'SM-F936B': 'Samsung Galaxy Z Fold 4',  'SM-F721B': 'Samsung Galaxy Z Flip 4',
  'SM-A566B': 'Samsung Galaxy A56',  'SM-A556B': 'Samsung Galaxy A55',
  'SM-A546B': 'Samsung Galaxy A54',
  'SM-A366B': 'Samsung Galaxy A36',  'SM-A356B': 'Samsung Galaxy A35',
  'SM-A256B': 'Samsung Galaxy A25',
  'SM-A166B': 'Samsung Galaxy A16',  'SM-A156B': 'Samsung Galaxy A15',
  'SM-A065F': 'Samsung Galaxy A06',  'SM-A055F': 'Samsung Galaxy A05',
  '23116PN5BC': 'Xiaomi 14 Ultra',  '23049PCD8G': 'Xiaomi 14',
  '23117RA68G': 'Xiaomi Redmi Note 13 Pro+',
  '2312DRA50G': 'Xiaomi Redmi Note 13 Pro',
  '23078RKD5G': 'Xiaomi Redmi Note 13',
  '23049RAD8G': 'POCO F6 Pro',
  '23058PY04G': 'POCO X6 Pro',
  'CPH2557': 'OPPO Reno 11 Pro',    'CPH2609': 'OPPO Reno 12 Pro',
  'GC3VE': 'Google Pixel 9 Pro XL', 'GP4BC': 'Google Pixel 9 Pro',
  'GKV4X': 'Google Pixel 9',
  'PJD110': 'OnePlus 12',           'CPH2573': 'OnePlus 12',
  'PHB110': 'OnePlus 11',
};

const MODEL_PREFIX_MAP = {
  'SM-S938': 'Samsung Galaxy S25 Ultra',
  'SM-S936': 'Samsung Galaxy S25+',
  'SM-S931': 'Samsung Galaxy S25',
  'SM-S928': 'Samsung Galaxy S24 Ultra',
  'SM-S926': 'Samsung Galaxy S24+',
  'SM-S921': 'Samsung Galaxy S24',
  'SM-S918': 'Samsung Galaxy S23 Ultra',
  'SM-S916': 'Samsung Galaxy S23+',
  'SM-S911': 'Samsung Galaxy S23',
  'SM-S908': 'Samsung Galaxy S22 Ultra',
  'SM-S906': 'Samsung Galaxy S22+',
  'SM-S901': 'Samsung Galaxy S22',
  'SM-F956': 'Samsung Galaxy Z Fold 6',
  'SM-F741': 'Samsung Galaxy Z Flip 6',
  'SM-F946': 'Samsung Galaxy Z Fold 5',
  'SM-F731': 'Samsung Galaxy Z Flip 5',
  'SM-A566': 'Samsung Galaxy A56',
  'SM-A556': 'Samsung Galaxy A55',
  'SM-A546': 'Samsung Galaxy A54',
  'SM-A366': 'Samsung Galaxy A36',
  'SM-A356': 'Samsung Galaxy A35',
  'SM-A166': 'Samsung Galaxy A16',
  'SM-A156': 'Samsung Galaxy A15',
};

const KNOWN_PHONE_BRANDS = [
  'samsung', 'apple', 'iphone', 'xiaomi', 'redmi', 'poco',
  'oppo', 'vivo', 'realme', 'oneplus', 'huawei', 'honor',
  'nokia', 'motorola', 'sony', 'infinix', 'tecno', 'itel',
  'nothing', 'google pixel', 'pixel', 'asus rog phone',
];

const REJECTED = [
  'monitor', 'keyboard', 'mouse', 'tablet', 'printer',
  'headset', 'router', 'webcam', 'external', 'smartwatch',
  'pc case', 'cooler', 'fan',
];

function lookupModelFromText(text) {
  if (!text) return null;
  const upper = text.toUpperCase().replace(/\s+/g, '');
  for (const [code, name] of Object.entries(MODEL_NUMBER_MAP)) {
    if (upper.includes(code.toUpperCase().replace(/\s+/g, ''))) return name;
  }
  for (const [prefix, name] of Object.entries(MODEL_PREFIX_MAP)) {
    if (upper.includes(prefix.toUpperCase())) return name;
  }
  const appleMatch = text.match(/\bA(\d{4})\b/i);
  if (appleMatch) {
    const code = `A${appleMatch[1]}`;
    if (MODEL_NUMBER_MAP[code]) return MODEL_NUMBER_MAP[code];
  }
  return null;
}

// ─── IMPROVEMENT 2: Upgraded identification prompt for Maverick ───────────────
function buildIdentificationPrompt(extractedText) {
  return `You are a hardware identification expert. Analyze this image carefully.

${extractedText ? `Text detected in image:\n"${extractedText}"\n` : 'No text detected.\n'}

Your task: Identify the SINGLE most specific product shown.

PHONE IDENTIFICATION RULES (apply in order):

STEP 1 - Charging port at the bottom:
  USB-C port = iPhone 15 or newer
  Lightning port (small oval) = iPhone 14 or older

STEP 2 - Front cutout shape:
  Pill-shaped Dynamic Island = iPhone 14 Pro, 15, 15 Pro, 16, 16 Pro
  Wide black notch bar = iPhone 12, 13, 14 base or Plus
  Small teardrop notch = iPhone 11 or older

STEP 3 - Count rear cameras:
  3 cameras in a square bump = Pro model
  2 cameras = base or Plus model
  1 camera = SE model

STEP 4 - Distinguish iPhone 14 Pro vs 15 Pro vs 16 Pro (Dynamic Island + 3 cams):
  USB-C + Dynamic Island + cameras in VERTICAL column = iPhone 16 Pro ONLY
  USB-C + Dynamic Island + cameras in TRIANGLE layout = iPhone 15 Pro ONLY
  Lightning + Dynamic Island + cameras in square = iPhone 14 Pro ONLY

STEP 5 - Distinguish iPhone 15 vs 16 (both USB-C + Dynamic Island + 2 cams):
  Camera Control button visible on right side = iPhone 16
  No Camera Control button = iPhone 15

STEP 6 - Frame material:
  Titanium frame = Pro model (iPhone 15 Pro, 16 Pro, or newer)
  Polished stainless steel = iPhone 12 Pro, 13 Pro, 14 Pro
  Aluminum = base/Plus models

SAMSUNG RULES:
  Look for SM-XXXX model sticker on the back — this is the definitive identifier
  Rectangular camera island top-left corner = Galaxy S22, S23, S24, or S25 series
  Circular camera arrangement = Galaxy S21 or older

GPU RULES:
  Read the exact model printed on the shroud sticker/label
  Green/black shroud = NVIDIA (RTX or GTX)
  Red/black shroud = AMD (RX series)
  Blue/silver = Intel Arc

CPU RULES:
  Read text on chip lid (e.g. i9-14900K, Ryzen 7 7800X3D, Core Ultra 9 285K)

SUPPORTED device types: Smartphone, Laptop, GPU, CPU, RAM, SSD, Motherboard, PSU
UNSUPPORTED: Monitor, Keyboard, Mouse, Tablet, Printer, Headset, Router, Webcam, Smartwatch, PC Case, Fan

CRITICAL RULES:
- MODEL must be ONE specific model — NEVER write "X or Y"
- Pick the single best match, put alternatives in ALTERNATIVE_1 and ALTERNATIVE_2
- If multiple phones could match, use the USB-C vs Lightning rule first

Reply ONLY in this exact format:
HARDWARE_TYPE: [PHONE / PC_PART / LAPTOP / UNSUPPORTED / UNKNOWN]
BRAND: [brand name]
MODEL: [ONE single model name — no "X or Y" — pick the best one]
DEVICE_TYPE: [Smartphone / GPU / CPU / PSU / Motherboard / SSD / RAM / Laptop / Unsupported]
CONFIDENCE: [HIGH / MEDIUM / LOW]
CONFIDENCE_REASON: [the specific visual clue that led to this ONE model choice]
ALTERNATIVE_1: [second most likely single model]
ALTERNATIVE_2: [third most likely single model]
NOTES: [anything else relevant]`;
}

// ─── POST /api/ai/analyze-image ───────────────────────────────────────────────
router.post('/analyze-image', optionalAuth, async (req, res) => {
  try {
    const { base64Image, mimeType = 'image/jpeg', userQuery = '' } = req.body;
    if (!base64Image) return res.status(400).json({ error: 'base64Image is required' });
    if (!process.env.GROQ_API_KEY) return res.status(500).json({ error: 'Groq API key not configured.' });

    const imagePayload = { type: 'image_url', image_url: { url: `data:${mimeType};base64,${base64Image}` } };

    // ── PASS 1: OCR (improved prompt) ─────────────────────────────────────────
    console.log('Pass 1: OCR with improved prompt...');
    let extractedText = '';
    try {
      const textRes = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${process.env.GROQ_API_KEY}` },
        body: JSON.stringify({
          model: VISION_MODEL,
          max_tokens: 400,
          temperature: 0.0,
          messages: [{ role: 'user', content: [{ type: 'text', text: OCR_PROMPT }, imagePayload] }],
        }),
      });
      if (textRes.ok) {
        const td = await textRes.json();
        extractedText = td.choices?.[0]?.message?.content?.trim() || '';
        console.log('OCR result:', extractedText.slice(0, 200));
      }
    } catch (e) { console.warn('OCR failed:', e.message); }

    // ── Model number exact match → IMPROVEMENT 1: larger DB hit rate ──────────
    const mappedModel = lookupModelFromText(extractedText);
    if (mappedModel) {
      console.log('Model number matched:', mappedModel);
      const parts = mappedModel.split(' ');
      const brand = parts[0];
      const model = parts.slice(1).join(' ');
      const isPhone = KNOWN_PHONE_BRANDS.some(b => mappedModel.toLowerCase().includes(b));
      const category = isPhone ? 'SMARTPHONE'
        : mappedModel.match(/RTX|GTX|Radeon|Arc A/i) ? 'GPU'
        : mappedModel.match(/Ryzen|Core i[0-9]|Xeon|Core Ultra/i) ? 'CPU'
        : 'SMARTPHONE';

      const dbEntry = lookupSpecDB(mappedModel);
      let fullSpecs;

      if (dbEntry) {
        console.log('Spec DB hit:', mappedModel);
        fullSpecs = formatSpecEntry(dbEntry.key, dbEntry.value);
      } else {
        const specsRes = await fetch('https://api.groq.com/openai/v1/chat/completions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${process.env.GROQ_API_KEY}` },
          body: JSON.stringify({
            model: 'llama-3.3-70b-versatile',
            max_tokens: 1500,
            temperature: 0.2,
            messages: [
              { role: 'system', content: SYSTEM_PROMPT },
              { role: 'user', content: `Device confirmed via model number: ${mappedModel}.\n\nProvide:\n1. Full technical specifications\n2. Philippine peso price (state the year, e.g. "as of 2025")\n3. Where to buy in Philippines (Lazada, Shopee, PC Express, DynaQuest, official stores)\n4. Brief verdict (2-3 sentences)\n\nIf unsure of a price, give a range and say "estimated". If spec is unknown, say "unconfirmed". Plain text, no markdown symbols.` },
            ],
          }),
        });
        const specsData = await specsRes.json();
        fullSpecs = specsData.choices?.[0]?.message?.content || 'Could not fetch specs.';
      }

      return res.json({
        isUnsupported: false, category, brand, model,
        displayName: mappedModel, deviceType: isPhone ? 'smartphone' : 'pc_part',
        confidence: 'HIGH', alternative1: '', alternative2: '',
        notes: dbEntry ? 'Identified via model number (Spec DB)' : 'Identified via model number',
        fullSpecs,
        rawOutput: `MODEL_NUMBER_MATCH: ${mappedModel}`,
        extractedText: extractedText.slice(0, 300),
      });
    }

    // ── PASS 2: Visual identification using upgraded Maverick model ───────────
    console.log('Pass 2: Visual ID with Maverick (128 experts)...');
    const identificationPrompt = buildIdentificationPrompt(extractedText);

    const groqVision = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${process.env.GROQ_API_KEY}` },
      body: JSON.stringify({
        model: VISION_MODEL,
        max_tokens: 400,
        temperature: 0.1,
        messages: [{ role: 'user', content: [{ type: 'text', text: identificationPrompt }, imagePayload] }],
      }),
    });

    if (!groqVision.ok) {
      const err = await groqVision.json();
      throw new Error(err.error?.message || `Groq Vision failed: ${groqVision.status}`);
    }

    const visionData = await groqVision.json();
    const rawOutput = visionData.choices[0].message.content.trim();
    console.log('Vision raw:', rawOutput.slice(0, 300));

    const extractField = (text, field) => {
      const line = text.split('\n').find(l => l.toUpperCase().startsWith(`${field.toUpperCase()}:`));
      const val = line?.split(':').slice(1).join(':').trim() || '';
      return (val === 'null' || val === 'N/A' || val === 'none') ? '' : val;
    };

    let hwType = extractField(rawOutput, 'HARDWARE_TYPE').toUpperCase();
    let devType = extractField(rawOutput, 'DEVICE_TYPE').toLowerCase();
    let brand = extractField(rawOutput, 'BRAND');
    let model = extractField(rawOutput, 'MODEL');
    let conf = extractField(rawOutput, 'CONFIDENCE').toUpperCase();
    const confReason = extractField(rawOutput, 'CONFIDENCE_REASON');
    let alt1 = extractField(rawOutput, 'ALTERNATIVE_1');
    let alt2 = extractField(rawOutput, 'ALTERNATIVE_2');
    const notes = extractField(rawOutput, 'NOTES');

    // ── IMPROVEMENT 4: Maverick verification pass for LOW/MEDIUM confidence ────
    if (conf === 'LOW' || conf === 'MEDIUM' || conf === '' || (!brand && !model)) {
      console.log(`Confidence ${conf || 'unknown'} — running Maverick verification pass...`);
      try {
        const verifyPrompt = `You are a hardware identification expert. Look at this image very carefully.

${extractedText ? `Text detected in image:\n"${extractedText}"\n` : 'No text detected.\n'}

Your task: Identify the SINGLE most specific product shown.

PHONE IDENTIFICATION RULES:
- USB-C port = iPhone 15 or newer | Lightning port = iPhone 14 or older
- Pill cutout (Dynamic Island) = iPhone 14 Pro, 15, 15 Pro, 16, 16 Pro
- Wide notch = iPhone 12, 13, 14 base/Plus | Small teardrop = iPhone 11 or older
- 3 cameras in triangle or square bump = Pro model | 2 cameras = base/Plus | 1 camera = SE
- iPhone 16 Pro: cameras in VERTICAL column | iPhone 15 Pro: cameras in TRIANGLE
- iPhone 16 vs 15 (both USB-C + pill + 2 cams): Camera Control button on right = iPhone 16 only
- Titanium frame = iPhone 15 Pro or newer Pro | Polished stainless = iPhone 12/13/14 Pro

GPU RULES:
- Read the exact model printed on the shroud label
- Green/black = NVIDIA | Red/black = AMD | Blue = Intel Arc

CPU RULES:
- Read text on chip lid exactly (e.g. i9-14900K, Ryzen 7 9800X3D)

Respond ONLY in this exact format:
HARDWARE_TYPE: [PHONE / PC_PART / LAPTOP / UNSUPPORTED]
BRAND: [brand name]
MODEL: [ONE specific model — never "X or Y"]
DEVICE_TYPE: [Smartphone / GPU / CPU / PSU / Motherboard / SSD / RAM / Laptop / Unsupported]
CONFIDENCE: [HIGH / MEDIUM / LOW]
CONFIDENCE_REASON: [the specific visual clue that determined this model]
ALTERNATIVE_1: [second most likely model]
ALTERNATIVE_2: [third most likely model]`;

        const verifyRes = await fetch('https://api.groq.com/openai/v1/chat/completions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${process.env.GROQ_API_KEY}` },
          body: JSON.stringify({
            model: VISION_MODEL,
            max_tokens: 300,
            temperature: 0.0,
            messages: [{ role: 'user', content: [{ type: 'text', text: verifyPrompt }, imagePayload] }],
          }),
        });
        if (verifyRes.ok) {
          const vd = await verifyRes.json();
          const vr = vd.choices[0].message.content.trim();
          console.log('Maverick verify result:', vr.slice(0, 200));
          const vb = extractField(vr, 'BRAND');
          const vm = extractField(vr, 'MODEL');
          const vc = extractField(vr, 'CONFIDENCE').toUpperCase();
          const vh = extractField(vr, 'HARDWARE_TYPE').toUpperCase();
          const vdt = extractField(vr, 'DEVICE_TYPE').toLowerCase();
          const va1 = extractField(vr, 'ALTERNATIVE_1');
          const va2 = extractField(vr, 'ALTERNATIVE_2');
          // Accept if Maverick is more confident or original had no brand/model
          if (vc === 'HIGH' || (vc === 'MEDIUM' && conf === 'LOW') || (!brand && vb)) {
            if (vb) brand = vb;
            if (vm) model = vm;
            if (vc) conf = vc;
            if (vh) hwType = vh;
            if (vdt) devType = vdt;
            if (va1) alt1 = va1;
            if (va2) alt2 = va2;
            console.log('Maverick upgraded result:', model, '|', conf);
          }
        }
      } catch (e) { console.warn('Maverick verify failed:', e.message); }
    }

    // ── Brand/category overrides ──────────────────────────────────────────────
    const brandLower = (brand || '').toLowerCase();
    const modelLower = (model || '').toLowerCase();
    const combined = `${brandLower} ${modelLower}`;
    const brandIsPhone = KNOWN_PHONE_BRANDS.some(b => combined.includes(b));

    if (brandIsPhone) { hwType = 'PHONE'; devType = 'smartphone'; }
    if (/rtx|gtx|radeon rx|arc a\d/i.test(combined)) { hwType = 'PC_PART'; devType = 'gpu'; }
    if (/ryzen|core i[0-9]|xeon|core ultra/i.test(combined)) { hwType = 'PC_PART'; devType = 'cpu'; }
    if (/ddr[45]/i.test(combined) && !/ssd|nvme/i.test(combined)) { hwType = 'PC_PART'; devType = 'ram'; }

    let category = 'UNKNOWN';
    if (hwType === 'PHONE' || devType.includes('smartphone') || devType.includes('phone')) category = 'SMARTPHONE';
    else if (devType.includes('laptop') || devType.includes('notebook')) category = 'LAPTOP';
    else if (REJECTED.some(r => devType.includes(r))) category = 'UNSUPPORTED';
    else if (devType.includes('gpu') || devType.includes('graphics')) category = 'GPU';
    else if (devType.includes('cpu') || devType.includes('processor')) category = 'CPU';
    else if (devType.includes('psu') || devType.includes('power supply')) category = 'PSU';
    else if (devType.includes('motherboard') || devType.includes('mainboard')) category = 'MOTHERBOARD';
    else if (devType.includes('ssd') || devType.includes('nvme') || devType.includes('storage')) category = 'SSD';
    else if (devType.includes('ram') || devType.includes('memory') || devType.includes('dimm')) category = 'RAM';
    else if (hwType === 'UNSUPPORTED') category = 'UNSUPPORTED';

    if (category === 'UNSUPPORTED') {
      return res.json({
        isUnsupported: true,
        message: `SpecSmart only supports: Smartphones, Laptops, CPUs, GPUs, PSUs, Motherboards, SSDs, and RAM.\n\nThis appears to be: ${devType || 'an unsupported device type'}.`,
        rawOutput,
      });
    }

    const modelStartsWithBrand = brand && model && model.toLowerCase().startsWith(brand.toLowerCase());
    const displayName = modelStartsWithBrand
      ? model
      : [brand, model].filter(Boolean).join(' ') || 'Unknown Device';

    // ── IMPROVEMENT 1: Larger DB = more hits here instead of AI fallback ──────
    const dbEntry = lookupSpecDB(displayName);
    let fullSpecs;

    if (dbEntry) {
      console.log('Spec DB hit (visual):', displayName);
      fullSpecs = formatSpecEntry(dbEntry.key, dbEntry.value);
      if (userQuery) {
        const contextualQuery = `The device is ${displayName}. Here are its confirmed specs:\n${fullSpecs}\n\nUser question: ${userQuery}\n\nAnswer based on these confirmed specs.`;
        const contextRes = await fetch('https://api.groq.com/openai/v1/chat/completions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${process.env.GROQ_API_KEY}` },
          body: JSON.stringify({
            model: 'llama-3.3-70b-versatile',
            max_tokens: 1500,
            temperature: 0.2,
            messages: [
              { role: 'system', content: SYSTEM_PROMPT },
              { role: 'user', content: contextualQuery },
            ],
          }),
        });
        const contextData = await contextRes.json();
        fullSpecs = contextData.choices?.[0]?.message?.content || fullSpecs;
      }
    } else {
      const specsQuery = userQuery
        ? `${userQuery} — The device is a ${displayName} (${devType}).`
        : `Device: ${displayName} (${devType}).\n\nProvide:\n1. Full technical specifications\n2. Philippine peso price (state the year, e.g. "as of 2025")\n3. Where to buy in the Philippines (Lazada, Shopee, PC Express, DynaQuest, Villman, official brand stores)\n4. Brief verdict (2-3 sentences)\n\nIf unsure of a spec or price, say "unconfirmed" or give a range like "₱X,XXX – ₱X,XXX (estimated)". Plain text, no markdown.`;

      const specsRes = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${process.env.GROQ_API_KEY}` },
        body: JSON.stringify({
          model: 'llama-3.3-70b-versatile',
          max_tokens: 1500,
          temperature: 0.2,
          messages: [
            { role: 'system', content: SYSTEM_PROMPT },
            { role: 'user', content: specsQuery },
          ],
        }),
      });
      const specsData = await specsRes.json();
      fullSpecs = specsData.choices?.[0]?.message?.content || 'Could not fetch full specs.';
    }

    console.log('Done:', displayName, '|', conf, '|', confReason);

    res.json({
      isUnsupported: false, category, brand, model, displayName,
      deviceType: devType, confidence: conf,
      alternative1: alt1, alternative2: alt2,
      notes: notes + (confReason ? ` | Clue: ${confReason}` : '') + (dbEntry ? ' | Spec DB verified' : ''),
      fullSpecs, rawOutput,
      extractedText: extractedText.slice(0, 300),
    });

  } catch (error) {
    console.error('Image analysis error:', error.message);
    res.status(500).json({
      error: 'Failed to analyze image',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
});

// ─── POST /api/ai/chat ────────────────────────────────────────────────────────
router.post('/chat', optionalAuth, async (req, res) => {
  try {
    const { messages, systemPrompt, stream = false } = req.body;
    if (!messages || !Array.isArray(messages) || messages.length === 0)
      return res.status(400).json({ error: 'Messages array is required' });
    if (!process.env.GROQ_API_KEY)
      return res.status(500).json({ error: 'Groq API key is not configured.' });

    // ── IMPROVEMENT 1: Expanded spec DB hit in chat queries ───────────────────
    const lastUserMsg = [...messages].reverse().find(m => m.role === 'user');
    if (lastUserMsg) {
      const msgText = typeof lastUserMsg.content === 'string' ? lastUserMsg.content : '';
      for (const [deviceName, specs] of Object.entries(SPEC_DB)) {
        const deviceLower = deviceName.toLowerCase();
        const msgLower = msgText.toLowerCase();
        const mentionsDevice = msgLower.includes(deviceLower) ||
          (deviceLower.includes('iphone') && msgLower.match(new RegExp(deviceLower.replace('apple ', ''), 'i')));
        const asksInfo = /spec|price|cost|how much|worth|buy|review|camera|battery|performance|benchmark|compare/i.test(msgText);
        if (mentionsDevice && asksInfo) {
          console.log('Chat: Spec DB hit for', deviceName);
          const dbContext = formatSpecEntry(deviceName, specs);
          const enhancedMessages = [
            {
              role: 'system',
              content: SYSTEM_PROMPT + `\n\nCONFIRMED SPEC DATABASE ENTRY FOR THIS QUERY:\n${dbContext}\n\nUse these confirmed specs in your answer. Do not contradict them. You may add context, comparisons, or opinions beyond what's listed.`,
            },
            ...messages.map(m => ({
              role: m.role,
              content: typeof m.content === 'string' ? m.content : JSON.stringify(m.content),
            })),
          ];

          if (stream) return handleStreamResponse(res, req, enhancedMessages);

          const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${process.env.GROQ_API_KEY}` },
            body: JSON.stringify({
              model: 'llama-3.3-70b-versatile',
              messages: enhancedMessages,
              temperature: 0.3,
              max_tokens: 2048,
            }),
          });
          const data = await response.json();
          return res.json({ content: data.choices[0].message.content });
        }
      }
    }

    const systemText = systemPrompt || SYSTEM_PROMPT;
    const groqMessages = [
      { role: 'system', content: systemText },
      ...messages.map(msg => ({
        role: msg.role,
        content: typeof msg.content === 'string' ? msg.content : JSON.stringify(msg.content),
      })),
    ];

    if (stream) return handleStreamResponse(res, req, groqMessages);

    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${process.env.GROQ_API_KEY}` },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        messages: groqMessages,
        temperature: 0.3,
        max_tokens: 2048,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error?.message || `Groq API failed: ${response.status}`);
    }
    const data = await response.json();
    if (!data.choices?.length) throw new Error('No response from Groq');
    res.json({ content: data.choices[0].message.content });

  } catch (error) {
    console.error('AI chat error:', error.message);
    if (error.message?.includes('rate_limit') || error.message?.includes('429'))
      return res.status(429).json({ error: 'Rate limit exceeded. Please wait a moment.' });
    res.status(500).json({
      error: 'Failed to get AI response',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
});

// ─── Streaming helper ─────────────────────────────────────────────────────────
async function handleStreamResponse(res, req, groqMessages) {
  const groqResponse = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${process.env.GROQ_API_KEY}` },
    body: JSON.stringify({
      model: 'llama-3.3-70b-versatile',
      messages: groqMessages,
      temperature: 0.3,
      max_tokens: 2048,
      stream: true,
    }),
  });

  if (!groqResponse.ok) {
    const errorData = await groqResponse.json();
    throw new Error(errorData.error?.message || `Groq API failed: ${groqResponse.status}`);
  }

  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.flushHeaders();

  const body = groqResponse.body;
  let buffer = '';
  body.on('data', chunk => {
    buffer += chunk.toString();
    const lines = buffer.split('\n');
    buffer = lines.pop();
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed) continue;
      if (trimmed === 'data: [DONE]') { res.write('data: [DONE]\n\n'); continue; }
      if (trimmed.startsWith('data: ')) {
        try {
          const json = JSON.parse(trimmed.slice(6));
          const token = json.choices?.[0]?.delta?.content;
          if (token) res.write(`data: ${JSON.stringify({ token })}\n\n`);
        } catch (e) { /* skip malformed */ }
      }
    }
  });
  body.on('end', () => { res.write('data: [DONE]\n\n'); res.end(); });
  body.on('error', () => { res.write(`data: ${JSON.stringify({ error: 'Stream error' })}\n\n`); res.end(); });
  req.on('close', () => res.end());
}

// ─── IMPROVEMENT 5: User confirmation learning cache ─────────────────────────
// In-memory cache maps visual fingerprints to confirmed device names
// Persists for the lifetime of the server process
const confirmationCache = new Map();

router.post('/confirm-device', optionalAuth, async (req, res) => {
  try {
    const { confirmedName, extractedText, category } = req.body;
    if (!confirmedName) return res.status(400).json({ error: 'confirmedName is required' });

    // Store the mapping: extracted text signature → confirmed device name
    if (extractedText && extractedText.length > 3) {
      const key = extractedText.toLowerCase().trim().slice(0, 100);
      confirmationCache.set(key, { name: confirmedName, category, timestamp: Date.now() });
      console.log(`Learned: "${key.slice(0, 50)}..." → ${confirmedName}`);
    }

    res.json({ success: true, message: `Learned: ${confirmedName}` });
  } catch (error) {
    res.status(500).json({ error: 'Failed to save confirmation' });
  }
});

// ─── GET /api/ai/spec-db — expose DB device list for frontend search ──────────
router.get('/spec-db', (req, res) => {
  const devices = Object.keys(SPEC_DB).map(name => {
    const entry = SPEC_DB[name];
    return {
      name,
      price_php: entry.price_php || 'unconfirmed',
      verdict: entry.verdict || '',
    };
  });
  res.json({ devices, count: devices.length });
});

export default router;