import express from 'express';
import fetch from 'node-fetch';
import { optionalAuth } from '../middleware/auth.js';

const router = express.Router();

// ─── Model fallback chain ─────────────────────────────────────────────────────
const CHAT_MODELS = [
  'llama-3.3-70b-versatile',
  'llama-3.1-8b-instant',
];

async function groqChatWithFallback(payload) {
  let lastError;
  for (const model of CHAT_MODELS) {
    try {
      const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
        },
        body: JSON.stringify({ ...payload, model }),
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        const errMsg = errData.error?.message || `HTTP ${response.status}`;
        if (
          response.status === 429 ||
          errMsg.toLowerCase().includes('rate limit') ||
          errMsg.toLowerCase().includes('tokens per day') ||
          errMsg.toLowerCase().includes('tpd') ||
          errMsg.toLowerCase().includes('quota')
        ) {
          console.warn(`[groqFallback] Model "${model}" rate limited. Trying next...`);
          lastError = new Error(errMsg);
          continue;
        }
        throw new Error(errMsg);
      }

      const data = await response.json();
      if (data.choices?.length) {
        if (model !== CHAT_MODELS[0]) console.log(`[groqFallback] Used fallback model: ${model}`);
        return data;
      }
      throw new Error('Empty response from Groq');
    } catch (err) {
      if (
        err.message?.toLowerCase().includes('rate limit') ||
        err.message?.toLowerCase().includes('tokens per day') ||
        err.message?.toLowerCase().includes('tpd')
      ) {
        console.warn(`[groqFallback] Model "${model}" rate limited (caught). Trying next...`);
        lastError = err;
        continue;
      }
      throw err;
    }
  }
  throw new Error(
    'All AI models are currently rate limited. Please wait a few minutes and try again. ' +
    (lastError?.message || '')
  );
}

async function groqStreamWithFallback(payload) {
  let lastError;
  for (const model of CHAT_MODELS) {
    try {
      const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
        },
        body: JSON.stringify({ ...payload, model, stream: true }),
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        const errMsg = errData.error?.message || `HTTP ${response.status}`;
        if (
          response.status === 429 ||
          errMsg.toLowerCase().includes('rate limit') ||
          errMsg.toLowerCase().includes('tokens per day') ||
          errMsg.toLowerCase().includes('tpd') ||
          errMsg.toLowerCase().includes('quota')
        ) {
          console.warn(`[groqStreamFallback] Model "${model}" rate limited. Trying next...`);
          lastError = new Error(errMsg);
          continue;
        }
        throw new Error(errMsg);
      }

      if (model !== CHAT_MODELS[0]) console.log(`[groqStreamFallback] Using fallback model: ${model}`);
      return response;
    } catch (err) {
      if (
        err.message?.toLowerCase().includes('rate limit') ||
        err.message?.toLowerCase().includes('tokens per day') ||
        err.message?.toLowerCase().includes('tpd')
      ) {
        console.warn(`[groqStreamFallback] Model "${model}" rate limited (caught). Trying next...`);
        lastError = err;
        continue;
      }
      throw err;
    }
  }
  throw new Error(
    'All AI models are currently rate limited. Please wait a few minutes and try again. ' +
    (lastError?.message || '')
  );
}

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

