import express from "express";
import { createChat, getChats, getMessages, sendMessage } from "../controllers/chatController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

router.use(protect);

router.post("/", createChat);
router.get("/", getChats);
router.get("/:chatId/messages", getMessages);
router.post("/:chatId/messages", sendMessage);

export default router;
