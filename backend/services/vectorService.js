import { ChromaClient } from "chromadb";
import { getGeminiClient } from "../config/gemini.js";

const chroma = new ChromaClient({ path: "http://localhost:8000" });
const COLLECTION_NAME = "stock_documents";

let _collection = null;
const getCollection = async () => {
  if (!_collection) {
    _collection = await chroma.getOrCreateCollection({ name: COLLECTION_NAME });
  }
  return _collection;
};

export const embedText = async (text) => {
  const ai = getGeminiClient();
  const result = await ai.models.embedContent({
    model: "gemini-embedding-001",
    contents: text,
  });
  return result.embeddings[0].values;
};

export const upsertChunks = async ({ documentId, company, chunks }) => {
  const collection = await getCollection();

  const ids = [];
  const embeddings = [];
  const metadatas = [];
  const documents = [];

  for (let i = 0; i < chunks.length; i++) {
    const vector = await embedText(chunks[i]);
    ids.push(`${documentId}-chunk-${i}`);
    embeddings.push(vector);
    metadatas.push({ company, documentId: String(documentId), source: company });
    documents.push(chunks[i]);
  }

  await collection.add({ ids, embeddings, metadatas, documents });
  return { upserted: chunks.length };
};

export const retrieveSimilarChunks = async ({ query, company, topK = 5 }) => {
  const collection = await getCollection();
  const queryEmbedding = await embedText(query);

  const results = await collection.query({
    queryEmbeddings: [queryEmbedding],
    nResults: topK,
    where: company ? { company } : undefined,
  });

  const docs = results.documents?.[0] || [];
  const metas = results.metadatas?.[0] || [];

  return docs.map((text, i) => ({
    text,
    source: metas[i]?.source || "Unknown",
    url: "",
  }));
};