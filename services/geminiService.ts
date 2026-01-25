
import { GoogleGenAI, Type } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export async function analyzeImage(base64Data: string) {
  const model = 'gemini-3-flash-preview';
  
  const prompt = `Analyze this photograph for a portfolio website. 
  1. Suggest a single hex color code that 'resonates' with the overall mood and colors of the image to be used as a surrounding background.
  2. Determine if the top-left and top-right corners of the image are generally DARK (true) or LIGHT (false) so we can decide if white or black text is better for visibility.
  Return only JSON.`;

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

  try {
    return JSON.parse(response.text || "{}");
  } catch (e) {
    console.error("Error parsing Gemini response", e);
    // If in doubt (on error), default to black background with white text as requested.
    return { hexColor: "#000000", isDark: true };
  }
}
