import { ChromaClient } from "chromadb";

const client = new ChromaClient({
  host: "ai-research-assistant-chroma.onrender.com",
  port: 443,
  ssl: true,
});

try {
  console.log(await client.version());
  console.log(await client.listCollections());
} catch (err) {
  console.error(err);
}