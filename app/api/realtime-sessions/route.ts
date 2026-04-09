import { NextRequest } from 'next/server';
import OpenAI from 'openai';

// This creates a WebSocket connection to OpenAI's Realtime API
export async function GET(request: NextRequest) {
  try {
    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });

    // Get session token for Realtime API
    const response = await fetch('https://api.openai.com/v1/realtime/sessions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-realtime-preview-2024-12-17',
        voice: 'alloy', // Options: alloy, echo, shimmer
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('Realtime API error:', error);
      return new Response(JSON.stringify({ error: 'Failed to create session' }), {
        status: response.status,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const data = await response.json();
    
    return new Response(JSON.stringify(data), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error: any) {
    console.error('Session creation error:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Failed to create session' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}