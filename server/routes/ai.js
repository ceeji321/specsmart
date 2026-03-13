import express from 'express';
import fetch from 'node-fetch';
import { optionalAuth } from '../middleware/auth.js';

const router = express.Router();

const SYSTEM_PROMPT = `You are SpecSmart AI, a highly specialized tech advisor focused exclusively on:
- PC components: CPUs, GPUs, RAM, Storage (SSDs/HDDs), Motherboards, PSUs, Cooling
- Smartphones and mobile devices
- Laptops

You ONLY answer questions about these tech categories. For anything outside this scope, politely redirect.

When answering:
1. Be concise but detailed — use bullet points for specs
2. Give real model recommendations with approximate Philippine Peso prices when relevant
3. Explain technical jargon in simple terms
4. When comparing devices, highlight key differences clearly
5. Always consider the user's budget and use case
6. If you are unsure of a spec or price, say "unconfirmed" rather than guessing`;

const KNOWN_PHONE_BRANDS = [
  'samsung', 'apple', 'iphone', 'xiaomi', 'redmi', 'poco',
  'oppo', 'vivo', 'realme', 'oneplus', 'huawei', 'honor',
  'nokia', 'motorola', 'sony', 'infinix', 'tecno', 'itel',
  'nothing', 'google pixel', 'pixel', 'asus rog phone'
];

const REJECTED = ['monitor','keyboard','mouse','tablet',
  'printer','headset','router','webcam','external','smartwatch','pc case','cooler','fan'];

