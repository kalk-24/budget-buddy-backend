import mongoose from "mongoose";
import Transaction, { CATEGORIES } from "../models/Transaction.js";

const fail = (status, message) => {
  const err = new Error(message);
  err.status = status;
  return err;
};

const clean = (body, partial = false) => {
  const out = {};
  const { description, amount, type, category, date } = body;
  if (!partial || description !== undefined) {
    if (typeof description !== "string" || !description.trim()) throw fail(400, "Description is required");
    out.description = description.trim();
  }
  if (!partial || amount !== undefined) {
    const n = Number(amount);
    if (amount === "" || amount == null || !Number.isFinite(n) || n <= 0) throw fail(400, "Amount must be a number greater than 0");
    out.amount = Math.round(n * 100) / 100;
  }
  if (!partial || type !== undefined) {
    if (!["Income", "Expense"].includes(type)) throw fail(400, "Type must be Income or Expense");
    out.type = type;
  }
  if (!partial || category !== undefined) {
    if (!CATEGORIES.includes(category)) throw fail(400, "Category must be one of: " + CATEGORIES.join(", "));
    out.category = category;
  }
  if (!partial || date !== undefined) {
    const d = new Date(date);
    if (!date || isNaN(d)) throw fail(400, "A valid date is required");
    out.date = d;
  }
  return out;
};

const checkId = (id) => {
  if (!mongoose.isValidObjectId(id)) throw fail(400, "Invalid ID");
};

export const getTransactions = async (req, res) => {
  const { category, type, from, to } = req.query;
  const filter = { user: req.user._id };
  if (category) filter.category = category;
  if (type) filter.type = type;
  if (from || to) {
    filter.date = {};
    if (from) filter.date.$gte = new Date(from);
    if (to) filter.date.$lte = new Date(to + "T23:59:59.999Z");
  }
  res.json(await Transaction.find(filter).sort({ date: -1, createdAt: -1 }));
};

export const createTransaction = async (req, res) => {
  res.status(201).json(await Transaction.create({ ...clean(req.body), user: req.user._id }));
};

export const updateTransaction = async (req, res) => {
  checkId(req.params.id);
  const t = await Transaction.findOneAndUpdate(
    { _id: req.params.id, user: req.user._id },
    clean(req.body, true),
    { new: true, runValidators: true }
  );
  if (!t) throw fail(404, "Transaction not found");
  res.json(t);
};

export const deleteTransaction = async (req, res) => {
  checkId(req.params.id);
  const t = await Transaction.findOneAndDelete({ _id: req.params.id, user: req.user._id });
  if (!t) throw fail(404, "Transaction not found");
  res.json({ message: "Transaction deleted" });
};
