import Transaction from "../models/Transaction.js";

const round = (n) => Math.round(n * 100) / 100;

export const getSummary = async (req, res) => {
  const user = req.user._id;
  const [totals, byCategory, recent] = await Promise.all([
    Transaction.aggregate([{ $match: { user } }, { $group: { _id: "$type", total: { $sum: "$amount" } } }]),
    Transaction.aggregate([
      { $match: { user, type: "Expense" } },
      { $group: { _id: "$category", total: { $sum: "$amount" } } },
      { $sort: { total: -1 } },
    ]),
    Transaction.find({ user }).sort({ date: -1, createdAt: -1 }).limit(5).lean(),
  ]);
  const totalIncome = round(totals.find((t) => t._id === "Income")?.total || 0);
  const totalExpenses = round(totals.find((t) => t._id === "Expense")?.total || 0);
  res.json({
    totalIncome,
    totalExpenses,
    balance: round(totalIncome - totalExpenses),
    expensesByCategory: byCategory.map((c) => ({ category: c._id, total: round(c.total) })),
    recentTransactions: recent,
  });
};
