import { Router } from "express";
import { login, me } from "../controllers/authController.js";
import { validate } from "../middleware/validate.js";
import { requireAuth } from "../middleware/auth.js";
import { loginLimiter } from "../middleware/rateLimit.js";
import { loginSchema } from "../validators/auth.js";

const router = Router();

router.post("/login", loginLimiter, validate({ body: loginSchema }), login);
router.get("/me", requireAuth, me);

export default router;
