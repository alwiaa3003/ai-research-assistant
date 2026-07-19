import mongoose from "mongoose";

const citationSchema = new mongoose.Schema(
  {
    source: { type: String },
    snippet: { type: String },
    url: { type: String },
  },
  { _id: false }
);

const messageSchema = new mongoose.Schema(
  {
    chatId: { type: mongoose.Schema.Types.ObjectId, ref: "Chat", required: true },
    role: { type: String, enum: ["user", "assistant"], required: true },
    content: { type: String, required: true },
    citations: { type: [citationSchema], default: [] },
  },
  { timestamps: true }
);

const Message = mongoose.model("Message", messageSchema);
export default Message;
