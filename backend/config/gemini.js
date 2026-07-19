import { GoogleGenAI } from "@google/genai";

let _ai = null;

export const getGeminiClient = () => {
  if (!_ai) {
    if (!process.env.GEMINI_API_KEY) {
      console.warn("Warning: GEMINI_API_KEY is not set in .env");
    }
    _ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  }
  return _ai;
};