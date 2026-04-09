import { NextRequest, NextResponse } from 'next/server';
import { generateInterviewQuestions } from '@/utils/GeminiAIModal';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { role, experience, skills, isRecommended } = body;

    // ✅ Check role first
    if (!role) {
      return NextResponse.json(
        { error: 'Role is required' },
        { status: 400 }
      );
    }

    // ✅ If not recommended, require more details
    if (!isRecommended && (!experience || !skills)) {
      return NextResponse.json(
        { error: 'Experience and skills are required for custom interviews' },
        { status: 400 }
      );
    }

    // ✅ API key check
    if (!process.env.GOOGLE_GENERATIVE_AI_API_KEY) {
      return NextResponse.json(
        { error: 'Google Generative AI API key not configured' },
        { status: 500 }
      );
    }

    // ✅ Dynamic prompt
    const prompt = isRecommended
      ? `
Generate 8-10 comprehensive interview questions for:
Role: ${role}
Base the questions on common expectations for this role.
Dont include any other text just list down the questions
      `
      : `
Generate 8-10 comprehensive interview questions for:
Role: ${role}
Experience Level: ${experience}
Key Skills: ${skills}
Dont include any other text just list down the questions
      `;

    const questions = await generateInterviewQuestions(prompt);

    return NextResponse.json({ questions });
  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json(
      { error: 'Failed to generate interview questions' },
      { status: 500 }
    );
  }
}
