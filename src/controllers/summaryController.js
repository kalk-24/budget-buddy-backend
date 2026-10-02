import Income from "../models/Income.js";
import Expense from "../models/Expense.js";

const round = (n) => Math.round(n * 100) / 100;

export const getSummary = async (req, res) => {
  const user = req.user._id;
  const sum = [{ $match: { user } }, { $group: { _id: null, total: { $sum: "$amount" } } }];

  const [inc, exp, byCategory, recentIncome, recentExpense] = await Promise.all([
    Income.aggregate(sum),
    Expense.aggregate(sum),
    Expense.aggregate([
      { $match: { user } },
      { $group: { _id: "$category", total: { $sum: "$amount" } } },
      { $sort: { total: -1 } },
    ]),
    Income.find({ user }).sort({ date: -1 }).limit(5).lean(),
    Expense.find({ user }).sort({ date: -1 }).limit(5).lean(),
  ]);

  const totalIncome = round(inc[0]?.total || 0);
  const totalExpenses = round(exp[0]?.total || 0);

  const recent = [
    ...recentIncome.map((t) => ({ ...t, type: "Income" })),
    ...recentExpense.map((t) => ({ ...t, type: "Expense" })),
  ]
    .sort((a, b) => new Date(b.date) - new Date(a.date))
    .slice(0, 5);

  res.json({
    totalIncome,
    totalExpenses,
    balance: round(totalIncome - totalExpenses),
    expensesByCategory: byCategory.map((c) => ({ category: c._id, total: round(c.total) })),
    recentTransactions: recent,
  });
};