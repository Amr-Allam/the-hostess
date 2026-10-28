import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import User from "../models/User.js";
import { env } from "../config/env.js";
import { httpError } from "../utils/httpError.js";

export const BCRYPT_COST = 12;

// Compared against when the email doesn't exist, so "unknown email" takes as long as "wrong password" and can't be told apart by response time.
const DUMMY_HASH = bcrypt.hashSync("not-a-real-password", BCRYPT_COST);

export async function login(email, password) {
  const user = await User.findOne({ email });
  const passwordMatches = await bcrypt.compare(
    password,
    user ? user.passwordHash : DUMMY_HASH,
  );

  if (!user || !passwordMatches) {
    throw httpError(401, "Invalid email or password");
  }

  const token = jwt.sign({ role: user.role }, env.JWT_SECRET, {
    algorithm: "HS256",
    subject: user.id,
    expiresIn: env.JWT_EXPIRES_IN,
  });

  return { token, user: { email: user.email, role: user.role } };
}

// Verifies the token, then loads the user so deleted or changed accounts stop working immediately.
export async function getUserFromToken(token) {
  let payload;
  try {
    payload = jwt.verify(token, env.JWT_SECRET, { algorithms: ["HS256"] });
  } catch {
    throw httpError(401, "Invalid or expired token");
  }

  const user = await User.findById(payload.sub, "email role");
  if (!user) throw httpError(401, "Invalid or expired token");

  return { id: user.id, email: user.email, role: user.role };
}
