import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const maxDuration = 60;

export async function POST(request: NextRequest) {
  try {
    const apiKey = process.env.ELEVENLABS_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: 'ElevenLabs API key not configured' },
        { status: 500 }
      );
    }

    const formData = await request.formData();
    const audioFile = formData.get('audio') as Blob;

    if (!audioFile) {
      return NextResponse.json(
        { error: 'No audio file provided' },
        { status: 400 }
      );
    }

    // Forward audio to ElevenLabs Speech-to-Text API
    const elevenLabsForm = new FormData();
    const file = new File([await audioFile.arrayBuffer()], 'audio.webm', {
      type: audioFile.type || 'audio/webm',
    });
    elevenLabsForm.append('file', file);
    elevenLabsForm.append('model_id', 'scribe_v1'); // ElevenLabs STT model

    const response = await fetch('https://api.elevenlabs.io/v1/speech-to-text', {
      method: 'POST',
      headers: {
        'xi-api-key': apiKey,
      },
      body: elevenLabsForm,
    });

    if (!response.ok) {
      const contentType = response.headers.get('content-type');
      let errorMessage = 'ElevenLabs STT failed';

      if (contentType?.includes('application/json')) {
        const err = await response.json();
        errorMessage = err.detail?.message || err.message || errorMessage;
      } else {
        errorMessage = await response.text() || errorMessage;
      }

      if (response.status === 401) errorMessage = 'Invalid ElevenLabs API key.';
      if (response.status === 429) errorMessage = 'ElevenLabs rate limit exceeded. Try again shortly.';

      return NextResponse.json({ error: errorMessage }, { status: response.status });
    }

    const data = await response.json();

    return NextResponse.json({
      transcript: data.text || '',
      success: true,
    });
  } catch (error) {
    console.error('ElevenLabs STT error:', error);
    return NextResponse.json(
      {
        error: 'Failed to transcribe audio',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}