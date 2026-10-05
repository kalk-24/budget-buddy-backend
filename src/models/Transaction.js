import mongoose from "mongoose";

export const CATEGORIES = ["Food", "Rent", "Transportation", "Shopping", "Entertainment", "Salary", "Education", "Other"];

const transactionSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    description: { type: String, required: true, trim: true, maxlength: 100 },
    amount: { type: Number, required: true, min: [0.01, "Amount must be greater than 0"] },
    type: { type: String, enum: ["Income", "Expense"], required: true },
    category: { type: String, enum: CATEGORIES, required: true },
    date: { type: Date, required: true, default: Date.now },
  },
  { timestamps: true }
);

export default mongoose.model("Transaction", transactionSchema);
