import api from "./api";

export const getStocks = async () => {
  const res = await api.get("/stocks");
  return res.data;
};

export const getStock = async (symbol) => {
  const res = await api.get(`/stocks/${symbol}`);
  return res.data;
};
