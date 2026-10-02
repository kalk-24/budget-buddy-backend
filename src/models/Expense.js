import mongoose from "mongoose";

const expenseSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    description: { type: String, required: true, trim: true, maxlength: 100 },
    amount: { type: Number, required: true, min: [0.01, "Amount must be greater than 0"] },
    category: { type: String, required: true, trim: true, maxlength: 30 },
    date: { type: Date, required: true, default: Date.now },
  },
  { timestamps: true }
);

export default mongoose.model("Expense", expenseSchema);