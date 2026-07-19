import { useContext, useState } from "react";
import { ChatContext } from "../context/ChatContext";
import { sendMessage as sendMessageApi, getMessages } from "../services/chatService";

export const useChat = () => {
  const { activeChatId, setActiveChatId, messages, setMessages } = useContext(ChatContext);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");

  const loadMessages = async (chatId) => {
    const data = await getMessages(chatId);
    setMessages(data);
    setActiveChatId(chatId);
  };

  const send = async (content, company) => {
    if (!activeChatId) return;
    setSending(true);
    setError("");
    setMessages((prev) => [...prev, { role: "user", content, _id: `temp-${Date.now()}` }]);
    try {
      const { userMessage, assistantMessage, sources } = await sendMessageApi(activeChatId, content, company);
      const assistantMessageWithSources = { ...assistantMessage, sources: sources || [] };
      setMessages((prev) => [
        ...prev.filter((m) => !String(m._id).startsWith("temp-")),
        userMessage,
        assistantMessageWithSources,
      ]);
    } catch (err) {
      setError(err.response?.data?.message || "Something went wrong. Please try again.");
      setMessages((prev) => prev.filter((m) => !String(m._id).startsWith("temp-")));
    } finally {
      setSending(false);
    }
  };

  return { activeChatId, messages, sending, error, loadMessages, send };
};