import Expense from "../models/Expense.js";
import { makeCrud } from "./crudFactory.js";

export default makeCrud(Expense, "Expense");