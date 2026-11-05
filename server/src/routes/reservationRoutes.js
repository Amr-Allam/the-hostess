import { Router } from "express";
import * as reservations from "../controllers/reservationController.js";
import { validate } from "../middleware/validate.js";
import {
  availabilityLimiter,
  reservationLimiter,
} from "../middleware/rateLimit.js";
import {
  availabilityQuerySchema,
  createReservationBodySchema,
} from "../validators/reservations.js";

const router = Router();

router.get(
  "/availability",
  availabilityLimiter,
  validate({ query: availabilityQuerySchema }),
  reservations.getAvailability,
);

router.post(
  "/",
  reservationLimiter,
  validate({ body: createReservationBodySchema }),
  reservations.createReservation,
);

export default router;
