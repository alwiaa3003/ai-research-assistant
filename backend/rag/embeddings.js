import { Embeddings } from "@langchain/core/embeddings";
import { getGeminiClient } from "../config/gemini.js";

const EMBEDDING_MODEL = process.env.GEMINI_EMBEDDING_MODEL || "gemini-embedding-001";

/**
 * Sends a single piece of text to Gemini's embedding model and returns
 * the resulting vector. All embedding calls in this file funnel through
 * here, so the model name and error handling only live in one place.
 */
const embedSingle = async (text) => {
  try {
    const ai = getGeminiClient();
    const result = await ai.models.embedContent({
      model: EMBEDDING_MODEL,
      contents: text,
    });
    return result.embeddings[0].values;
  } catch (error) {
    console.error("Gemini embedding failed:", error);
    throw error;
}
};

/**
 * LangChain-compatible Embeddings implementation backed by Gemini.
 * Implements the two methods LangChain's vector stores expect:
 * embedQuery (one string) and embedDocuments (many strings).
 */
class GeminiEmbeddings extends Embeddings {
  constructor() {
    super({});
  }

  /**
   * Embeds a single string - used when embedding the user's question
   * at search/retrieval time.
   */
  async embedQuery(text) {
    return embedSingle(text);
  }

  /**
   * Embeds an array of strings - used when storing chunks for the
   * first time. Runs sequentially (not in parallel) to stay safely
   * under Gemini's per-minute rate limits on large PDFs.
   */
  async embedDocuments(texts) {
    const vectors = [];
    for (const text of texts) {
      vectors.push(await embedSingle(text));
    }
    return vectors;
  }
}

let _instance = null;

/**
 * Returns a shared GeminiEmbeddings instance, created once and reused
 * everywhere it's imported (vectorStore.js, retriever.js).
 */
export const getEmbeddings = () => {
  if (!_instance) {
    _instance = new GeminiEmbeddings();
  }
  return _instance;
};