// ─── Model number lookup ──────────────────────────────────────────────────────
const MODEL_NUMBER_MAP = {
  // Apple iPhone 16 series
  'A3293': 'Apple iPhone 16 Pro Max', 'A3295': 'Apple iPhone 16 Pro Max',
  'A3291': 'Apple iPhone 16 Pro',     'A3292': 'Apple iPhone 16 Pro',
  'A3287': 'Apple iPhone 16 Plus',    'A3288': 'Apple iPhone 16 Plus',
  'A3283': 'Apple iPhone 16',         'A3284': 'Apple iPhone 16',
  // Apple iPhone 15 series
  'A2894': 'Apple iPhone 15 Pro Max', 'A3105': 'Apple iPhone 15 Pro Max',
  'A2848': 'Apple iPhone 15 Pro',     'A3101': 'Apple iPhone 15 Pro',
  'A3093': 'Apple iPhone 15 Plus',    'A3090': 'Apple iPhone 15 Plus',
  'A3092': 'Apple iPhone 15',         'A3089': 'Apple iPhone 15',
  // Apple iPhone 14 series
  'A2651': 'Apple iPhone 14 Pro Max', 'A2893': 'Apple iPhone 14 Pro Max',
  'A2650': 'Apple iPhone 14 Pro',     'A2889': 'Apple iPhone 14 Pro',
  'A2632': 'Apple iPhone 14 Plus',    'A2886': 'Apple iPhone 14 Plus',
  'A2649': 'Apple iPhone 14',         'A2881': 'Apple iPhone 14',
  // Apple iPhone 13 series
  'A2484': 'Apple iPhone 13 Pro Max', 'A2641': 'Apple iPhone 13 Pro Max',
  'A2483': 'Apple iPhone 13 Pro',     'A2640': 'Apple iPhone 13 Pro',
  'A2482': 'Apple iPhone 13',         'A2634': 'Apple iPhone 13',
  'A2481': 'Apple iPhone 13 Mini',    'A2628': 'Apple iPhone 13 Mini',
  // Apple iPhone 12 series
  'A2342': 'Apple iPhone 12 Pro Max', 'A2411': 'Apple iPhone 12 Pro Max',
  'A2341': 'Apple iPhone 12 Pro',     'A2408': 'Apple iPhone 12 Pro',
  'A2172': 'Apple iPhone 12',         'A2402': 'Apple iPhone 12',
  'A2176': 'Apple iPhone 12 Mini',    'A2399': 'Apple iPhone 12 Mini',
  // Apple iPhone SE
  'A2595': 'Apple iPhone SE (2022)',   'A2783': 'Apple iPhone SE (2022)',
  'A2296': 'Apple iPhone SE (2020)',   'A2275': 'Apple iPhone SE (2020)',
  // Samsung Galaxy S24 series
  'SM-S928B': 'Samsung Galaxy S24 Ultra', 'SM-S928U': 'Samsung Galaxy S24 Ultra',
  'SM-S926B': 'Samsung Galaxy S24+',      'SM-S926U': 'Samsung Galaxy S24+',
  'SM-S921B': 'Samsung Galaxy S24',       'SM-S921U': 'Samsung Galaxy S24',
  // Samsung Galaxy S23 series
  'SM-S918B': 'Samsung Galaxy S23 Ultra', 'SM-S918U': 'Samsung Galaxy S23 Ultra',
  'SM-S916B': 'Samsung Galaxy S23+',      'SM-S916U': 'Samsung Galaxy S23+',
  'SM-S911B': 'Samsung Galaxy S23',       'SM-S911U': 'Samsung Galaxy S23',
  'SM-S711B': 'Samsung Galaxy S23 FE',
  // Samsung Galaxy S22 series
  'SM-S908B': 'Samsung Galaxy S22 Ultra', 'SM-S906B': 'Samsung Galaxy S22+',
  'SM-S901B': 'Samsung Galaxy S22',
  // Samsung Galaxy Z series
  'SM-F946B': 'Samsung Galaxy Z Fold 5',  'SM-F731B': 'Samsung Galaxy Z Flip 5',
  'SM-F936B': 'Samsung Galaxy Z Fold 4',  'SM-F721B': 'Samsung Galaxy Z Flip 4',
  // Samsung Galaxy A series
  'SM-A556B': 'Samsung Galaxy A55',  'SM-A546B': 'Samsung Galaxy A54',
  'SM-A356B': 'Samsung Galaxy A35',  'SM-A256B': 'Samsung Galaxy A25',
  'SM-A156B': 'Samsung Galaxy A15',  'SM-A055F': 'Samsung Galaxy A05',
  // Xiaomi
  '23116PN5BC': 'Xiaomi 14 Ultra',  '23116PN5BG': 'Xiaomi 14 Pro',
  '23049PCD8G': 'Xiaomi 14',        '2312DRAABL': 'Xiaomi 13 Ultra',
  '2211133G':   'Xiaomi 12T Pro',   '22071212AG': 'Xiaomi 12 Pro',
  // Redmi / POCO
  '23117RA68G': 'Xiaomi Redmi Note 13 Pro+',
  '2312DRA50G': 'Xiaomi Redmi Note 13 Pro',
  '23078RKD5G': 'Xiaomi Redmi Note 13',
  '23049RAD8G': 'POCO F6 Pro',
  '23058RA61G': 'POCO F6',
  '23058PY04G': 'POCO X6 Pro',
  // OPPO
  'CPH2557': 'OPPO Reno 11 Pro',    'CPH2525': 'OPPO Reno 10 Pro+',
  'CPH2505': 'OPPO Reno 10 Pro',    'CPH2473': 'OPPO Reno 8 Pro',
  'CPH2609': 'OPPO Reno 12 Pro',    'CPH2581': 'OPPO Find X7 Ultra',
  // Realme
  'RMX3780': 'Realme GT 5 Pro',     'RMX3686': 'Realme 12 Pro+',
  'RMX3771': 'Realme 12 Pro',
  // Infinix
  'X6833B': 'Infinix Note 30 Pro',  'X6833': 'Infinix Note 30',
  'X6731':  'Infinix Note 30 VIP',  'X6726': 'Infinix Note 30',
  'X6816':  'Infinix Zero 30 5G',   'X6731B': 'Infinix Zero 30',
  'X6515':  'Infinix Hot 40 Pro',   'X6525': 'Infinix GT 10 Pro',
  'X6739':  'Infinix GT 20 Pro',    'X6851': 'Infinix Note 40 Pro',
  // Google Pixel
  'GC3VE': 'Google Pixel 9 Pro XL', 'GP4BC': 'Google Pixel 9 Pro',
  'GKV4X': 'Google Pixel 9',        'GKWS6': 'Google Pixel 8 Pro',
  'GQML3': 'Google Pixel 8',
  // OnePlus
  'PJD110': 'OnePlus 12',           'CPH2573': 'OnePlus 12',
  'PHB110': 'OnePlus 11',
};

