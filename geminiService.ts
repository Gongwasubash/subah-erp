
import { GoogleGenAI } from "@google/genai";

// Initialize the Google GenAI client with the API key from environment variables.
const ai = new GoogleGenAI({ apiKey: import.meta.env.VITE_GEMINI_API_KEY });

export const getAcademicAdvice = async (studentName: string, marks: any[]) => {
  const prompt = `Analyze the academic performance of student ${studentName} based on these marks: ${JSON.stringify(marks)}. 
  Provide a concise 3-sentence summary of strengths, weaknesses, and a recommendation for improvement.`;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
    });
    return response.text;
  } catch (error) {
    console.error("AI Advice Error:", error);
    return "Performance data is stable. Keep focusing on core subjects.";
  }
};

export const getDashboardSummary = async (stats: any) => {
  const prompt = `Act as a school administrator. Based on these stats: Total Students: ${stats.totalStudents}, 
  Total Fees Collected: NPR ${stats.totalFees}, Current Dues: NPR ${stats.totalDues}. 
  Provide a one-paragraph summary of the financial health of the school.`;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
    });
    return response.text;
  } catch (error) {
    return "The school financial operations are running within expected parameters.";
  }
};
