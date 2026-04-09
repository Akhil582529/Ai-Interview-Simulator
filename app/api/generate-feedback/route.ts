import { NextRequest, NextResponse } from 'next/server';
import { generateInterviewQuestions } from '@/utils/GeminiAIModal';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { prompt } = body;

    if (!prompt) {
      return NextResponse.json(
        { error: 'Missing required field: prompt is required' },
        { status: 400 }
      );
    }

    if (!process.env.GOOGLE_GENERATIVE_AI_API_KEY) {
      return NextResponse.json(
        { error: 'Google Generative AI API key not configured' },
        { status: 500 }
      );
    }

    console.log('Generating feedback...');

    // Append extra instruction to force Gemini to return only JSON
    const strictPrompt = `${prompt}

CRITICAL INSTRUCTION: Your response must be ONLY the raw JSON object. 
Do NOT include any markdown formatting, do NOT wrap in \`\`\`json blocks, do NOT add any explanation or text before or after the JSON. 
Start your response with { and end with }. Nothing else.`;

    const feedback = await generateInterviewQuestions(strictPrompt);

    console.log('Raw Gemini response (first 300 chars):', feedback.substring(0, 300));

    return NextResponse.json({ feedback });
  } catch (error) {
    console.error('API Error:', error);
    if (error instanceof Error) {
      return NextResponse.json(
        { error: `Failed to generate feedback: ${error.message}` },
        { status: 500 }
      );
    }
    return NextResponse.json(
      { error: 'Failed to generate feedback' },
      { status: 500 }
    );
  }
}