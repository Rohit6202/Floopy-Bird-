
import { GoogleGenAI, Type } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });

export const getAICommentary = async (score: number, lastDeathReason: string) => {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Player score: ${score}. Death: ${lastDeathReason}. Give a funny 1-sentence game master comment.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            text: { type: Type.STRING },
            mood: { type: Type.STRING }
          },
          required: ["text", "mood"]
        }
      }
    });
    return JSON.parse(response.text);
  } catch (error) {
    return { text: "Rebooting feathers...", mood: "encouraging" };
  }
};

export const generateMissionInfo = async (themeName: string) => {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Generate a cool scifi mission name and a 1-sentence objective for a bird flying through a ${themeName} theme world.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING },
            objective: { type: Type.STRING }
          },
          required: ["title", "objective"]
        }
      }
    });
    return JSON.parse(response.text);
  } catch (error) {
    return { title: "Protocol Zero", objective: "Fly and survive the gauntlet." };
  }
};

export const getLiveInsight = async (score: number) => {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `The player just hit a score of ${score}. Give a very short (max 10 words) encouraging or witty live remark.`,
    });
    return response.text.replace(/"/g, '');
  } catch (error) {
    return "Keep steady!";
  }
};
