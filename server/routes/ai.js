import express from 'express';
import fetch from 'node-fetch';
import { optionalAuth } from '../middleware/auth.js';

const router = express.Router();

const SYSTEM_PROMPT = `You are SpecSmart AI, a highly specialized tech advisor focused exclusively on:
- PC components: CPUs, GPUs, RAM, Storage (SSDs/HDDs), Motherboards, PSUs, Cooling
- Smartphones and mobile devices
- Gaming peripherals: keyboards, mice
- PC accessories directly related to builds

You ONLY answer questions about these tech categories. For anything outside this scope, politely redirect.

When answering:
1. Be concise but detailed — use bullet points for specs
2. Give real model recommendations with approximate Philippine Peso prices when relevant
3. Explain technical jargon in simple terms
4. When comparing devices, highlight key differences clearly
5. Always consider the user's budget and use case`;

// Known phone brands — mirrors Android CombinedHardwareRecognition fix
const KNOWN_PHONE_BRANDS = [
  'samsung', 'apple', 'iphone', 'xiaomi', 'redmi', 'poco',
  'oppo', 'vivo', 'realme', 'oneplus', 'huawei', 'honor',
  'nokia', 'motorola', 'sony', 'infinix', 'tecno', 'itel',
  'nothing', 'google pixel', 'pixel', 'asus rog phone'
];

