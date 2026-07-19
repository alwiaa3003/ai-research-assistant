import mongoose from "mongoose";

const stockSchema = new mongoose.Schema(
  {
    symbol: { type: String, required: true, unique: true, uppercase: true },
    companyName: { type: String, required: true },
    sector: { type: String },
    marketCap: { type: Number },
    exchange: { type: String },
  },
  { timestamps: true }
);

const Stock = mongoose.model("Stock", stockSchema);
export default Stock;
