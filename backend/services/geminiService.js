import { getGeminiClient } from "../config/gemini.js";

export const askGemini = async ({ question, context = "", history = [] }) => {
  const systemPreamble = `You are an AI research assistant for stock market analysis.
Answer ONLY using the provided context (fundamentals, filings, news excerpts) when it is given.
If the context does not contain the answer, say so clearly instead of guessing.
Never give direct buy/sell/hold financial advice - present facts and let the user decide.
Always mention which source(s) your answer is grounded in, if context was provided.`;

  const historyText = history
    .map((h) => `${h.role === "user" ? "User" : "Assistant"}: ${h.content}`)
    .join("\n");

  const prompt = `${systemPreamble}

${context ? `Context:\n${context}\n` : ""}
${historyText ? `Conversation so far:\n${historyText}\n` : ""}
User question: ${question}`;

  const ai = getGeminiClient();
  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash",
    contents: prompt,
  });

  return response.text;
};