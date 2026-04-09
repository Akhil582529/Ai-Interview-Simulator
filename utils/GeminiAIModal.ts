import { GoogleGenerativeAI } from "@google/generative-ai";

export async function generateInterviewQuestions(prompt: string): Promise<string> {
  try {
    // Initialize the Google Generative AI client
    const genAI = new GoogleGenerativeAI(process.env.GOOGLE_GENERATIVE_AI_API_KEY!);
    
    // Get the generative model
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
    
    // Generate content
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    
    return text;
  } catch (error) {
    console.error("Gemini API error:", error);
    
    // Provide more specific error information
    if (error instanceof Error) {
      throw new Error(`Gemini API failed: ${error.message}`);
    }
    
    throw new Error("Failed to generate content with Gemini API");
  }
}