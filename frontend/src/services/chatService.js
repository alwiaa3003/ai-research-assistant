import api from "./api";

export const createChat = async (title) => {
  const res = await api.post("/chats", { title });
  return res.data;
};

export const getChats = async () => {
  const res = await api.get("/chats");
  return res.data;
};

export const getMessages = async (chatId) => {
  const res = await api.get(`/chats/${chatId}/messages`);
  return res.data;
};

export const sendMessage = async (chatId, content, company) => {
  const res = await api.post(`/chats/${chatId}/messages`, { content, company });
  return res.data;
};
