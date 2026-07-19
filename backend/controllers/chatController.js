import Chat from "../models/Chat.js";
import Message from "../models/Message.js";
import { retrieveContext } from "../rag/retriever.js";
import { buildPrompt } from "../rag/promptBuilder.js";
import { getGeminiClient } from "../config/gemini.js";

const CHAT_MODEL = process.env.GEMINI_CHAT_MODEL || "gemini-2.5-flash";

// @route POST /api/chats
export const createChat = async (req, res) => {
  try {
    const chat = await Chat.create({ userId: req.user._id, title: req.body.title || "New Chat" });
    return res.status(201).json(chat);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

// @route GET /api/chats
export const getChats = async (req, res) => {
  try {
    const chats = await Chat.find({ userId: req.user._id }).sort({ updatedAt: -1 });
    return res.status(200).json(chats);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

// @route GET /api/chats/:chatId/messages
export const getMessages = async (req, res) => {
  try {
    const { chatId } = req.params;
    const chat = await Chat.findOne({ _id: chatId, userId: req.user._id });
    if (!chat) return res.status(404).json({ message: "Chat not found" });

    const messages = await Message.find({ chatId }).sort({ createdAt: 1 });
    return res.status(200).json(messages);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

// @route POST /api/chats/:chatId/messages
// body: { content, company? }
export const sendMessage = async (req, res) => {
  try {
    const { chatId } = req.params;
    const { content, company } = req.body;

    if (!content || !content.trim()) {
      return res.status(400).json({ message: "Message content is required" });
    }

    const chat = await Chat.findOne({ _id: chatId, userId: req.user._id });
    if (!chat) return res.status(404).json({ message: "Chat not found" });

    // Save the user message
    const userMessage = await Message.create({ chatId, role: "user", content });

    // Pull recent history for context
    const recentMessages = await Message.find({ chatId }).sort({ createdAt: -1 }).limit(8);
    const history = recentMessages.reverse().map((m) => ({ role: m.role, content: m.content }));

    // Retrieve relevant chunks for this question (embeds the query internally)
    const retrievedChunks = await retrieveContext(content, { company });

    let answer;
    let sources = [];

    if (retrievedChunks.length === 0) {
      // No relevant chunks found - do not call Gemini, respond directly
      answer = "I don't have enough information in the uploaded documents to answer that.";
    } else {
      const prompt = buildPrompt({
        userQuestion: content,
        retrievedChunks,
        previousMessages: history,
      });

      const ai = getGeminiClient();
      const response = await ai.models.generateContent({
        model: CHAT_MODEL,
        contents: prompt,
      });

      answer = response.text?.trim() ||
    "I couldn't generate an answer from the available documents.";
      const uniqueSources = new Map();

      retrievedChunks.forEach(chunk => {
          const key = `${chunk.metadata.fileName}-${chunk.metadata.pageNumber}`;

          if (!uniqueSources.has(key)) {
              uniqueSources.set(key, {
                  fileName: chunk.metadata.fileName,
                  pageNumber: chunk.metadata.pageNumber,
                  score: chunk.score
              });
          }
});

sources = [...uniqueSources.values()];
    }

    // Persist citations in the existing Message schema shape
    const citations = sources.map((s) => ({
      source: s.fileName,
      snippet: "",
      url: "",
    }));

    const assistantMessage = await Message.create({
      chatId,
      role: "assistant",
      content: answer,
      citations,
    });

    chat.updatedAt = new Date();
    if (chat.title === "New Chat") {
      chat.title = content.slice(0, 50);
    }
    await chat.save();

    return res.status(200).json({ userMessage, assistantMessage, sources });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};
