
import { GoogleGenAI, Type } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const generateCombatCard = async (rawNotes: string) => {
  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: rawNotes,
    config: {
      systemInstruction: "You are a Grade 8 Exam Survival AI. Analyze the text provided by the user. Return a JSON object formatted for a tactical study card. Keep it brutal, high-impact, and extremely concise. Focus on high-weightage content.",
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          title: { type: Type.STRING, description: "Highly tactical title for the chapter or topic." },
          summary: { 
            type: Type.ARRAY, 
            items: { type: Type.STRING },
            description: "A list of bullet points covering core concepts."
          },
          criticalFormulas: { 
            type: Type.ARRAY, 
            items: { type: Type.STRING },
            description: "Essential formulas or key definitions (The Combat Armory)."
          },
          traps: { 
            type: Type.ARRAY, 
            items: { type: Type.STRING },
            description: "Common mistakes students make (The Trap)."
          }
        },
        required: ["title", "summary", "criticalFormulas", "traps"],
        propertyOrdering: ["title", "summary", "criticalFormulas", "traps"]
      }
    },
  });

  return JSON.parse(response.text.trim());
};
