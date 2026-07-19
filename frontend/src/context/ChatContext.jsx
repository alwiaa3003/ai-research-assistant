import { createContext, useState } from "react";

export const ChatContext = createContext(null);

export const ChatProvider = ({ children }) => {
  const [activeChatId, setActiveChatId] = useState(null);
  const [messages, setMessages] = useState([]);

  return (
    <ChatContext.Provider value={{ activeChatId, setActiveChatId, messages, setMessages }}>
      {children}
    </ChatContext.Provider>
  );
};
