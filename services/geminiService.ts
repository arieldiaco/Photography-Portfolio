
import { GoogleGenAI, Type } from "@google/genai";

const getApiKey = (): string => {
  try {
    return (import.meta as any).env?.VITE_API_KEY || (window as any).process?.env?.API_KEY || '';
  } catch {
    return '';
  }
};

const apiKey = getApiKey();
const ai = apiKey ? new GoogleGenAI({ apiKey }) : null;

export async function analyzeImage(base64Data: string) {
  if (!ai) {
    console.warn("Gemini API key missing. Using default analysis.");
    return { hexColor: "#ffffff", isDark: false };
  }

  const model = 'gemini-3-flash-preview';
  
  const prompt = `Analyze this photograph for a portfolio website. 
  1. Suggest a single hex color code that 'resonates' with the overall mood and colors of the image.
  2. Determine if the top-left and top-right corners of the image are generally DARK (true) or LIGHT (false).
  Return only JSON.`;

  try {
    const response = await ai.models.generateContent({
      model,
      contents: {
        parts: [
          { inlineData: { data: base64Data.split(',')[1], mimeType: 'image/jpeg' } },
          { text: prompt }
        ]
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            hexColor: { type: Type.STRING, description: "A valid CSS hex color code" },
            isDark: { type: Type.BOOLEAN, description: "True if text should be white, false if black" }
          },
          required: ["hexColor", "isDark"]
        }
      }
    });
    return JSON.parse(response.text || "{}");
  } catch (e) {
    console.error("Error calling Gemini API", e);
    return { hexColor: "#000000", isDark: true };
  }
}
