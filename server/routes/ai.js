const SYSTEM_PROMPT = `You are SpecSmart AI, a highly specialized tech advisor focused exclusively on:
- PC components: CPUs, GPUs, RAM, Storage (SSDs/HDDs), Motherboards, PSUs, Cooling
- Smartphones and mobile devices
- Gaming peripherals: keyboards, mice
- PC accessories directly related to builds

You ONLY answer questions about these tech categories. For anything outside this scope (general AI, coding, unrelated topics), politely redirect: "I'm specialized in PC hardware, smartphones, and peripherals. Ask me about those!"

When answering:
1. Be concise but detailed — use bullet points for specs
2. Give real model recommendations with approximate Philippine Peso prices when relevant
3. Explain technical jargon in simple terms
4. When comparing devices, highlight key differences clearly
5. Always consider the user's budget and use case

Common topics you excel at:
- CPU/GPU comparisons and recommendations
- RAM compatibility and speed advice
- Best smartphones under specific budgets
- Keyboard switch types and recommendations
- Mouse specs for gaming vs. productivity
- PC build recommendations
- Troubleshooting hardware issues`;

export async function askAI(messages) {
  try {
    const response = await fetch('/api/ai/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ messages, systemPrompt: SYSTEM_PROMPT }),
    });

    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }

    const data = await response.json();
    return data.content;
  } catch (err) {
    console.error('AI error:', err);
    throw err;
  }
}

export async function analyzeHardwareImage(base64Image, mimeType = 'image/jpeg') {
  try {
    const response = await fetch('/api/ai/analyze-image', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ base64Image, mimeType }),
    });

    if (!response.ok) throw new Error(`API error: ${response.status}`);
    const data = await response.json();
    return data.content;
  } catch (err) {
    console.error('Image analysis error:', err);
    throw err;
  }
}