// ─── Spec Database ────────────────────────────────────────────────────────────
const SPEC_DB = {
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
  'Apple iPhone 12 Pro': {
    display: '6.1" Super Retina XDR OLED, 2532×1170, 60Hz',
    processor: 'Apple A14 Bionic (5nm)',
    ram: '6GB',
    storage: '128GB / 256GB / 512GB',
    camera: '12MP main (f/1.6, OIS) + 12MP Ultra Wide + 12MP 2x telephoto | 4K60fps, ProRAW',
    battery: '2815mAh, 20W wired, 15W MagSafe, Lightning',
    os: 'iOS 16 max (iOS 17 not supported)',
    connectivity: '5G, Wi-Fi 6, Bluetooth 5.0, Lightning, NFC',
    build: 'Surgical-grade stainless steel frame, Ceramic Shield front, textured matte glass back, IP68',
    price_php: '₱19,990 – ₱24,990 (second-hand/refurbished 2025)',
    buy: 'iStore certified pre-owned, Lazada/Shopee reputable sellers, Facebook Marketplace',
    verdict: 'Still a capable iPhone with stainless steel build and triple cameras. No iOS 17/18 support is the main concern in 2025.',
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
    verdict: 'Ultimate Android powerhouse. The 200MP camera and S Pen make it a productivity beast.',
  },
  'Samsung Galaxy S24+': {
    display: '6.7" Dynamic AMOLED 2X, 3088×1440, 1-120Hz adaptive',
    processor: 'Snapdragon 8 Gen 3 for Galaxy (4nm)',
    ram: '12GB',
    storage: '256GB / 512GB',
    camera: '50MP main (f/1.8) + 10MP 3x telephoto + 12MP Ultra Wide | 8K30fps',
    battery: '4900mAh, 45W wired, 15W wireless',
    os: 'Android 14, One UI 6.1',
    price_php: '₱64,990 (256GB)',
    buy: 'Samsung PH, Lazada/Shopee Samsung official',
    verdict: 'Great balance of screen size and power. Better value than Ultra for most users.',
  },
  'Samsung Galaxy S24': {
    display: '6.2" Dynamic AMOLED 2X, 2340×1080, 1-120Hz adaptive',
    processor: 'Snapdragon 8 Gen 3 for Galaxy (4nm)',
    ram: '8GB',
    storage: '128GB / 256GB',
    camera: '50MP main (f/1.8) + 10MP 3x telephoto + 12MP Ultra Wide | 8K30fps',
    battery: '4000mAh, 25W wired, 15W wireless',
    os: 'Android 14, One UI 6.1',
    price_php: '₱44,990 (128GB) | ₱49,990 (256GB)',
    buy: 'Samsung PH, Lazada/Shopee Samsung official',
    verdict: 'Compact flagship with Snapdragon. Best compact Android phone in PH under ₱50K.',
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
    buy: 'Samsung PH, Lazada/Shopee Samsung official',
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
    price_php: '₱15,990 (128GB) | ₱17,990 (256GB)',
    buy: 'Samsung PH, Lazada/Shopee Samsung official',
    verdict: 'Very capable mid-range. IP67 and AMOLED screen at this price is hard to beat.',
  },
  'Xiaomi 14 Ultra': {
    display: '6.73" LTPO AMOLED, 3200×1440, 1-120Hz, 3000 nits',
    processor: 'Snapdragon 8 Gen 3 (4nm)',
    ram: '16GB',
    storage: '512GB',
    camera: '50MP Leica 1-inch main (f/1.63-4.0 variable) + 50MP 5x periscope + 50MP 3.2x + 50MP Ultra Wide | 8K30fps',
    battery: '5300mAh, 90W wired, 80W wireless, 10W reverse',
    os: 'Android 14, HyperOS',
    price_php: '₱74,990 – ₱79,990 (estimated, limited availability PH)',
    buy: 'Xiaomi PH Lazada/Shopee official (may need to import)',
    verdict: 'Best Android camera phone of 2024. The 1-inch Leica sensor is extraordinary.',
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
    verdict: '120W charging and 200MP camera under ₱20K is exceptional value.',
  },
  'Xiaomi Redmi Note 13 Pro': {
    display: '6.67" AMOLED, 2400×1080, 120Hz, 1800 nits',
    processor: 'Snapdragon 7s Gen 2 (4nm)',
    ram: '8GB / 12GB',
    storage: '128GB / 256GB',
    camera: '200MP main (OIS) + 8MP Ultra Wide + 2MP macro',
    battery: '5100mAh, 67W wired',
    os: 'Android 13, MIUI 14 / HyperOS',
    price_php: '₱13,990 (8GB/128GB) | ₱15,990 (8GB/256GB)',
    buy: 'Xiaomi PH Lazada/Shopee official',
    verdict: '200MP AMOLED phone under ₱16K — incredible spec-per-peso ratio.',
  },
  'POCO F6 Pro': {
    display: '6.67" LTPO AMOLED, 3200×1440, 1-120Hz, 4000 nits',
    processor: 'Snapdragon 8 Gen 2 (4nm)',
    ram: '12GB',
    storage: '256GB / 512GB',
    camera: '50MP main (f/1.6, OIS) + 8MP Ultra Wide + 2MP macro | 4K60fps',
    battery: '5000mAh, 67W wired',
    os: 'Android 14, HyperOS',
    price_php: '₱24,990 (12GB/256GB)',
    buy: 'Xiaomi PH Lazada/Shopee official',
    verdict: 'Flagship chip at mid-range price. Best gaming phone under ₱25K in PH.',
  },
  'POCO X6 Pro': {
    display: '6.67" AMOLED, 2712×1220, 120Hz, 2400 nits',
    processor: 'MediaTek Dimensity 8300 Ultra (4nm)',
    ram: '8GB / 12GB',
    storage: '256GB',
    camera: '64MP main (f/1.79) + 8MP Ultra Wide + 2MP macro',
    battery: '5000mAh, 67W wired',
    os: 'Android 14, HyperOS',
    price_php: '₱16,990 (8GB/256GB) | ₱18,490 (12GB/256GB)',
    buy: 'Xiaomi PH Lazada/Shopee official',
    verdict: 'Dimensity 8300 Ultra is a beast for gaming. Best gaming phone under ₱19K.',
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
  'OnePlus 12': {
    display: '6.82" LTPO AMOLED, 3168×1440, 1-120Hz, 4500 nits',
    processor: 'Snapdragon 8 Gen 3 (4nm)',
    ram: '12GB / 16GB',
    storage: '256GB / 512GB',
    camera: '50MP Hasselblad main (f/1.6, OIS) + 64MP 3x periscope + 48MP Ultra Wide',
    battery: '5400mAh, 100W SUPERVOOC, 50W AirVOOC wireless',
    os: 'Android 14, OxygenOS 14',
    price_php: '₱44,990 (12GB/256GB)',
    buy: 'OnePlus PH Lazada/Shopee official',
    verdict: '100W charging fills the massive 5400mAh battery in ~26 min. Excellent value flagship.',
  },
  'NVIDIA GeForce RTX 4090': {
    vram: '24GB GDDR6X',
    bus: '384-bit',
    cuda_cores: '16384',
    boost_clock: '2.52 GHz',
    tdp: '450W',
    pcie: 'PCIe 4.0 x16',
    recommended_psu: '850W+',
    performance: '4K ultra: 150+ FPS in most AAA games | 8K gaming capable',
    price_php: '₱89,990 – ₱109,990 (Founders Edition / AIB variants)',
    buy: 'PC Express, DynaQuest PC, Villman, Lazada/Shopee official stores',
    verdict: 'Absolute fastest consumer GPU. Overkill for most, but future-proof for 4K/8K gaming and AI workloads.',
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
    verdict: 'Best AMD GPU. 24GB VRAM makes it outstanding for creative work.',
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
    verdict: '16GB VRAM at this price is AMD\'s key advantage over RTX 4070.',
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
    verdict: 'Best value gaming CPU from Intel.',
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
    verdict: 'Best budget gaming CPU. No integrated GPU (F suffix).',
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
    verdict: 'Cheapest viable gaming CPU in 2025.',
  },
  'AMD Ryzen 9 9950X': {
    cores: '16 cores, 32 threads',
    base_clock: '4.3 GHz',
    boost_clock: '5.7 GHz',
    cache: '64MB L3',
    tdp: '170W',
    socket: 'AM5',
    memory: 'DDR5-5600',
    pcie: 'PCIe 5.0',
    price_php: '₱34,990 – ₱39,990',
    buy: 'PC Express, DynaQuest PC, Villman, Lazada',
    verdict: 'Zen 5 flagship. Fastest desktop CPU. Ideal for content creation.',
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
    verdict: 'THE best gaming CPU in 2025. Zen 5 + 3D V-Cache = best of both worlds.',
  },
  'AMD Ryzen 9 7950X': {
    cores: '16 cores, 32 threads',
    base_clock: '4.5 GHz',
    boost_clock: '5.7 GHz',
    cache: '64MB L3',
    tdp: '170W',
    socket: 'AM5',
    memory: 'DDR5-5200',
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
    price_php: '₱9,990 – ₱12,990',
    buy: 'PC Express, DynaQuest PC, Lazada',
    verdict: 'Great mid-range gaming CPU.',
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
    verdict: 'Best AM4 CPU for budget builds.',
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
  'Corsair Vengeance DDR5 6000MHz': {
    type: 'DDR5',
    speed: '6000 MT/s (PC5-48000)',
    capacity: '32GB (2×16GB) / 64GB (2×32GB)',
    timings: 'CL30 / CL36',
    voltage: '1.35V',
    xmp: 'XMP 3.0 / EXPO',
    price_php: '₱4,990 – ₱5,990 (32GB kit)',
    buy: 'PC Express, DynaQuest PC, Villman, Lazada Corsair official',
    verdict: 'DDR5-6000 is the sweet spot for Ryzen 7000/9000 and Intel 13th/14th gen.',
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
    verdict: 'Premium DDR5 kit. Great RGB and reliable performance.',
  },
  'Kingston Fury Beast DDR5 6000': {
    type: 'DDR5',
    speed: '6000 MT/s',
    capacity: '32GB (2×16GB) / 64GB (2×32GB)',
    timings: 'CL36',
    voltage: '1.35V',
    xmp: 'XMP 3.0 / EXPO',
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
    price_php: '₱1,890 – ₱2,490 (16GB kit) | ₱3,490 – ₱4,490 (32GB kit)',
    buy: 'PC Express, DynaQuest PC, Villman, Lazada',
    verdict: 'Most popular DDR4 RAM in PH. Reliable, low-profile, works everywhere.',
  },
  'Samsung 990 Pro 2TB NVMe': {
    type: 'NVMe PCIe 4.0 x4, M.2 2280',
    seq_read: '7450 MB/s',
    seq_write: '6900 MB/s',
    random_read: '1400K IOPS',
    random_write: '1550K IOPS',
    endurance: '1200 TBW',
    warranty: '5 years',
    price_php: '₱5,990 – ₱6,990 (1TB) | ₱9,990 – ₱11,990 (2TB)',
    buy: 'PC Express, DynaQuest PC, Villman, Lazada Samsung official',
    verdict: 'Fastest PCIe 4.0 SSD. Best overall NVMe in PH for performance builds.',
  },
  'WD Black SN850X 2TB NVMe': {
    type: 'NVMe PCIe 4.0 x4, M.2 2280',
    seq_read: '7300 MB/s',
    seq_write: '6600 MB/s',
    endurance: '1200 TBW',
    price_php: '₱5,490 – ₱6,490 (1TB) | ₱9,490 – ₱10,990 (2TB)',
    buy: 'PC Express, DynaQuest PC, Lazada WD official',
    verdict: 'Top-tier NVMe. PlayStation 5 compatible.',
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
    price_php: '₱2,490 – ₱2,990 (1TB) | ₱3,990 – ₱4,490 (2TB)',
    buy: 'PC Express, DynaQuest PC, Lazada',
    verdict: 'Best SATA SSD upgrade for old laptops and desktops.',
  },
  'ASUS ROG Strix Z790-E Gaming': {
    socket: 'LGA1700',
    chipset: 'Intel Z790',
    form_factor: 'ATX',
    memory: '4x DDR5, up to 192GB',
    expansion: '2x PCIe 5.0 x16 + 1x PCIe 4.0 x4',
    storage: '4x M.2 (PCIe 5.0/4.0) + 6x SATA',
    networking: '2.5G LAN + Wi-Fi 6E',
    price_php: '₱24,990 – ₱29,990',
    buy: 'PC Express, DynaQuest PC, Villman, Lazada ASUS official',
    verdict: 'Premium Z790 board. Excellent VRM for i9 overclocking.',
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
  'Gigabyte B650 Aorus Elite AX': {
    socket: 'AM5',
    chipset: 'AMD B650',
    form_factor: 'ATX',
    memory: '4x DDR5, up to 192GB',
    storage: '3x M.2 + 4x SATA',
    networking: '2.5G LAN + Wi-Fi 6E',
    price_php: '₱11,990 – ₱14,490',
    buy: 'PC Express, DynaQuest PC, Lazada',
    verdict: 'Best AMD AM5 board under ₱15K in PH.',
  },
  'ASRock B550 Steel Legend': {
    socket: 'AM4',
    chipset: 'AMD B550',
    form_factor: 'ATX',
    memory: '4x DDR4, up to 128GB',
    storage: '2x M.2 + 6x SATA',
    networking: '1G LAN',
    price_php: '₱5,990 – ₱7,990',
    buy: 'PC Express, DynaQuest PC, Lazada',
    verdict: 'Best budget AM4 board in PH.',
  },
  'Corsair RM850x 850W Gold': {
    wattage: '850W',
    efficiency: '80 PLUS Gold',
    modular: 'Fully Modular',
    fan: '135mm Zero RPM',
    warranty: '10 years',
    price_php: '₱6,990 – ₱8,490',
    buy: 'PC Express, DynaQuest PC, Villman, Lazada',
    verdict: 'Top pick for RTX 4080/4090 builds. Reliable and quiet.',
  },
  'Seasonic Focus GX-850 850W Gold': {
    wattage: '850W',
    efficiency: '80 PLUS Gold',
    modular: 'Fully Modular',
    fan: '120mm Fluid Dynamic Bearing',
    warranty: '10 years',
    price_php: '₱5,990 – ₱7,490',
    buy: 'PC Express, DynaQuest PC, Lazada',
    verdict: 'Seasonic makes OEM units for many other brands. Extremely reliable.',
  },
};

// ─── Static image map for known devices (instant, no API calls) ───────────────
const STATIC_IMAGE_MAP = {
  // iPhones
  'Apple iPhone 16 Pro Max': 'https://store.storeimages.cdn-apple.com/4982/as-images.apple.com/is/iphone-16-pro-finish-select-202409-6-9inch-deserttitanium?wid=400&hei=400&fmt=jpeg&qlt=95',
  'Apple iPhone 16 Pro': 'https://store.storeimages.cdn-apple.com/4982/as-images.apple.com/is/iphone-16-pro-finish-select-202409-6-3inch-deserttitanium?wid=400&hei=400&fmt=jpeg&qlt=95',
  'Apple iPhone 16 Plus': 'https://store.storeimages.cdn-apple.com/4982/as-images.apple.com/is/iphone-16-plus-finish-select-202409-6-7inch-black?wid=400&hei=400&fmt=jpeg&qlt=95',
  'Apple iPhone 16': 'https://store.storeimages.cdn-apple.com/4982/as-images.apple.com/is/iphone-16-finish-select-202409-6-1inch-black?wid=400&hei=400&fmt=jpeg&qlt=95',
  'Apple iPhone 15 Pro Max': 'https://store.storeimages.cdn-apple.com/4982/as-images.apple.com/is/iphone-15-pro-finish-select-202309-6-7inch-naturaltitanium?wid=400&hei=400&fmt=jpeg&qlt=95',
  'Apple iPhone 15 Pro': 'https://store.storeimages.cdn-apple.com/4982/as-images.apple.com/is/iphone-15-pro-finish-select-202309-6-1inch-naturaltitanium?wid=400&hei=400&fmt=jpeg&qlt=95',
  'Apple iPhone 15': 'https://store.storeimages.cdn-apple.com/4982/as-images.apple.com/is/iphone-15-finish-select-202309-6-1inch-pink?wid=400&hei=400&fmt=jpeg&qlt=95',
  'Apple iPhone 14': 'https://store.storeimages.cdn-apple.com/4982/as-images.apple.com/is/iphone-14-finish-select-202209-6-1inch-midnight?wid=400&hei=400&fmt=jpeg&qlt=95',
  'Apple iPhone 13': 'https://store.storeimages.cdn-apple.com/4982/as-images.apple.com/is/iphone-13-finish-select-2023-6-1inch-midnight?wid=400&hei=400&fmt=jpeg&qlt=95',
  'Apple iPhone SE (2022)': 'https://store.storeimages.cdn-apple.com/4982/as-images.apple.com/is/iphone-se-finish-select-202203-midnight?wid=400&hei=400&fmt=jpeg&qlt=95',
  // Samsung
  'Samsung Galaxy S24 Ultra': 'https://images.samsung.com/is/image/samsung/p6pim/levant/2401/gallery/levant-galaxy-s24-ultra-s928-sm-s928bztgmid-thumb-539573424?$264_264_PNG$',
  'Samsung Galaxy S24+': 'https://images.samsung.com/is/image/samsung/p6pim/levant/2401/gallery/levant-galaxy-s24-sm-s926bzadeub-thumb-539573271?$264_264_PNG$',
  'Samsung Galaxy S24': 'https://images.samsung.com/is/image/samsung/p6pim/levant/2401/gallery/levant-galaxy-s24-sm-s921bzadeub-thumb-539573097?$264_264_PNG$',
  'Samsung Galaxy S23 Ultra': 'https://images.samsung.com/is/image/samsung/p6pim/levant/2302/gallery/levant-galaxy-s23-ultra-s918-sm-s918bzageub-thumb-534863401?$264_264_PNG$',
  'Samsung Galaxy A55': 'https://images.samsung.com/is/image/samsung/p6pim/levant/2404/gallery/levant-galaxy-a55-5g-sm-a556ezageub-thumb-541477071?$264_264_PNG$',
  'Samsung Galaxy A35': 'https://images.samsung.com/is/image/samsung/p6pim/levant/2404/gallery/levant-galaxy-a35-5g-sm-a356ezageub-thumb-541478412?$264_264_PNG$',
  // Xiaomi / POCO
  'Xiaomi 14 Ultra': 'https://i01.appmifile.com/webfile/globalimg/products/pc/xiaomi-14-ultra/specs-header.png',
  'Xiaomi 14': 'https://i01.appmifile.com/webfile/globalimg/products/pc/xiaomi-14/xiaomi14-white.png',
  'Xiaomi Redmi Note 13 Pro+': 'https://i01.appmifile.com/webfile/globalimg/products/pc/redmi-note-13-pro-plus/overview-header-img.png',
  'Xiaomi Redmi Note 13 Pro': 'https://i01.appmifile.com/webfile/globalimg/products/pc/redmi-note-13-pro/kv.png',
  'POCO F6 Pro': 'https://i01.appmifile.com/webfile/globalimg/products/pc/poco-f6-pro/poco-f6-pro-black.png',
  'POCO X6 Pro': 'https://i01.appmifile.com/webfile/globalimg/products/pc/poco-x6-pro/overview-kv.png',
  // Google
  'Google Pixel 9 Pro': 'https://lh3.googleusercontent.com/Nu8_kKHBPKoY6sLVAGXTVRZl9LHkxmYP2B1L_X7R6xr8xW_x_X_wW_tJ_2ZbE_Q=w400',
  'Google Pixel 9': 'https://lh3.googleusercontent.com/T_xzEE4cBX0j8Xh7oa2nVJzFNZmHzNZmHzNZmHzNZmHzNZmHzNZmHzNZmHzNZmHzN=w400',
  // OnePlus
  'OnePlus 12': 'https://oasis.opstatics.com/content/dam/oasis/page/2023/global/products/12/spec/Silky-Black-spec.png',
  // NVIDIA GPUs
  'NVIDIA GeForce RTX 4090': 'https://www.nvidia.com/content/nvidiaGDC/us/en_US/geforce/graphics-cards/40-series/rtx-4090/_jcr_content/root/responsivegrid/nv_container_392921705/nv_container/nv_image.coreimg.100.630.jpeg/1686857513391/geforce-rtx-4090-product-photo-001.jpeg',
  'NVIDIA GeForce RTX 4080 Super': 'https://www.nvidia.com/content/nvidiaGDC/us/en_US/geforce/graphics-cards/40-series/rtx-4080-super/_jcr_content/root/responsivegrid/nv_container_392921705/nv_container/nv_image.coreimg.100.630.jpeg/1705025793566/geforce-rtx-4080-super-product-photo-001.jpeg',
  'NVIDIA GeForce RTX 4070 Ti Super': 'https://www.nvidia.com/content/nvidiaGDC/us/en_US/geforce/graphics-cards/40-series/rtx-4070-ti-super/_jcr_content/root/responsivegrid/nv_container_392921705/nv_container/nv_image.coreimg.100.630.jpeg/1705025793566/geforce-rtx-4070-ti-super-product-photo-001.jpeg',
  'NVIDIA GeForce RTX 4070 Super': 'https://www.nvidia.com/content/nvidiaGDC/us/en_US/geforce/graphics-cards/40-series/rtx-4070-super/_jcr_content/root/responsivegrid/nv_container_392921705/nv_container/nv_image.coreimg.100.630.jpeg/1705025793566/geforce-rtx-4070-super-product-photo-001.jpeg',
  'NVIDIA GeForce RTX 4070': 'https://www.nvidia.com/content/nvidiaGDC/us/en_US/geforce/graphics-cards/40-series/rtx-4070/_jcr_content/root/responsivegrid/nv_container_392921705/nv_container/nv_image.coreimg.100.630.jpeg/1699469432574/geforce-rtx-4070-product-photo-001.jpeg',
  'NVIDIA GeForce RTX 4060 Ti': 'https://www.nvidia.com/content/nvidiaGDC/us/en_US/geforce/graphics-cards/40-series/rtx-4060-ti/_jcr_content/root/responsivegrid/nv_container_392921705/nv_container/nv_image.coreimg.100.630.jpeg/1699469432574/geforce-rtx-4060-ti-product-photo-001.jpeg',
  'NVIDIA GeForce RTX 4060': 'https://www.nvidia.com/content/nvidiaGDC/us/en_US/geforce/graphics-cards/40-series/rtx-4060/_jcr_content/root/responsivegrid/nv_container_392921705/nv_container/nv_image.coreimg.100.630.jpeg/1699469432574/geforce-rtx-4060-product-photo-001.jpeg',
  // AMD GPUs
  'AMD Radeon RX 7900 XTX': 'https://www.amd.com/system/files/2022-11/1207776-amd-radeon-rx-7900-xtx-600x450.png',
  'AMD Radeon RX 7800 XT': 'https://www.amd.com/system/files/2023-08/1272476-amd-radeon-rx-7800-xt-600x450.png',
  'AMD Radeon RX 7600': 'https://www.amd.com/system/files/2023-05/1253938-amd-radeon-rx-7600-600x450.png',
  // CPUs
  'Intel Core i9-14900K': 'https://www.intel.com/content/dam/www/central-libraries/us/en/images/2022-11/processor-core-i9-14900k-badge-left-angle.png',
  'Intel Core i7-14700K': 'https://www.intel.com/content/dam/www/central-libraries/us/en/images/2022-11/processor-core-i7-14700k-badge-left-angle.png',
  'Intel Core i5-14600K': 'https://www.intel.com/content/dam/www/central-libraries/us/en/images/2022-11/processor-core-i5-14600k-badge-left-angle.png',
  'Intel Core i5-14400F': 'https://www.intel.com/content/dam/www/central-libraries/us/en/images/2022-11/processor-core-i5-14400f-badge-left-angle.png',
  'Intel Core i3-14100F': 'https://www.intel.com/content/dam/www/central-libraries/us/en/images/2022-11/processor-core-i3-14100f-badge-left-angle.png',
  'AMD Ryzen 9 9950X': 'https://www.amd.com/system/files/2024-07/amd-ryzen-9-9950x-PIB-left-facing.png',
  'AMD Ryzen 7 9800X3D': 'https://www.amd.com/system/files/2024-10/amd-ryzen-7-9800x3d-PIB-left-facing.png',
  'AMD Ryzen 9 7950X': 'https://www.amd.com/system/files/2022-08/amd-ryzen-9-7950x-PIB-left-facing.png',
  'AMD Ryzen 7 7800X3D': 'https://www.amd.com/system/files/2023-01/amd-ryzen-7-7800x3d-PIB-left-facing.png',
  'AMD Ryzen 5 9600X': 'https://www.amd.com/system/files/2024-07/amd-ryzen-5-9600x-PIB-left-facing.png',
  'AMD Ryzen 5 7600X': 'https://www.amd.com/system/files/2022-08/amd-ryzen-5-7600x-PIB-left-facing.png',
  'AMD Ryzen 5 5600X': 'https://www.amd.com/system/files/2021-03/amd-ryzen-5-5600x-PIB-left-facing.png',
  'AMD Ryzen 7 5800X3D': 'https://www.amd.com/system/files/2022-03/amd-ryzen-7-5800x3d-PIB-left-facing.png',
};

const VISION_MODEL = 'meta-llama/llama-4-scout-17b-16e-instruct';

const OCR_PROMPT = `You are an OCR engine. Extract ALL visible text from this image with maximum precision.

Priority targets:
1. Model numbers (e.g. SM-S928B, A3293, RTX 4090, i9-14900K, Ryzen 7 7800X3D)
2. Brand names printed on the device
3. Sticker labels, serial numbers, regulatory markings
4. Text on screen if device is powered on
5. PCB markings, chip labels, engravings
6. Storage capacity stickers (128GB, 256GB, 512GB, 1TB)

Output ONLY the raw extracted text, one item per line. No explanations, no markdown.`;

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
    expansion: '🔌  Expansion', networking: '📡  Networking',
    wattage: '⚡  Wattage', efficiency: '💡  Efficiency',
    modular: '🔌  Modular', fan: '❄️  Fan', rgb: '💡  RGB', xmp: '⚡  XMP/EXPO',
    timings: '⏱️  Timings', voltage: '⚡  Voltage',
    random_read: '⚡  Random Read', random_write: '⚡  Random Write',
  };
  for (const [key, label] of Object.entries(fieldLabels)) {
    if (entry[key]) lines.push(`${label}: ${entry[key]}`);
  }
  return lines.join('\n');
}

function normalizeForLookup(name) {
  return (name || '').toLowerCase().replace(/\s+/g, ' ').trim();
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
  'A3291': 'Apple iPhone 16 Pro', 'A3292': 'Apple iPhone 16 Pro',
  'A3287': 'Apple iPhone 16 Plus', 'A3288': 'Apple iPhone 16 Plus',
  'A3283': 'Apple iPhone 16', 'A3284': 'Apple iPhone 16',
  'A2894': 'Apple iPhone 15 Pro Max', 'A3105': 'Apple iPhone 15 Pro Max',
  'A2848': 'Apple iPhone 15 Pro', 'A3101': 'Apple iPhone 15 Pro',
  'A3093': 'Apple iPhone 15 Plus', 'A3090': 'Apple iPhone 15 Plus',
  'A3092': 'Apple iPhone 15', 'A3089': 'Apple iPhone 15',
  'A2651': 'Apple iPhone 14 Pro Max', 'A2893': 'Apple iPhone 14 Pro Max',
  'A2650': 'Apple iPhone 14 Pro', 'A2889': 'Apple iPhone 14 Pro',
  'A2649': 'Apple iPhone 14', 'A2881': 'Apple iPhone 14',
  'A2484': 'Apple iPhone 13 Pro Max', 'A2641': 'Apple iPhone 13 Pro Max',
  'A2483': 'Apple iPhone 13 Pro', 'A2640': 'Apple iPhone 13 Pro',
  'A2482': 'Apple iPhone 13', 'A2634': 'Apple iPhone 13',
  'A2481': 'Apple iPhone 13 Mini', 'A2628': 'Apple iPhone 13 Mini',
  'A2341': 'Apple iPhone 12 Pro', 'A2408': 'Apple iPhone 12 Pro',
  'A2172': 'Apple iPhone 12', 'A2402': 'Apple iPhone 12',
  'A2595': 'Apple iPhone SE (2022)', 'A2783': 'Apple iPhone SE (2022)',
  'SM-S928B': 'Samsung Galaxy S24 Ultra', 'SM-S928U': 'Samsung Galaxy S24 Ultra',
  'SM-S926B': 'Samsung Galaxy S24+', 'SM-S926U': 'Samsung Galaxy S24+',
  'SM-S921B': 'Samsung Galaxy S24', 'SM-S921U': 'Samsung Galaxy S24',
  'SM-S918B': 'Samsung Galaxy S23 Ultra', 'SM-S918U': 'Samsung Galaxy S23 Ultra',
  'SM-S908B': 'Samsung Galaxy S22 Ultra',
  'SM-A556B': 'Samsung Galaxy A55',
  'SM-A356B': 'Samsung Galaxy A35',
  '23116PN5BC': 'Xiaomi 14 Ultra',
  '23049PCD8G': 'Xiaomi 14',
  '23117RA68G': 'Xiaomi Redmi Note 13 Pro+',
  '2312DRA50G': 'Xiaomi Redmi Note 13 Pro',
  'CPH2609': 'OPPO Reno 12 Pro',
  'GC3VE': 'Google Pixel 9 Pro', 'GKV4X': 'Google Pixel 9',
  'PJD110': 'OnePlus 12', 'CPH2573': 'OnePlus 12',
};

const MODEL_PREFIX_MAP = {
  'SM-S928': 'Samsung Galaxy S24 Ultra',
  'SM-S926': 'Samsung Galaxy S24+',
  'SM-S921': 'Samsung Galaxy S24',
  'SM-S918': 'Samsung Galaxy S23 Ultra',
  'SM-S908': 'Samsung Galaxy S22 Ultra',
  'SM-A556': 'Samsung Galaxy A55',
  'SM-A356': 'Samsung Galaxy A35',
};

const KNOWN_PHONE_BRANDS = [
  'samsung', 'apple', 'iphone', 'xiaomi', 'redmi', 'poco',
  'oppo', 'vivo', 'realme', 'oneplus', 'huawei', 'honor',
  'nokia', 'motorola', 'sony', 'infinix', 'tecno', 'itel',
  'nothing', 'google pixel', 'pixel',
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

function buildIdentificationPrompt(extractedText) {
  return `You are a hardware identification expert. Analyze this image carefully.

${extractedText ? `Text detected in image:\n"${extractedText}"\n` : 'No text detected.\n'}

Your task: Identify the SINGLE most specific product shown.

PHONE IDENTIFICATION RULES:
- USB-C port = iPhone 15 or newer | Lightning port (small oval) = iPhone 14 or older
- Pill-shaped Dynamic Island = iPhone 14 Pro, 15, 15 Pro, 16, 16 Pro
- Wide black notch bar = iPhone 12, 13, 14 base or Plus
- 3 cameras in square bump = Pro model | 2 cameras = base/Plus | 1 camera = SE
- iPhone 16 Pro: cameras in VERTICAL column | iPhone 15 Pro: cameras in TRIANGLE layout
- Camera Control button on right side = iPhone 16 only
- Titanium frame = iPhone 15 Pro or newer Pro | Polished stainless = iPhone 12/13/14 Pro

SAMSUNG: Look for SM-XXXX model sticker on the back
GPU: Read exact model on shroud label. Green/black = NVIDIA | Red/black = AMD
CPU: Read text on chip lid (e.g. i9-14900K, Ryzen 7 7800X3D)

SUPPORTED: Smartphone, Laptop, GPU, CPU, RAM, SSD, Motherboard, PSU
UNSUPPORTED: Monitor, Keyboard, Mouse, Tablet, Printer, Headset, Router, Webcam, Smartwatch

Reply ONLY in this exact format:
HARDWARE_TYPE: [PHONE / PC_PART / LAPTOP / UNSUPPORTED / UNKNOWN]
BRAND: [brand name]
MODEL: [ONE single model name]
DEVICE_TYPE: [Smartphone / GPU / CPU / PSU / Motherboard / SSD / RAM / Laptop / Unsupported]
CONFIDENCE: [HIGH / MEDIUM / LOW]
CONFIDENCE_REASON: [specific visual clue]
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

    // ── PASS 1: OCR ────────────────────────────────────────────────────────────
    console.log('Pass 1: OCR...');
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

    // ── Model number exact match ───────────────────────────────────────────────
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
        const specsData = await groqChatWithFallback({
          max_tokens: 1500,
          temperature: 0.2,
          messages: [
            { role: 'system', content: SYSTEM_PROMPT },
            { role: 'user', content: `Device confirmed via model number: ${mappedModel}.\n\nProvide full specs, Philippine Peso price (2025), where to buy in Philippines, and brief verdict. Plain text, no markdown.` },
          ],
        });
        fullSpecs = specsData.choices?.[0]?.message?.content || 'Could not fetch specs.';
      }

      return res.json({
        isUnsupported: false, category, brand, model,
        displayName: mappedModel, deviceType: isPhone ? 'smartphone' : 'pc_part',
        confidence: 'HIGH', alternative1: '', alternative2: '',
        notes: dbEntry ? 'Identified via model number (Spec DB)' : 'Identified via model number',
        fullSpecs, rawOutput: `MODEL_NUMBER_MATCH: ${mappedModel}`,
        extractedText: extractedText.slice(0, 300),
      });
    }

    // ── PASS 2: Visual identification ─────────────────────────────────────────
    console.log('Pass 2: Visual identification...');
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

    // ── Verification pass ─────────────────────────────────────────────────────
    if (conf === 'LOW' || conf === 'MEDIUM' || conf === '' || (!brand && !model)) {
      console.log(`Confidence ${conf || 'unknown'} — running verification pass...`);
      try {
        const verifyRes = await fetch('https://api.groq.com/openai/v1/chat/completions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${process.env.GROQ_API_KEY}` },
          body: JSON.stringify({
            model: VISION_MODEL,
            max_tokens: 300,
            temperature: 0.0,
            messages: [{
              role: 'user', content: [{
                type: 'text', text: `Identify the SINGLE most specific product in this image.
${extractedText ? `Text detected: "${extractedText}"` : ''}

Reply ONLY in this format:
HARDWARE_TYPE: [PHONE / PC_PART / LAPTOP / UNSUPPORTED]
BRAND: [brand]
MODEL: [ONE specific model]
DEVICE_TYPE: [Smartphone / GPU / CPU / PSU / Motherboard / SSD / RAM / Laptop / Unsupported]
CONFIDENCE: [HIGH / MEDIUM / LOW]
CONFIDENCE_REASON: [visual clue]
ALTERNATIVE_1: [second most likely]
ALTERNATIVE_2: [third most likely]`
              }, imagePayload]
            }],
          }),
        });
        if (verifyRes.ok) {
          const vd = await verifyRes.json();
          const vr = vd.choices[0].message.content.trim();
          const vb = extractField(vr, 'BRAND');
          const vm = extractField(vr, 'MODEL');
          const vc = extractField(vr, 'CONFIDENCE').toUpperCase();
          const vh = extractField(vr, 'HARDWARE_TYPE').toUpperCase();
          const vdt = extractField(vr, 'DEVICE_TYPE').toLowerCase();
          const va1 = extractField(vr, 'ALTERNATIVE_1');
          const va2 = extractField(vr, 'ALTERNATIVE_2');
          if (vc === 'HIGH' || (vc === 'MEDIUM' && conf === 'LOW') || (!brand && vb)) {
            if (vb) brand = vb;
            if (vm) model = vm;
            if (vc) conf = vc;
            if (vh) hwType = vh;
            if (vdt) devType = vdt;
            if (va1) alt1 = va1;
            if (va2) alt2 = va2;
          }
        }
      } catch (e) { console.warn('Verify pass failed:', e.message); }
    }

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

    const dbEntry = lookupSpecDB(displayName);
    let fullSpecs;

    if (dbEntry) {
      console.log('Spec DB hit (visual):', displayName);
      fullSpecs = formatSpecEntry(dbEntry.key, dbEntry.value);
      if (userQuery) {
        const contextData = await groqChatWithFallback({
          max_tokens: 1500,
          temperature: 0.2,
          messages: [
            { role: 'system', content: SYSTEM_PROMPT },
            { role: 'user', content: `The device is ${displayName}. Confirmed specs:\n${fullSpecs}\n\nUser question: ${userQuery}\n\nAnswer based on these confirmed specs.` },
          ],
        });
        fullSpecs = contextData.choices?.[0]?.message?.content || fullSpecs;
      }
    } else {
      const specsQuery = userQuery
        ? `${userQuery} — The device is a ${displayName} (${devType}).`
        : `Device: ${displayName} (${devType}).\n\nProvide full technical specs, Philippine Peso price (2025), where to buy in Philippines, and brief verdict. Plain text, no markdown.`;

      const specsData = await groqChatWithFallback({
        max_tokens: 1500,
        temperature: 0.2,
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          { role: 'user', content: specsQuery },
        ],
      });
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
    if (
      error.message?.toLowerCase().includes('rate limit') ||
      error.message?.toLowerCase().includes('tokens per day') ||
      error.message?.toLowerCase().includes('tpd') ||
      error.message?.toLowerCase().includes('all ai models')
    ) {
      return res.status(429).json({
        error: 'AI is temporarily rate limited. Please wait a few minutes and try again.',
        details: error.message,
      });
    }
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
              content: SYSTEM_PROMPT + `\n\nCONFIRMED SPEC DATABASE ENTRY:\n${dbContext}\n\nUse these confirmed specs. Do not contradict them.`,
            },
            ...messages.map(m => ({
              role: m.role,
              content: typeof m.content === 'string' ? m.content : JSON.stringify(m.content),
            })),
          ];

          if (stream) return handleStreamResponse(res, req, enhancedMessages);

          const data = await groqChatWithFallback({
            messages: enhancedMessages,
            temperature: 0.3,
            max_tokens: 2048,
          });
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

    const data = await groqChatWithFallback({
      messages: groqMessages,
      temperature: 0.3,
      max_tokens: 2048,
    });

    res.json({ content: data.choices[0].message.content });

  } catch (error) {
    console.error('AI chat error:', error.message);
    if (
      error.message?.toLowerCase().includes('rate limit') ||
      error.message?.toLowerCase().includes('all ai models') ||
      error.message?.toLowerCase().includes('429')
    ) {
      return res.status(429).json({
        error: '⚠️ AI is temporarily rate limited. Please wait a few minutes and try again.',
      });
    }
    res.status(500).json({
      error: 'Failed to get AI response',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
});

// ─── Streaming helper ─────────────────────────────────────────────────────────
async function handleStreamResponse(res, req, groqMessages) {
  const groqResponse = await groqStreamWithFallback({
    messages: groqMessages,
    temperature: 0.3,
    max_tokens: 2048,
  });

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

// ─── In-memory confirmation cache ────────────────────────────────────────────
const confirmationCache = new Map();

router.post('/confirm-device', optionalAuth, async (req, res) => {
  try {
    const { confirmedName, extractedText, category } = req.body;
    if (!confirmedName) return res.status(400).json({ error: 'confirmedName is required' });
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

// ─── GET /api/ai/spec-db ──────────────────────────────────────────────────────
router.get('/spec-db', (req, res) => {
  const devices = Object.keys(SPEC_DB).map(name => ({
    name,
    price_php: SPEC_DB[name].price_php || 'unconfirmed',
    verdict: SPEC_DB[name].verdict || '',
  }));
  res.json({ devices, count: devices.length });
});

// ─── GET /api/ai/product-image ────────────────────────────────────────────────
router.get('/product-image', async (req, res) => {
  try {
    const { q } = req.query;
    if (!q) return res.status(400).json({ error: 'Query required' });

    // ── Step 1: Static map — instant, zero network calls ─────────────────────
    // Exact match
    if (STATIC_IMAGE_MAP[q]) {
      return res.json({ url: STATIC_IMAGE_MAP[q], source: 'static' });
    }
    // Fuzzy match (case-insensitive partial)
    const qLower = q.toLowerCase();
    for (const [key, url] of Object.entries(STATIC_IMAGE_MAP)) {
      if (key.toLowerCase().includes(qLower) || qLower.includes(key.toLowerCase())) {
        return res.json({ url, source: 'static-fuzzy' });
      }
    }

    // ── Step 2: Bing image search ─────────────────────────────────────────────
    try {
      const encoded = encodeURIComponent(`${q} official product`);
      const bingRes = await fetch(
        `https://www.bing.com/images/search?q=${encoded}&form=HDRSC2&first=1`,
        {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Accept': 'text/html,application/xhtml+xml',
            'Accept-Language': 'en-US,en;q=0.9',
          },
        }
      );
      if (bingRes.ok) {
        const html = await bingRes.text();
        const murlMatches = html.match(/murl&quot;:&quot;(https?[^&]+?)&quot;/g) || [];
        const urls = murlMatches
          .map(m => decodeURIComponent(m.replace('murl&quot;:&quot;', '').replace('&quot;', '')))
          .filter(u =>
            !u.toLowerCase().includes('icon') &&
            !u.toLowerCase().includes('logo') &&
            !u.toLowerCase().includes('avatar') &&
            (u.includes('.jpg') || u.includes('.jpeg') || u.includes('.png') || u.includes('.webp'))
          );
        if (urls.length > 0) {
          console.log(`[product-image] Bing hit for "${q}": ${urls[0].slice(0, 80)}`);
          return res.json({ url: urls[0], source: 'bing' });
        }
      }
    } catch (e) {
      console.warn('[product-image] Bing failed:', e.message);
    }

    // ── Step 3: GSMArena for phones ───────────────────────────────────────────
    const isPhone = /iphone|samsung|galaxy|xiaomi|redmi|poco|pixel|oneplus|oppo|vivo|realme|nothing|huawei/i.test(q);
    if (isPhone) {
      try {
        const encoded = encodeURIComponent(q);
        const gsmRes = await fetch(
          `https://www.gsmarena.com/search.php3?sQuickSearch=${encoded}`,
          { headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' } }
        );
        if (gsmRes.ok) {
          const html = await gsmRes.text();
          const imgMatch = html.match(/src="(https:\/\/fdn2\.gsmarena\.com\/vv\/bigpic\/[^"]+)"/);
          if (imgMatch) {
            console.log(`[product-image] GSMArena hit for "${q}"`);
            return res.json({ url: imgMatch[1], source: 'gsmarena' });
          }
        }
      } catch (e) {
        console.warn('[product-image] GSMArena failed:', e.message);
      }
    }

    // ── Step 4: DuckDuckGo fallback ───────────────────────────────────────────
    try {
      const encoded = encodeURIComponent(q);
      const ddgRes = await fetch(
        `https://duckduckgo.com/?q=${encoded}+product+official&iax=images&ia=images`,
        { headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' } }
      );
      if (ddgRes.ok) {
        const html = await ddgRes.text();
        const vqdMatch = html.match(/vqd=['"]([^'"]+)['"]/);
        if (vqdMatch) {
          const imgRes = await fetch(
            `https://duckduckgo.com/i.js?q=${encoded}&vqd=${vqdMatch[1]}&p=1`,
            { headers: { 'User-Agent': 'Mozilla/5.0', 'Referer': 'https://duckduckgo.com/' } }
          );
          if (imgRes.ok) {
            const imgData = await imgRes.json();
            const filtered = (imgData?.results || []).filter(r =>
              r.width >= 200 && r.height >= 200 &&
              !r.image?.toLowerCase().includes('icon') &&
              !r.image?.toLowerCase().includes('avatar')
            );
            if (filtered[0]) {
              console.log(`[product-image] DDG hit for "${q}"`);
              return res.json({ url: filtered[0].image, thumb: filtered[0].thumbnail, source: 'ddg' });
            }
          }
        }
      }
    } catch (e) {
      console.warn('[product-image] DDG failed:', e.message);
    }

    // ── No image found ────────────────────────────────────────────────────────
    console.log(`[product-image] No image found for "${q}"`);
    return res.json({ url: null });

  } catch (error) {
    console.error('Product image error:', error.message);
    res.json({ url: null });
  }
});

export default router;