// Short prefix lookup (e.g. SM-S928 without full suffix)
const MODEL_PREFIX_MAP = {
  'SM-S928': 'Samsung Galaxy S24 Ultra',
  'SM-S926': 'Samsung Galaxy S24+',
  'SM-S921': 'Samsung Galaxy S24',
  'SM-S918': 'Samsung Galaxy S23 Ultra',
  'SM-S916': 'Samsung Galaxy S23+',
  'SM-S911': 'Samsung Galaxy S23',
  'SM-S908': 'Samsung Galaxy S22 Ultra',
  'SM-S906': 'Samsung Galaxy S22+',
  'SM-S901': 'Samsung Galaxy S22',
  'SM-F946': 'Samsung Galaxy Z Fold 5',
  'SM-F731': 'Samsung Galaxy Z Flip 5',
  'SM-A556': 'Samsung Galaxy A55',
  'SM-A546': 'Samsung Galaxy A54',
  'SM-A356': 'Samsung Galaxy A35',
  'SM-A156': 'Samsung Galaxy A15',
};

function lookupModelFromText(text) {
  if (!text) return null;
  const upper = text.toUpperCase().replace(/\s+/g, '');

  // Exact match first
  for (const [code, name] of Object.entries(MODEL_NUMBER_MAP)) {
    if (upper.includes(code.toUpperCase().replace(/\s+/g, ''))) return name;
  }

  // Prefix match for Samsung SM- codes
  for (const [prefix, name] of Object.entries(MODEL_PREFIX_MAP)) {
    if (upper.includes(prefix.toUpperCase())) return name;
  }

  // iPhone model number pattern: A + 4 digits
  const appleMatch = text.match(/\bA(\d{4})\b/i);
  if (appleMatch) {
    const code = `A${appleMatch[1]}`;
    if (MODEL_NUMBER_MAP[code]) return MODEL_NUMBER_MAP[code];
  }

  return null;
}

// ─── Pass 1: OCR prompt ───────────────────────────────────────────────────────
const OCR_PROMPT = `List EVERY piece of text visible in this image: brand names, model numbers, serial numbers, sticker codes, text on screen, engravings, PCB labels. Output raw text only, nothing else.`;

// ─── Pass 2: Identification prompt ───────────────────────────────────────────
function buildIdentificationPrompt(extractedText) {
  return `Identify the exact device in this image. Be precise.

EXTRACTED TEXT FROM IMAGE:
"""
${extractedText || 'none'}
"""

RULES:
- If extracted text has a clear brand + model number, use it directly. That is your answer.
- For iPhones without text clues, use these EXACT visual rules:
  * USB-C port + Dynamic Island + triple large camera = iPhone 15 Pro OR iPhone 16 Pro (check titanium frame for 15 Pro, titanium + vertical camera for 16 Pro)
  * USB-C port + pill notch + dual camera = iPhone 15 or iPhone 16
  * Lightning port + Dynamic Island + triple camera = iPhone 14 Pro ONLY
  * Lightning port + wide notch + triple camera = iPhone 13 Pro or 12 Pro
  * Lightning port + punch hole = iPhone does NOT have punch hole — ignore
- For Samsung: look for SM-XXXX model code on back sticker
- For GPU: read the model name printed on the shroud (RTX 4090, RX 7900 XTX, etc.)
- For CPU: read the text printed on the chip lid
- For RAM: read the sticker label (brand + DDR type + speed)
- For SSD: read the label (brand + capacity + NVMe/SATA)
- For Motherboard: read the model name printed on the PCB
- For PSU: read the wattage and brand on the label

SUPPORTED CATEGORIES: Smartphone, Laptop, GPU, CPU, RAM, SSD, Motherboard, PSU
UNSUPPORTED: Monitor, Keyboard, Mouse, Tablet, Printer, Headset, Router, Webcam, Smartwatch, PC Case, Fan

Reply ONLY in this exact format:
HARDWARE_TYPE: [PHONE / PC_PART / LAPTOP / UNSUPPORTED / UNKNOWN]
BRAND: [brand name]
MODEL: [exact model name]
DEVICE_TYPE: [Smartphone / GPU / CPU / PSU / Motherboard / SSD / RAM / Laptop / Unsupported]
CONFIDENCE: [HIGH / MEDIUM / LOW]
CONFIDENCE_REASON: [the exact clue you used — e.g. "USB-C + Dynamic Island + triple cam"]
ALTERNATIVE_1: [next most likely model]
ALTERNATIVE_2: [another possibility]
NOTES: [anything else relevant]`;
}

