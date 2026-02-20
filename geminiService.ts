
import { GoogleGenAI, Type } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const generateCombatCard = async (rawNotes: string) => {
  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: rawNotes,
    config: {
      systemInstruction: "You are a Grade 8 Exam Survival AI. Analyze the text provided by the user. Return a JSON object formatted for a tactical study card. Keep it brutal, high-impact, and extremely concise. Focus on high-weightage content. Use the specified JSON schema.",
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
      }
    },
  });

  return JSON.parse(response.text.trim());
};

export const askWarlordAdvisor = async (prompt: string, history: {role: 'user'|'model', text: string}[]) => {
  // Convert simple history to parts format
  const contents = history.map(h => ({
    role: h.role,
    parts: [{ text: h.text }]
  }));
  
  // Add current message
  contents.push({ role: 'user', parts: [{ text: prompt }] });

  const response = await ai.models.generateContent({
    model: "gemini-3-pro-preview",
    contents,
    config: {
      systemInstruction: "You are the 'Warlord Advisor', a tactical AI assistant for a Grade 8 student named Saifan. Your tone is high-agency, discipline-focused, and slightly military-industrial. Help him with exam strategy, motivation, and quick topic explanations. Be direct, authoritative, and encouraging in a 'drill sergeant' way. Use your thinking budget to ensure your advice is optimal and covers all pedagogical pitfalls.",
      thinkingConfig: { thinkingBudget: 32768 }
    },
  });
  return response.text;
};

export const searchG8Intel = async (query: string) => {
  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: query,
    config: {
      tools: [{ googleSearch: {} }],
    },
  });

  const text = response.text;
  const groundingChunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
  
  return { text, groundingChunks };
};
