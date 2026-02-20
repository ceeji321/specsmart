// src/services/aiService.js
export async function askAI(messages) {
  try {
    const token = localStorage.getItem('token');
    
    const formattedMessages = messages.map(msg => {
      if (msg.role === 'user' && Array.isArray(msg.content)) {
        return {
          role: msg.role,
          content: msg.content
        };
      }
      return {
        role: msg.role,
        content: msg.content
      };
    });

    console.log('🤖 Sending to AI API:', formattedMessages);

    const response = await fetch('https://specsmart-production.up.railway.app/api/ai/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token && { 'Authorization': `Bearer ${token}` })
      },
      body: JSON.stringify({ 
        messages: formattedMessages
      })
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `API request failed with status ${response.status}`);
    }

    const data = await response.json();
    console.log('✅ AI Response received:', data);
    
    return data.content;
  } catch (error) {
    console.error('❌ AI Service Error:', error);
    
    if (error.message.includes('Failed to fetch') || error.message.includes('NetworkError')) {
      throw new Error('Cannot connect to server. Make sure the backend is running on https://specsmart-production.up.railway.app');
    }
    
    if (error.message.includes('Rate limit exceeded')) {
      throw new Error('Too many requests. Please wait a moment and try again.');
    }
    
    throw error;
  }
}

export async function analyzeImage(base64Image, mimeType = 'image/jpeg') {
  try {
    const token = localStorage.getItem('token');

    console.log('📸 Sending image to AI for analysis...');

    const response = await fetch('https://specsmart-production.up.railway.app/api/ai/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token && { 'Authorization': `Bearer ${token}` })
      },
      body: JSON.stringify({ 
        base64Image,
        mimeType
      })
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `Image analysis failed with status ${response.status}`);
    }

    const data = await response.json();
    console.log('✅ Image analysis received:', data);
    
    return data.content;
  } catch (error) {
    console.error('❌ Image Analysis Error:', error);
    
    if (error.message.includes('Failed to fetch') || error.message.includes('NetworkError')) {
      throw new Error('Cannot connect to server. Make sure the backend is running.');
    }
    
    throw error;
  }
}

export default { askAI, analyzeImage };