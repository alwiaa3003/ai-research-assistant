import { useState } from "react";

const ChatInput = ({ onSend, disabled }) => {
  const [value, setValue] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!value.trim() || disabled) return;
    onSend(value.trim());
    setValue("");
  };

  return (
    <form onSubmit={handleSubmit} className="flex items-center gap-2 border-t border-sage-100 p-4 bg-cream">
      <input
        type="text"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder='Ask something like "Summarise TCS latest results"'
        className="flex-1 border border-sage-200 rounded-full px-4 py-2.5 bg-white focus:outline-none focus:ring-2 focus:ring-sage-400 text-sage-900 placeholder:text-sage-400"
        disabled={disabled}
      />
      <button
        type="submit"
        disabled={disabled || !value.trim()}
        className="bg-sage-600 text-white px-5 py-2.5 rounded-full disabled:opacity-40 hover:bg-sage-700 transition shadow-soft"
      >
        Send
      </button>
    </form>
  );
};

export default ChatInput;