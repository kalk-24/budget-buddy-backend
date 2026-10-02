import mongoose from "mongoose";
import Budget from "../models/Budget.js";
import Expense from "../models/Expense.js";

const fail = (status, message) => {
  const err = new Error(message);
  err.status = status;
  return err;
};

const checkId = (id) => {
  if (!mongoose.isValidObjectId(id)) throw fail(400, "Invalid ID");
};

const MONTH = /^\d{4}-(0[1-9]|1[0-2])$/;

// Adds "spent" and "remaining" to a budget
const withSpent = async (budget, userId) => {
  const [y, m] = budget.month.split("-").map(Number);
  const start = new Date(Date.UTC(y, m - 1, 1));
  const end = new Date(Date.UTC(y, m, 1));

  const result = await Expense.aggregate([
    { $match: { user: userId, category: budget.category, date: { $gte: start, $lt: end } } },
    { $group: { _id: null, total: { $sum: "$amount" } } },
  ]);
  const spent = Math.round((result[0]?.total || 0) * 100) / 100;

  return {
    ...budget.toObject(),
    spent,
    remaining: Math.round((budget.limit - spent) * 100) / 100,
  };
};

const clean = (body, partial = false) => {
  const out = {};
  const { category, limit, month } = body;

  if (!partial || category !== undefined) {
    if (typeof category !== "string" || !category.trim()) throw fail(400, "Category is required");
    out.category = category.trim();
  }
  if (!partial || limit !== undefined) {
    const n = Number(limit);
    if (limit === "" || limit == null || !Number.isFinite(n) || n <= 0)
      throw fail(400, "Limit must be a number greater than 0");
    out.limit = Math.round(n * 100) / 100;
  }
  if (!partial || month !== undefined) {
    if (typeof month !== "string" || !MONTH.test(month))
      throw fail(400, "Month must look like 2026-10");
    out.month = month;
  }
  return out;
};

export const getBudgets = async (req, res) => {
  const filter = { user: req.user._id };
  if (req.query.month) filter.month = req.query.month;
  const budgets = await Budget.find(filter).sort({ month: -1, category: 1 });
  res.json(await Promise.all(budgets.map((b) => withSpent(b, req.user._id))));
};

export const createBudget = async (req, res) => {
  const budget = await Budget.create({ ...clean(req.body), user: req.user._id });
  res.status(201).json(await withSpent(budget, req.user._id));
};

export const updateBudget = async (req, res) => {
  checkId(req.params.id);
  const budget = await Budget.findOneAndUpdate(
    { _id: req.params.id, user: req.user._id },
    clean(req.body, true),
    { new: true, runValidators: true }
  );
  if (!budget) throw fail(404, "Budget not found");
  res.json(await withSpent(budget, req.user._id));
};

export const deleteBudget = async (req, res) => {
  checkId(req.params.id);
  const budget = await Budget.findOneAndDelete({ _id: req.params.id, user: req.user._id });
  if (!budget) throw fail(404, "Budget not found");
  res.json({ message: "Budget deleted" });
};