# AI Research Assistant (LLM-powered)

A natural-language assistant that answers questions about a stock, grounded in
fundamentals and news through retrieval-augmented generation (RAG).

## What's included right now

- **Auth**: full JWT register/login/me flow (backend + frontend pages wired up)
- **Chat**: create chats, send messages, get Gemini-generated answers, view history
- **Stocks**: basic CRUD/listing for a stocks collection
- **Uploads**: PDF upload endpoint that extracts + chunks text, ready for embeddings
- **RAG scaffolding**: `ragService.js` and `vectorService.js` are wired together but
  `vectorService.js` is a stub — plug in ChromaDB/Pinecone there and citations +
  grounded answers will start working end-to-end with no other code changes needed.

## Getting it running

### Backend
```bash
cd backend
npm install
cp .env.example .env   # then fill in MONGO_URI, JWT_SECRET, GEMINI_API_KEY
npm run dev
```
Make sure MongoDB is running locally (or point MONGO_URI at Atlas).

### Frontend
```bash
cd frontend
npm install
cp .env.example .env   # VITE_API_BASE_URL should match your backend URL
npm run dev
```

Visit `http://localhost:5173`, register an account, and you'll land on the
Dashboard. Click "Ask AI Assistant" to start chatting — it already calls Gemini
end-to-end (just without grounding until the vector DB is connected).

## Next steps (the "Hard" parts of the assignment)

1. **Embeddings + vector store**: implement `embedText`, `upsertChunks`, and
   `retrieveSimilarChunks` in `backend/services/vectorService.js` using
   ChromaDB (local) or Pinecone (hosted). Once real vectors come back,
   `ragService.js` will automatically start grounding answers and returning
   real citations.
2. **Streaming responses**: switch `geminiService.js` to
   `generateContentStream` and stream chunks to the frontend via Server-Sent
   Events or a WebSocket, updating `ChatBox.jsx` to append tokens as they arrive.
3. **Guardrails**: the system prompt in `geminiService.js` already tells Gemini
   not to give direct financial advice — consider adding a second pass
   (a cheap classifier prompt) that flags/blocks answers that look like advice
   before they're saved.
4. **Stock detail page + embedded chat**: add a route like `/stocks/:symbol`
   that shows fundamentals (Recharts) with the `ChatBox` embedded alongside it,
   pre-filling the `company` field sent to `/api/chats/:chatId/messages`.
