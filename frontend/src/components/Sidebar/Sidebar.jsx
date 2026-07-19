const Sidebar = ({ chats, activeChatId, onSelect, onNewChat }) => (
  <aside className="w-64 bg-cream border-r border-sage-100 flex flex-col">
    <button
      onClick={onNewChat}
      className="m-3 bg-sage-600 text-white rounded-xl py-2.5 font-medium hover:bg-sage-700 transition shadow-soft"
    >
      + New Chat
    </button>
    <div className="flex-1 overflow-y-auto px-2 space-y-1">
      {chats.map((chat) => (
        <button
          key={chat._id}
          onClick={() => onSelect(chat._id)}
          className={`block w-full text-left px-3 py-2.5 text-sm truncate rounded-lg transition ${
            activeChatId === chat._id
              ? "bg-sage-100 text-sage-800 font-medium"
              : "text-sage-600 hover:bg-sage-50"
          }`}
        >
          {chat.title}
        </button>
      ))}
    </div>
  </aside>
);

export default Sidebar;