// POST /api/ai/analyze-image — Groq Vision replaces TensorFlow.js MobileNet
router.post('/analyze-image', optionalAuth, async (req, res) => {
  try {
    const { base64Image, mimeType = 'image/jpeg', userQuery = '' } = req.body;
    if (!base64Image) return res.status(400).json({ error: 'base64Image is required' });
    if (!process.env.GROQ_API_KEY) return res.status(500).json({ error: 'Groq API key not configured.' });

    console.log('Groq Vision analyzing image...');

    const identificationPrompt = `You are an expert hardware identification AI. Identify the EXACT device model.

SUPPORTED TYPES ONLY — set HARDWARE_TYPE: UNSUPPORTED for anything else:
Smartphone, CPU, GPU, PSU, Motherboard, SSD, RAM

REJECTED — always HARDWARE_TYPE: UNSUPPORTED:
Laptop, Monitor, Keyboard, Mouse, Tablet, Printer, Headset, Router,
Webcam, External HDD, USB Hub, Smartwatch, PC Case, Cooler, Fan

STEP 1 — Read ALL visible text: labels, stickers, engravings, barcodes.
Model numbers like "CPH2557", "SM-A546" — use them directly.

STEP 2 — Physical design clues:

IPHONE: X=vertical dual cam no text | XR=single cam colorful | 11=square bump 2 lenses
11 Pro=3 lenses matte | 12/13=flat edges | 14 Pro/15 Pro=Dynamic Island | 15=USB-C

NOTHING PHONE: (1)=dual-cam left+glyph right | (2)=pill dual-cam centered | (2a)=triple circular

SAMSUNG: SM-#### sticker = exact model

PC PARTS: GPU=RTX/GTX/RX on PCB | CPU=Intel/AMD on IHS | RAM=DDR brand sticker
SSD=M.2/SATA capacity sticker | PSU=wattage+80PLUS | Motherboard=model on PCB

STEP 3 — Output EXACTLY (no extra text, no markdown):

HARDWARE_TYPE: [PHONE / PC_PART / UNSUPPORTED / UNKNOWN]
BRAND: [brand]
MODEL: [exact model]
DEVICE_TYPE: [Smartphone / GPU / CPU / PSU / Motherboard / SSD / RAM / Unsupported]
CONFIDENCE: [HIGH / MEDIUM / LOW]
CONFIDENCE_REASON: [reason]
ALTERNATIVE_1: [next most likely]
ALTERNATIVE_2: [another possibility]
EXTRACTED_TEXT: [all visible text from image]
NOTES: [other observations]`;

    const groqVision = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${process.env.GROQ_API_KEY}` },
      body: JSON.stringify({
        model: 'meta-llama/llama-4-scout-17b-16e-instruct',
        max_tokens: 800,
        messages: [{
          role: 'user',
          content: [
            { type: 'text', text: identificationPrompt },
            { type: 'image_url', image_url: { url: `data:${mimeType};base64,${base64Image}` } }
          ]
        }]
      }),
    });

    if (!groqVision.ok) {
      const err = await groqVision.json();
      throw new Error(err.error?.message || `Groq Vision failed: ${groqVision.status}`);
    }

    const visionData = await groqVision.json();
    const rawOutput  = visionData.choices[0].message.content.trim();
    console.log('Vision raw:', rawOutput.slice(0, 150));

    const extractField = (text, field) => {
      const line = text.split('\n').find(l => l.startsWith(`${field}:`));
      const val  = line?.split(':').slice(1).join(':').trim() || '';
      return (val === 'null' || val === 'N/A') ? '' : val;
    };

    let hwType  = extractField(rawOutput, 'HARDWARE_TYPE').toUpperCase();
    let devType = extractField(rawOutput, 'DEVICE_TYPE').toLowerCase();
    const brand = extractField(rawOutput, 'BRAND');
    const model = extractField(rawOutput, 'MODEL');
    const conf  = extractField(rawOutput, 'CONFIDENCE');
    const alt1  = extractField(rawOutput, 'ALTERNATIVE_1');
    const alt2  = extractField(rawOutput, 'ALTERNATIVE_2');
    const notes = extractField(rawOutput, 'NOTES');

    // Phone brand override — same fix as Android app
    const brandLower   = brand.toLowerCase();
    const modelLower   = model.toLowerCase();
    const brandIsPhone = KNOWN_PHONE_BRANDS.some(b => brandLower.includes(b) || modelLower.includes(b));
    if (brandIsPhone) { hwType = 'PHONE'; devType = 'smartphone'; }

    const REJECTED = ['laptop','notebook','monitor','keyboard','mouse','tablet',
      'printer','headset','router','webcam','external','smartwatch','pc case','cooler','fan'];

    let category = 'UNKNOWN';
    if (hwType === 'PHONE' || devType.includes('smartphone') || devType.includes('phone')) category = 'SMARTPHONE';
    else if (REJECTED.some(r => devType.includes(r))) category = 'UNSUPPORTED';
    else if (devType.includes('gpu') || devType.includes('graphics')) category = 'GPU';
    else if (devType.includes('cpu') || devType.includes('processor')) category = 'CPU';
    else if (devType.includes('psu') || devType.includes('power supply')) category = 'PSU';
    else if (devType.includes('motherboard') || devType.includes('mainboard')) category = 'MOTHERBOARD';
    else if (devType.includes('ssd') || devType.includes('nvme')) category = 'SSD';
    else if (devType.includes('ram') || devType.includes('memory') || devType.includes('dimm')) category = 'RAM';
    else if (hwType === 'UNSUPPORTED') category = 'UNSUPPORTED';

    if (category === 'UNSUPPORTED') {
      return res.json({
        isUnsupported: true,
        message: 'SpecSmart only supports: Smartphones, CPUs, GPUs, PSUs, Motherboards, SSDs, RAM.\n\nKeyboards, mice, monitors, laptops, and other peripherals are not supported.',
        rawOutput,
      });
    }

    const displayName = [brand, model].filter(Boolean).join(' ') || 'Unknown Device';
    const specsQuery  = userQuery
      ? `${userQuery} — The device is a ${displayName} (${devType}).`
      : `I scanned a hardware image and identified: ${displayName} (${devType}).\n\nProvide full specs, Philippine price (PHP), where to buy in the Philippines, and a brief verdict. Plain language, no markdown symbols.`;

    const specsRes  = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${process.env.GROQ_API_KEY}` },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile', max_tokens: 1500,
        messages: [{ role: 'system', content: SYSTEM_PROMPT }, { role: 'user', content: specsQuery }]
      }),
    });

    const specsData = await specsRes.json();
    const fullSpecs = specsData.choices?.[0]?.message?.content || 'Could not fetch full specs.';
    console.log('Full specs fetched for:', displayName);

    res.json({ isUnsupported: false, category, brand, model, displayName, deviceType: devType, confidence: conf, alternative1: alt1, alternative2: alt2, notes, fullSpecs, rawOutput });

  } catch (error) {
    console.error('Image analysis error:', error.message);
    res.status(500).json({ error: 'Failed to analyze image', details: process.env.NODE_ENV === 'development' ? error.message : undefined });
  }
});

// POST /api/ai/chat
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
      ...messages.map(msg => ({ role: msg.role, content: typeof msg.content === 'string' ? msg.content : JSON.stringify(msg.content) })),
    ];

    if (stream) {
      const groqResponse = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${process.env.GROQ_API_KEY}` },
        body: JSON.stringify({ model: 'llama-3.3-70b-versatile', messages: groqMessages, temperature: 0.7, max_tokens: 2048, stream: true }),
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
      let buffer  = '';
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
      body: JSON.stringify({ model: 'llama-3.3-70b-versatile', messages: groqMessages, temperature: 0.7, max_tokens: 2048 }),
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
    res.status(500).json({ error: 'Failed to get AI response', details: process.env.NODE_ENV === 'development' ? error.message : undefined });
  }
});

export default router;