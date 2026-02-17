import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
  name: String,
  email: { type: String, unique: true, required: true },
  passwordHash: String,
  history: [
    {
      language: String,
      code: String,
      savedAt: { type: Date, default: Date.now }
    }
  ]
});

export const User = mongoose.model("User", userSchema);
