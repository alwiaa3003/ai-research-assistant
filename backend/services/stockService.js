import Stock from "../models/Stock.js";

export const getAllStocks = async () => {
  return Stock.find().sort({ companyName: 1 });
};

export const getStockBySymbol = async (symbol) => {
  return Stock.findOne({ symbol: symbol.toUpperCase() });
};

export const createStock = async (data) => {
  return Stock.create(data);
};