// ─── POST /api/ai/analyze-image ───────────────────────────────────────────────
router.post('/analyze-image', optionalAuth, async (req, res) => {
  try {
    const { base64Image, mimeType = 'image/jpeg', userQuery = '' } = req.body;
    if (!base64Image) return res.status(400).json({ error: 'base64Image is required' });
    if (!process.env.GROQ_API_KEY) return res.status(500).json({ error: 'Groq API key not configured.' });

    const imagePayload = { type: 'image_url', image_url: { url: `data:${mimeType};base64,${base64Image}` } };
    const VISION_MODEL = 'meta-llama/llama-4-scout-17b-16e-instruct';

    // ── PASS 1: OCR ───────────────────────────────────────────────────────────
    console.log('Pass 1: OCR...');
    let extractedText = '';
    try {
      const textRes = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${process.env.GROQ_API_KEY}` },
        body: JSON.stringify({
          model: VISION_MODEL,
          max_tokens: 300,
          temperature: 0.0,
          messages: [{ role: 'user', content: [{ type: 'text', text: OCR_PROMPT }, imagePayload] }]
        }),
      });
      if (textRes.ok) {
        const td = await textRes.json();
        extractedText = td.choices?.[0]?.message?.content?.trim() || '';
        console.log('OCR result:', extractedText.slice(0, 200));
      }
    } catch (e) { console.warn('OCR failed:', e.message); }

    // ── Model number exact match (highest accuracy) ───────────────────────────
    const mappedModel = lookupModelFromText(extractedText);
    if (mappedModel) {
      console.log('Model number matched:', mappedModel);
      const parts     = mappedModel.split(' ');
      const brand     = parts[0] === 'Apple' || parts[0] === 'Samsung' || parts[0] === 'Xiaomi'
        ? parts[0] : parts[0];
      const model     = parts.slice(1).join(' ');
      const isPhone   = KNOWN_PHONE_BRANDS.some(b => mappedModel.toLowerCase().includes(b));
      const category  = isPhone ? 'SMARTPHONE'
        : mappedModel.match(/RTX|GTX|Radeon|Arc A/i) ? 'GPU'
        : mappedModel.match(/Ryzen|Core i[0-9]|Xeon/i) ? 'CPU'
        : 'SMARTPHONE'; // default fallback for unknown mapped

      const specsRes  = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${process.env.GROQ_API_KEY}` },
        body: JSON.stringify({
          model: 'llama-3.3-70b-versatile', max_tokens: 1500, temperature: 0.2,
          messages: [
            { role: 'system', content: SYSTEM_PROMPT },
            { role: 'user', content: `Device confirmed via model number: ${mappedModel}.\n\nProvide:\n1. Full technical specifications\n2. Philippine peso price (state year)\n3. Where to buy in Philippines\n4. Brief verdict\n\nIf unsure say "unconfirmed". Plain text, no markdown.` }
          ]
        }),
      });
      const specsData = await specsRes.json();
      return res.json({
        isUnsupported: false, category, brand, model,
        displayName: mappedModel, deviceType: isPhone ? 'smartphone' : 'pc_part',
        confidence: 'HIGH', alternative1: '', alternative2: '',
        notes: 'Identified via model number',
        fullSpecs: specsData.choices?.[0]?.message?.content || 'Could not fetch specs.',
        rawOutput: `MODEL_NUMBER_MATCH: ${mappedModel}`,
        extractedText: extractedText.slice(0, 300),
      });
    }

    // ── PASS 2: Visual identification ─────────────────────────────────────────
    console.log('Pass 2: Visual ID...');
    const identificationPrompt = buildIdentificationPrompt(extractedText);

    const groqVision = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${process.env.GROQ_API_KEY}` },
      body: JSON.stringify({
        model: VISION_MODEL,
        max_tokens: 400,
        temperature: 0.1,
        messages: [{ role: 'user', content: [{ type: 'text', text: identificationPrompt }, imagePayload] }]
      }),
    });

    if (!groqVision.ok) {
      const err = await groqVision.json();
      throw new Error(err.error?.message || `Groq Vision failed: ${groqVision.status}`);
    }

    const visionData = await groqVision.json();
    const rawOutput  = visionData.choices[0].message.content.trim();
    console.log('Vision raw:', rawOutput.slice(0, 300));

    const extractField = (text, field) => {
      const line = text.split('\n').find(l => l.toUpperCase().startsWith(`${field.toUpperCase()}:`));
      const val  = line?.split(':').slice(1).join(':').trim() || '';
      return (val === 'null' || val === 'N/A' || val === 'none') ? '' : val;
    };

    let hwType  = extractField(rawOutput, 'HARDWARE_TYPE').toUpperCase();
    let devType = extractField(rawOutput, 'DEVICE_TYPE').toLowerCase();
    let brand   = extractField(rawOutput, 'BRAND');
    let model   = extractField(rawOutput, 'MODEL');
    let conf    = extractField(rawOutput, 'CONFIDENCE').toUpperCase();
    const confReason = extractField(rawOutput, 'CONFIDENCE_REASON');
    let alt1    = extractField(rawOutput, 'ALTERNATIVE_1');
    let alt2    = extractField(rawOutput, 'ALTERNATIVE_2');
    const notes = extractField(rawOutput, 'NOTES');

    // ── PASS 3: Retry on LOW confidence or missing result ─────────────────────
    if (conf === 'LOW' || conf === '' || (!brand && !model)) {
      console.log('Low confidence — retry with focused prompt...');
      try {
        const retryPrompt = `Look at this image carefully. What specific product is this?
