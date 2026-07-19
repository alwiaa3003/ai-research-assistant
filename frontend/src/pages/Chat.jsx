import { useEffect, useState } from "react";
import Navbar from "../components/Navbar/Navbar";
import Sidebar from "../components/Sidebar/Sidebar";
import ChatBox from "../components/ChatBox/ChatBox";
import { useChat } from "../hooks/useChat";
import { getChats, createChat } from "../services/chatService";

const Chat = () => {
  const [chats, setChats] = useState([]);
  const { activeChatId, messages, sending, error, loadMessages, send } = useChat();

  const refreshChats = async () => {
    const data = await getChats();
    setChats(data);
    return data;
  };

  useEffect(() => {
    (async () => {
      const data = await refreshChats();
      if (data.length > 0) {
        loadMessages(data[0]._id);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleNewChat = async () => {
    const chat = await createChat("New Chat");
    setChats((prev) => [chat, ...prev]);
    loadMessages(chat._id);
  };

  const handleSend = async (content) => {
    await send(content);
    refreshChats();
  };

  return (
    <div className="flex flex-col h-screen">
      <Navbar />
      <div className="flex flex-1 overflow-hidden">
        <Sidebar
          chats={chats}
          activeChatId={activeChatId}
          onSelect={loadMessages}
          onNewChat={handleNewChat}
        />
        <main className="flex-1">
          <ChatBox messages={messages} onSend={handleSend} sending={sending} error={error} />
        </main>
      </div>
    </div>
  );
};

export default Chat;