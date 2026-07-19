import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar/Navbar";
import StockCard from "../components/StockCard/StockCard";
import Loader from "../components/Loader/Loader";
import { getStocks } from "../services/stockService";

const Dashboard = () => {
  const [stocks, setStocks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    (async () => {
      try {
        const data = await getStocks();
        setStocks(data);
      } catch (err) {
        setError(err.response?.data?.message || "Failed to load stocks");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  return (
    <div className="min-h-screen bg-cream">
      <Navbar />
      <main className="max-w-5xl mx-auto p-6">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-xl font-semibold text-sage-800">Stocks</h1>
          <button
            onClick={() => navigate("/chat")}
            className="bg-sage-600 text-white px-4 py-2.5 rounded-xl hover:bg-sage-700 transition shadow-soft font-medium"
          >
            Ask AI Assistant
          </button>
        </div>

        {loading && <Loader />}
        {error && <p className="text-rose-600">{error}</p>}

        {!loading && !error && stocks.length === 0 && (
          <div className="bg-white border border-sage-100 rounded-2xl p-8 text-center shadow-soft">
            <p className="text-sage-400">
              No stocks yet. Add some via the API, or head to the chat assistant.
            </p>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {stocks.map((stock) => (
            <StockCard key={stock._id} stock={stock} onClick={() => navigate("/chat")} />
          ))}
        </div>
      </main>
    </div>
  );
};

export default Dashboard;