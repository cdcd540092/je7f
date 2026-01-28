import { GoogleGenAI } from "@google/genai";
import { GEMINI_MODEL_VISION, SYSTEM_INSTRUCTION } from "../constants";

export const analyzeFrame = async (base64Image: string): Promise<string> => {
  try {
    const apiKey = process.env.API_KEY;
    if (!apiKey) {
      throw new Error("API Key not found via process.env.API_KEY");
    }

    const ai = new GoogleGenAI({ apiKey });
    
    // Remove data URL prefix if present (e.g., "data:image/jpeg;base64,")
    const cleanBase64 = base64Image.replace(/^data:image\/(png|jpeg|webp);base64,/, "");

    const response = await ai.models.generateContent({
      model: GEMINI_MODEL_VISION,
      contents: {
        parts: [
          {
            inlineData: {
              mimeType: "image/jpeg",
              data: cleanBase64
            }
          },
          {
            text: "Analyze this scene from my smart glasses POV."
          }
        ]
      },
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        // Using lower thinking budget as we want speed for a HUD
        thinkingConfig: { thinkingBudget: 0 } 
      }
    });

    return response.text || "No analysis data returned.";

  } catch (error) {
    console.error("Gemini Vision Error:", error);
    throw new Error("Visual cortex analysis failed.");
  }
};