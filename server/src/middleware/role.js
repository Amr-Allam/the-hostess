import { httpError } from "../utils/httpError.js";

// Use after requireAuth: router.use(requireAuth, requireRole("owner"))
export function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user) throw httpError(401, "Authentication required");
    if (!roles.includes(req.user.role)) throw httpError(403, "Forbidden");
    next();
  };
}
