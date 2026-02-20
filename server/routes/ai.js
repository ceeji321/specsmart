// server/routes/ai.js
import express from 'express';
import fetch from 'node-fetch';
import { optionalAuth } from '../middleware/auth.js';

const router = express.Router();

const SYSTEM_PROMPT = `You are SpecSmart AI, a highly specialized tech advisor focused exclusively on:
- PC components: CPUs, GPUs, RAM, Storage (SSDs/HDDs), Motherboards, PSUs, Cooling
- Smartphones and mobile devices
- Gaming peripherals: keyboards, mice
- PC accessories directly related to builds

You ONLY answer questions about these tech categories. For anything outside this scope, politely redirect: "I'm specialized in PC hardware, smartphones, and peripherals. Ask me about those!"

When answering:
1. Be concise but detailed — use bullet points for specs
2. Give real model recommendations with approximate Philippine Peso prices when relevant
3. Explain technical jargon in simple terms
4. When comparing devices, highlight key differences clearly
5. Always consider the user's budget and use case`;

// ─── POST /api/ai/chat ─────────────────────────────────────────────────────────
// Image classification is handled in the browser by TensorFlow.js MobileNet.
// This endpoint receives text messages only (including TF label descriptions for images).
router.post('/chat', optionalAuth, async (req, res) => {
  try {
    const { messages, systemPrompt } = req.body;

    console.log('📨 Received chat request');

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return res.status(400).json({ error: 'Messages array is required' });
    }

    if (!process.env.GROQ_API_KEY) {
      console.error('❌ GROQ_API_KEY not found');
      return res.status(500).json({ error: 'Groq API key is not configured.' });
    }

    const systemText = systemPrompt || SYSTEM_PROMPT;

    const groqMessages = [
      { role: 'system', content: systemText },
      ...messages.map(msg => ({
        role: msg.role,
        content: typeof msg.content === 'string' ? msg.content : JSON.stringify(msg.content)
      }))
    ];

    console.log('💬 Sending to Groq (LLaMA 3.3 70B)...');

    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${process.env.GROQ_API_KEY}`
      },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        messages: groqMessages,
        temperature: 0.7,
        max_tokens: 2048
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('❌ Groq API error:', errorData);
      throw new Error(errorData.error?.message || `Groq API failed: ${response.status}`);
    }

    const data = await response.json();

    if (!data.choices || data.choices.length === 0) {
      throw new Error('No response from Groq');
    }

    const text = data.choices[0].message.content;
    console.log('✅ Groq response received!');
    res.json({ content: text });

  } catch (error) {
    console.error('❌ AI chat error:', error.message);

    if (error.message?.includes('rate_limit') || error.message?.includes('429')) {
      return res.status(429).json({ error: 'Rate limit exceeded. Please wait a moment.' });
    }

    res.status(500).json({
      error: 'Failed to get AI response',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

export default router;