${extractedText ? `Text visible in image: "${extractedText}"` : 'No text detected.'}
Focus on any brand logos, model names, or physical characteristics.
Reply ONLY:
HARDWARE_TYPE: [PHONE/PC_PART/LAPTOP/UNSUPPORTED]
BRAND: [brand]
MODEL: [model]
DEVICE_TYPE: [Smartphone/GPU/CPU/RAM/SSD/Motherboard/PSU/Laptop/Unsupported]
CONFIDENCE: [HIGH/MEDIUM/LOW]
CONFIDENCE_REASON: [clue used]`;

        const retryRes = await fetch('https://api.groq.com/openai/v1/chat/completions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${process.env.GROQ_API_KEY}` },
          body: JSON.stringify({
            model: VISION_MODEL,
            max_tokens: 200,
            temperature: 0.0,
            messages: [{ role: 'user', content: [{ type: 'text', text: retryPrompt }, imagePayload] }]
          }),
        });
        if (retryRes.ok) {
          const rd  = await retryRes.json();
          const rr  = rd.choices[0].message.content.trim();
          const rb  = extractField(rr, 'BRAND');
          const rm  = extractField(rr, 'MODEL');
          const rc  = extractField(rr, 'CONFIDENCE').toUpperCase();
          const rh  = extractField(rr, 'HARDWARE_TYPE').toUpperCase();
          const rdt = extractField(rr, 'DEVICE_TYPE').toLowerCase();
          console.log('Retry result:', rc, rb, rm);
          if (rb) brand = rb;
          if (rm) model = rm;
          if (rc) conf  = rc;
          if (rh) hwType  = rh;
          if (rdt) devType = rdt;
        }
      } catch (e) { console.warn('Retry failed:', e.message); }
    }

    // ── Brand/category overrides ──────────────────────────────────────────────
    const brandLower   = (brand || '').toLowerCase();
    const modelLower   = (model || '').toLowerCase();
    const combined     = `${brandLower} ${modelLower}`;
    const brandIsPhone = KNOWN_PHONE_BRANDS.some(b => combined.includes(b));

    if (brandIsPhone) { hwType = 'PHONE'; devType = 'smartphone'; }

    // GPU model name in model field → force GPU category
    if (/rtx|gtx|radeon rx|arc a\d/i.test(combined)) { hwType = 'PC_PART'; devType = 'gpu'; }
    if (/ryzen|core i[0-9]|xeon/i.test(combined))     { hwType = 'PC_PART'; devType = 'cpu'; }
    if (/ddr[45]/i.test(combined) && !/ssd|nvme/i.test(combined)) { hwType = 'PC_PART'; devType = 'ram'; }

    // ── Category mapping ──────────────────────────────────────────────────────
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

    const displayName = [brand, model].filter(Boolean).join(' ') || 'Unknown Device';

    // ── PASS 4: Fetch specs ───────────────────────────────────────────────────
    const specsQuery = userQuery
      ? `${userQuery} — The device is a ${displayName} (${devType}).`
      : `Device: ${displayName} (${devType}).

Provide:
1. Full technical specifications
2. Philippine peso price (state the year, e.g. "as of 2024")
3. Where to buy in the Philippines (Lazada, Shopee, official stores)
4. Brief verdict (2-3 sentences)

If unsure of a spec or price, say "unconfirmed". Plain text, no markdown.`;

    const specsRes  = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${process.env.GROQ_API_KEY}` },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile', max_tokens: 1500, temperature: 0.2,
        messages: [{ role: 'system', content: SYSTEM_PROMPT }, { role: 'user', content: specsQuery }]
      }),
    });

    const specsData = await specsRes.json();
    const fullSpecs = specsData.choices?.[0]?.message?.content || 'Could not fetch full specs.';
    console.log('Done:', displayName, '|', conf, '|', confReason);

    res.json({
      isUnsupported: false, category, brand, model, displayName,
      deviceType: devType, confidence: conf,
      alternative1: alt1, alternative2: alt2,
      notes: notes + (confReason ? ` | Clue: ${confReason}` : ''),
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

    const systemText   = systemPrompt || SYSTEM_PROMPT;
    const groqMessages = [
      { role: 'system', content: systemText },
      ...messages.map(msg => ({
        role: msg.role,
        content: typeof msg.content === 'string' ? msg.content : JSON.stringify(msg.content),
      })),
    ];

    if (stream) {
      const groqResponse = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${process.env.GROQ_API_KEY}` },
        body: JSON.stringify({ model: 'llama-3.3-70b-versatile', messages: groqMessages, temperature: 0.3, max_tokens: 2048, stream: true }),
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
              const json  = JSON.parse(trimmed.slice(6));
              const token = json.choices?.[0]?.delta?.content;
              if (token) res.write(`data: ${JSON.stringify({ token })}\n\n`);
            } catch (e) {}
          }
        }
      });
      body.on('end',   () => { res.write('data: [DONE]\n\n'); res.end(); });
      body.on('error', () => { res.write(`data: ${JSON.stringify({ error: 'Stream error' })}\n\n`); res.end(); });
      req.on('close',  () => res.end());
      return;
    }

    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${process.env.GROQ_API_KEY}` },
      body: JSON.stringify({ model: 'llama-3.3-70b-versatile', messages: groqMessages, temperature: 0.3, max_tokens: 2048 }),
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

export default router;