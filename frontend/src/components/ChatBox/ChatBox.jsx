import { useEffect, useRef } from "react";
import ChatMessage from "../ChatMessage/ChatMessage";
import ChatInput from "../ChatInput/ChatInput";
import Loader from "../Loader/Loader";

const ChatBox = ({ messages, onSend, sending, error }) => {
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto p-4">
        {messages.length === 0 && (
          <p className="text-sage-400 text-center mt-10">
            Ask about a stock's fundamentals, filings, or recent news to get started.
          </p>
        )}
        {messages.map((m) => (
          <ChatMessage key={m._id} message={m} />
        ))}
        {sending && (
          <div className="flex justify-start mb-4">
            <div className="bg-white border border-sage-100 rounded-2xl px-4 py-3 shadow-soft">
              <Loader size={18} />
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {error && (
        <p className="px-4 py-2 text-sm text-rose-600 bg-rose-50 border-t border-rose-100">
          {error}
        </p>
      )}

      <ChatInput onSend={onSend} disabled={sending} />
    </div>
  );
};

export default ChatBox;