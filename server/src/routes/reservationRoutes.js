import { Router } from "express";
import * as reservations from "../controllers/reservationController.js";
import { validate } from "../middleware/validate.js";
import { availabilityLimiter } from "../middleware/rateLimit.js";
import { availabilityQuerySchema } from "../validators/reservations.js";

const router = Router();

router.get(
  "/availability",
  availabilityLimiter,
  validate({ query: availabilityQuerySchema }),
  reservations.getAvailability,
);

export default router;
