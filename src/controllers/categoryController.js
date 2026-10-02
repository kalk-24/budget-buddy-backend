import mongoose from "mongoose";
import Category from "../models/Category.js";

const fail = (status, message) => {
  const err = new Error(message);
  err.status = status;
  return err;
};

const DEFAULTS = ["Food", "Rent", "Transportation", "Shopping", "Entertainment", "Salary", "Education", "Other"];

const checkId = (id) => {
  if (!mongoose.isValidObjectId(id)) throw fail(400, "Invalid ID");
};

const cleanName = (name) => {
  if (typeof name !== "string" || !name.trim()) throw fail(400, "Category name is required");
  return name.trim();
};

export const getCategories = async (req, res) => {
  // First visit: give the user the default categories
  if ((await Category.countDocuments({ user: req.user._id })) === 0) {
    await Category.insertMany(DEFAULTS.map((name) => ({ name, user: req.user._id })));
  }
  res.json(await Category.find({ user: req.user._id }).sort({ name: 1 }));
};

export const createCategory = async (req, res) => {
  const data = { name: cleanName(req.body.name), user: req.user._id };
  if (req.body.color) data.color = String(req.body.color);
  res.status(201).json(await Category.create(data));
};

export const updateCategory = async (req, res) => {
  checkId(req.params.id);
  const data = {};
  if (req.body.name !== undefined) data.name = cleanName(req.body.name);
  if (req.body.color !== undefined) data.color = String(req.body.color);

  const doc = await Category.findOneAndUpdate(
    { _id: req.params.id, user: req.user._id },
    data,
    { new: true, runValidators: true }
  );
  if (!doc) throw fail(404, "Category not found");
  res.json(doc);
};

export const deleteCategory = async (req, res) => {
  checkId(req.params.id);
  const doc = await Category.findOneAndDelete({ _id: req.params.id, user: req.user._id });
  if (!doc) throw fail(404, "Category not found");
  res.json({ message: "Category deleted" });
};