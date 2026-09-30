import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import User from "../models/Use.js";

const createToken = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: "7d" });

const fail = (status, message) => {
  const err = new Error(message);
  err.status = status;
  return err;
};

export const register = async (req, res) => {
  const { name, email, password } = req.body;

  if (!name || !email || !password) throw fail(400, "All fields are required");
  if (password.length < 6) throw fail(400, "Password must be at least 6 characters");

  const exists = await User.findOne({ email: email.toLowerCase() });
  if (exists) throw fail(409, "Email already registered");

  const hashed = await bcrypt.hash(password, 10);
  const user = await User.create({ name, email, password: hashed });

  res.status(201).json({
    token: createToken(user._id),
    user: { id: user._id, name: user.name, email: user.email },
  });
};

export const login = async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) throw fail(400, "Email and password are required");

  const user = await User.findOne({ email: email.toLowerCase() }).select("+password");
  const ok = user && (await bcrypt.compare(password, user.password));
  if (!ok) throw fail(401, "Invalid email or password");

  res.json({
    token: createToken(user._id),
    user: { id: user._id, name: user.name, email: user.email },
  });
};