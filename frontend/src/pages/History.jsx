import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar/Navbar";
import Loader from "../components/Loader/Loader";
import { getChats } from "../services/chatService";

const History = () => {
  const [chats, setChats] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    (async () => {
      const data = await getChats();
      setChats(data);
      setLoading(false);
    })();
  }, []);

  return (
    <div className="min-h-screen bg-cream">
      <Navbar />
      <main className="max-w-3xl mx-auto p-6">
        <h1 className="text-xl font-semibold text-sage-800 mb-6">Chat History</h1>

        {loading && <Loader />}

        {!loading && chats.length === 0 && (
          <div className="bg-white border border-sage-100 rounded-2xl p-8 text-center shadow-soft">
            <p className="text-sage-400">No conversations yet.</p>
          </div>
        )}

        <div className="space-y-3">
          {chats.map((chat) => (
            <button
              key={chat._id}
              onClick={() => navigate("/chat")}
              className="w-full text-left bg-white border border-sage-100 rounded-xl p-4 hover:shadow-soft hover:border-sage-200 transition"
            >
              <p className="font-medium text-sage-800">{chat.title}</p>
              <p className="text-xs text-sage-400 mt-1">
                {new Date(chat.updatedAt).toLocaleString()}
              </p>
            </button>
          ))}
        </div>
      </main>
    </div>
  );
};

export default History;