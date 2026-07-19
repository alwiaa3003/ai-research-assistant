import express from "express";
import { listStocks, getStock, addStock } from "../controllers/stockController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

router.get("/", listStocks);
router.get("/:symbol", getStock);
router.post("/", protect, addStock);

export default router;
