import mongoose from "mongoose";

const budgetSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    category: { type: String, required: true, trim: true, maxlength: 30 },
    limit: { type: Number, required: true, min: [0.01, "Limit must be greater than 0"] },
    month: { type: String, required: true, match: [/^\d{4}-(0[1-9]|1[0-2])$/, "Month must look like 2026-10"] },
  },
  { timestamps: true }
);

// One budget per category per month for each user
budgetSchema.index({ user: 1, category: 1, month: 1 }, { unique: true });

export default mongoose.model("Budget", budgetSchema);