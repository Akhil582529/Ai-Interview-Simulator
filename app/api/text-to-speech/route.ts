import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {

  try {
      console.log('==========================================');
      console.log('🔍 API Route Called');
      console.log('Key exists:', !!process.env.ELEVENLABS_API_KEY);
      console.log('Key length:', process.env.ELEVENLABS_API_KEY?.length);
      console.log('Key starts with sk_:', process.env.ELEVENLABS_API_KEY?.startsWith('sk_'));
      console.log('Key first 10 chars:', process.env.ELEVENLABS_API_KEY?.substring(0, 10));
      console.log('==========================================');
    const body = await request.json();
    const { text, voiceId } = body;

    console.log('TTS API called with text length:', text?.length);

    // Validation
    if (!text || typeof text !== 'string') {
      console.error('Invalid text input:', text);
      return NextResponse.json(
        { error: 'Text is required and must be a string' },
        { status: 400 }
      );
    }

    if (text.length > 5000) {
      console.error('Text too long:', text.length);
      return NextResponse.json(
        { error: 'Text must be less than 5000 characters' },
        { status: 400 }
      );
    }

    const apiKey = process.env.ELEVENLABS_API_KEY;
    if (!apiKey) {
      console.error('ELEVENLABS_API_KEY not found in environment');
      return NextResponse.json(
        { error: 'ElevenLabs API key not configured. Please add ELEVENLABS_API_KEY to your .env.local file' },
        { status: 500 }
      );
    }

    console.log('API Key found, length:', apiKey.length);

    // Default voice ID (Sarah - professional female voice)
    const selectedVoiceId = voiceId || process.env.ELEVENLABS_VOICE_ID;
    console.log('Using voice ID:', selectedVoiceId);

    const elevenLabsUrl = `https://api.elevenlabs.io/v1/text-to-speech/${selectedVoiceId}`;
    console.log('Calling ElevenLabs API:', elevenLabsUrl);

    const response = await fetch(elevenLabsUrl, {
      method: 'POST',
      headers: {
        'Accept': 'audio/mpeg',
        'Content-Type': 'application/json',
        'xi-api-key': apiKey,
      },
      body: JSON.stringify({
        text,
        model_id: 'eleven_turbo_v2_5',
        voice_settings: {
          stability: 0.5,
          similarity_boost: 0.75,
          style: 0,
          use_speaker_boost: true,
        },
      }),
    });

    console.log('ElevenLabs response status:', response.status);
    console.log('ElevenLabs response headers:', Object.fromEntries(response.headers.entries()));

    if (!response.ok) {
      const contentType = response.headers.get('content-type');
      let errorMessage = 'Failed to generate speech';
      
      if (contentType?.includes('application/json')) {
        const error = await response.json();
        console.error('ElevenLabs API error (JSON):', error);
        errorMessage = error.detail?.message || error.message || errorMessage;
      } else {
        const errorText = await response.text();
        console.error('ElevenLabs API error (Text):', errorText);
        errorMessage = errorText || errorMessage;
      }

      // Provide helpful error messages
      if (response.status === 401) {
        errorMessage = 'Invalid ElevenLabs API key. Please check your ELEVENLABS_API_KEY environment variable.';
      } else if (response.status === 429) {
        errorMessage = 'ElevenLabs API rate limit exceeded. Please try again later.';
      } else if (response.status === 422) {
        errorMessage = 'Invalid request to ElevenLabs API. Check voice ID and text parameters.';
      }

      return NextResponse.json(
        { error: errorMessage },
        { status: response.status }
      );
    }

    const audioBuffer = await response.arrayBuffer();
    console.log('Audio buffer received, size:', audioBuffer.byteLength, 'bytes');

    if (audioBuffer.byteLength === 0) {
      console.error('Received empty audio buffer');
      return NextResponse.json(
        { error: 'Received empty audio data from ElevenLabs' },
        { status: 500 }
      );
    }

    return new NextResponse(audioBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'audio/mpeg',
        'Content-Length': audioBuffer.byteLength.toString(),
        'Cache-Control': 'public, max-age=3600', // Cache for 1 hour
      },
    });
  } catch (error) {
    console.error('Text-to-speech error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Internal server error';
    return NextResponse.json(
      { error: `Server error: ${errorMessage}` },
      { status: 500 }
    );
  }
}