import Income from "../models/Income.js";
import { makeCrud } from "./crudFactory.js";

export default makeCrud(Income, "Income");