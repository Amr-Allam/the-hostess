import { getUserFromToken } from "../services/auth.js";
import { httpError } from "../utils/httpError.js";

// Reads "Authorization: Bearer <token>" and sets req.user.
export async function requireAuth(req, res, next) {
  const [scheme, token] = (req.headers.authorization || "").split(" ");
  if (scheme !== "Bearer" || !token) {
    throw httpError(401, "Authentication required");
  }

  req.user = await getUserFromToken(token);
  next();
}
