import { Interview } from '@/types/interview';

export const generateInterview = async (
  role: string,
  experience: string,
  skills: string,
  isRecommended?: boolean
) => {
  const res = await fetch("/api/generate-interview", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ role, experience, skills, isRecommended }),
  });
  if (!res.ok) {
    const errorData = await res.json();
    throw new Error(errorData.error || 'Failed to generate interview');
  }
  return res.json();
};

// ── Structured feedback types ────────────────────────────────────────────────
export interface QuestionFeedback {
  question: string;
  answer: string;
  status: 'good' | 'partial' | 'poor' | 'unanswered';
  comment: string;
}

export interface StructuredFeedback {
  overallRating: number;          // 1–10
  overallSummary: string;         // 2–3 sentence summary
  totalQuestions: number;
  answeredWell: number;
  partialAnswers: number;
  poorAnswers: number;
  unanswered: number;
  strengths: string[];            // 2–4 bullet points
  improvements: string[];         // 2–4 bullet points
  tips: string[];                 // 2–4 actionable tips
  questionBreakdown: QuestionFeedback[];
}

export const generateFeedback = async (
  interview: Interview,
  answers: string[]
): Promise<{ feedback: string; structured: StructuredFeedback }> => {

  const feedbackPrompt = `
You are an expert technical interviewer. Evaluate the following interview and return ONLY valid JSON — no markdown, no explanation, no extra text.

Role: ${interview.role}
Experience Level: ${interview.experience}
Skills: ${interview.skills}

Questions and Answers:
${interview.questions.map((q, i) =>
  `Q${i + 1}: ${q}\nA${i + 1}: ${answers[i]?.trim() || 'No answer provided'}`
).join('\n\n')}

Return this exact JSON structure:
{
  "overallRating": <number 1-10>,
  "overallSummary": "<2-3 sentence overall assessment>",
  "totalQuestions": ${interview.questions.length},
  "answeredWell": <count of questions answered well>,
  "partialAnswers": <count of partially answered questions>,
  "poorAnswers": <count of poorly answered questions>,
  "unanswered": <count of unanswered questions>,
  "strengths": ["<strength 1>", "<strength 2>", "<strength 3>"],
  "improvements": ["<area to improve 1>", "<area to improve 2>", "<area to improve 3>"],
  "tips": ["<actionable tip 1>", "<actionable tip 2>", "<actionable tip 3>"],
  "questionBreakdown": [
    {
      "question": "<question text>",
      "answer": "<answer text or 'No answer provided'>",
      "status": "<one of: good | partial | poor | unanswered>",
      "comment": "<one sentence specific feedback for this answer>"
    }
  ]
}

Rules:
- status "good" = answered correctly and completely
- status "partial" = answered but missing key points
- status "poor" = answered incorrectly or very vaguely
- status "unanswered" = no answer given
- Be specific and constructive in comments
- Return ONLY the JSON object, nothing else
`;

  const res = await fetch("/api/generate-feedback", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ prompt: feedbackPrompt }),
  });

  if (!res.ok) throw new Error('Failed to generate feedback');

  const data = await res.json();

  // ── Robust JSON extraction ────────────────────────────────────────────
  let structured: StructuredFeedback;
  try {
    const raw = typeof data.feedback === 'string' ? data.feedback : JSON.stringify(data.feedback);

    // Strip markdown fences
    let cleaned = raw.replace(/```json\s*/gi, '').replace(/```\s*/g, '').trim();

    // Extract just the JSON object in case Gemini added text around it
    const firstBrace = cleaned.indexOf('{');
    const lastBrace  = cleaned.lastIndexOf('}');
    if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
      cleaned = cleaned.slice(firstBrace, lastBrace + 1);
    }

    structured = JSON.parse(cleaned);

    // Sanity check
    if (!structured.questionBreakdown || structured.questionBreakdown.length === 0) {
      throw new Error('Missing questionBreakdown');
    }
  } catch (parseErr) {
    console.error('JSON parse failed, using fallback:', parseErr);

    const breakdown = interview.questions.map((q, i) => ({
      question: q,
      answer: answers[i] || 'No answer provided',
      status: (answers[i]?.trim().length > 20 ? 'partial' : answers[i]?.trim() ? 'poor' : 'unanswered') as StructuredFeedback['questionBreakdown'][0]['status'],
      comment: 'Detailed feedback unavailable — please retry.',
    }));

    structured = {
      overallRating: 6,
      overallSummary: 'Interview completed. Detailed AI analysis was unavailable — please retry for full feedback.',
      totalQuestions: interview.questions.length,
      answeredWell:   0,
      partialAnswers: breakdown.filter(b => b.status === 'partial').length,
      poorAnswers:    breakdown.filter(b => b.status === 'poor').length,
      unanswered:     breakdown.filter(b => b.status === 'unanswered').length,
      strengths:    ['Completed the interview session'],
      improvements: ['Retry to get detailed per-question feedback'],
      tips:         ['Speak clearly and in complete sentences for best results'],
      questionBreakdown: breakdown,
    };
  }

  return {
    feedback: data.feedback,
    structured,
  };
};