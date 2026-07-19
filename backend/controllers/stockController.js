import { getAllStocks, getStockBySymbol, createStock } from "../services/stockService.js";

// @route GET /api/stocks
export const listStocks = async (req, res) => {
  try {
    const stocks = await getAllStocks();
    return res.status(200).json(stocks);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

// @route GET /api/stocks/:symbol
export const getStock = async (req, res) => {
  try {
    const stock = await getStockBySymbol(req.params.symbol);
    if (!stock) return res.status(404).json({ message: "Stock not found" });
    return res.status(200).json(stock);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

// @route POST /api/stocks
export const addStock = async (req, res) => {
  try {
    const stock = await createStock(req.body);
    return res.status(201).json(stock);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};
