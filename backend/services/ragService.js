import { retrieveSimilarChunks } from "./vectorService.js";
import { askGemini } from "./geminiService.js";

/**
 * Orchestrates retrieval-augmented generation:
 * 1. Embed + search the question against stored chunks (vectorService)
 * 2. Build a context string from the top matches
 * 3. Ask Gemini with that context
 * 4. Return both the answer and the citations used
 *
 * Until ChromaDB/Pinecone is wired up, retrieveSimilarChunks returns an
 * empty array, so answers will just be plain Gemini answers with no citations.
 */
export const generateGroundedAnswer = async ({ question, company, history }) => {
  const matches = await retrieveSimilarChunks({ query: question, company });

  const context = matches.map((m, i) => `[${i + 1}] (${m.source}) ${m.text}`).join("\n\n");

  const answer = await askGemini({ question, context, history });

  const citations = matches.map((m) => ({
    source: m.source,
    snippet: m.text.slice(0, 200),
    url: m.url || "",
  }));

  return { answer, citations };
};
