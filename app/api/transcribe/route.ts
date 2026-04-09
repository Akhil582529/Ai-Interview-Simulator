import { NextRequest, NextResponse } from 'next/server';
// import formidable from 'formidable';
import fs from 'fs';
import OpenAI from 'openai';

// For Next.js 13+ App Router
export const runtime = 'nodejs';
export const maxDuration = 60;

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const audioFile = formData.get('audio') as Blob;
    
    if (!audioFile) {
      return NextResponse.json(
        { error: 'No audio file provided' },
        { status: 400 }
      );
    }

    // Convert Blob to File for OpenAI API
    const buffer = await audioFile.arrayBuffer();
    const file = new File([buffer], 'audio.webm', { type: 'audio/webm' });

    // Use Whisper API for transcription
    const transcription = await openai.audio.transcriptions.create({
      file: file,
      model: 'whisper-1',
      language: 'en', // Optional: specify language
    });

    return NextResponse.json({
      transcript: transcription.text,
      success: true,
    });
  } catch (error) {
    console.error('Transcription error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to transcribe audio',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}