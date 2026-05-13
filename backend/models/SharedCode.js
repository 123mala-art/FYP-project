import mongoose from "mongoose";

const sharedCodeSchema = new mongoose.Schema({
  shareId: { type: String, unique: true, required: true },
  language: { type: String, required: true },
  code: { type: String, required: true },
  createdAt: { type: Date, default: Date.now, expires: 604800 } // Auto-delete after 7 days
});

export const SharedCode = mongoose.model("SharedCode", sharedCodeSchema);
