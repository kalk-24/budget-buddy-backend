import mongoose from "mongoose";

const fail = (status, message) => {
  const err = new Error(message);
  err.status = status;
  return err;
};

const clean = (body, partial = false) => {
  const out = {};
  const { description, amount, category, date } = body;

  if (!partial || description !== undefined) {
    if (typeof description !== "string" || !description.trim())
      throw fail(400, "Description is required");
    out.description = description.trim();
  }
  if (!partial || amount !== undefined) {
    const n = Number(amount);
    if (amount === "" || amount == null || !Number.isFinite(n) || n <= 0)
      throw fail(400, "Amount must be a number greater than 0");
    out.amount = Math.round(n * 100) / 100;
  }
  if (!partial || category !== undefined) {
    if (typeof category !== "string" || !category.trim())
      throw fail(400, "Category is required");
    out.category = category.trim();
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

export const makeCrud = (Model, label) => ({
  getAll: async (req, res) => {
    const { category, from, to } = req.query;
    const filter = { user: req.user._id };
    if (category) filter.category = category;
    if (from || to) {
      filter.date = {};
      if (from) filter.date.$gte = new Date(from);
      if (to) filter.date.$lte = new Date(`${to}T23:59:59.999Z`);
    }
    res.json(await Model.find(filter).sort({ date: -1, createdAt: -1 }));
  },

  getOne: async (req, res) => {
    checkId(req.params.id);
    const doc = await Model.findOne({ _id: req.params.id, user: req.user._id });
    if (!doc) throw fail(404, `${label} not found`);
    res.json(doc);
  },

  create: async (req, res) => {
    const doc = await Model.create({ ...clean(req.body), user: req.user._id });
    res.status(201).json(doc);
  },

  update: async (req, res) => {
    checkId(req.params.id);
    const doc = await Model.findOneAndUpdate(
      { _id: req.params.id, user: req.user._id },
      clean(req.body, true),
      { new: true, runValidators: true }
    );
    if (!doc) throw fail(404, `${label} not found`);
    res.json(doc);
  },

  remove: async (req, res) => {
    checkId(req.params.id);
    const doc = await Model.findOneAndDelete({ _id: req.params.id, user: req.user._id });
    if (!doc) throw fail(404, `${label} not found`);
    res.json({ message: `${label} deleted` });
  },
});