import "dotenv/config";
import express from "express";
import cors from "cors";
import connectDB from "./config/db.js";
import authRoutes from "./routes/authRoutes.js";
import chatRoutes from "./routes/chatRoutes.js";
import stockRoutes from "./routes/stockRoutes.js";
import uploadRoutes from "./routes/uploadRoutes.js";
import documentRoutes from "./routes/documentRoutes.js";
import { notFound, errorHandler } from "./middleware/errorMiddleware.js";

connectDB();

const app = express();

app.use(cors({ origin: process.env.CLIENT_URL || "http://localhost:5173", credentials: true }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get("/", (req, res) => res.json({ status: "AI Research Assistant API is running" }));

app.use("/api/auth", authRoutes);
app.use("/api/chats", chatRoutes);
app.use("/api/stocks", stockRoutes);
app.use("/api/upload", uploadRoutes);
app.use("/api/documents", documentRoutes);

app.use(notFound);
app.use(errorHandler);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
