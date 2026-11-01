import { Router } from "express";
import * as orders from "../controllers/orderController.js";
import { validate } from "../middleware/validate.js";
import { orderLimiter } from "../middleware/rateLimit.js";
import { idParamsSchema } from "../validators/menu.js";
import { createOrderBodySchema } from "../validators/orders.js";

const router = Router();

router.post(
  "/",
  orderLimiter,
  validate({ body: createOrderBodySchema }),
  orders.createOrder,
);
router.get("/:id", validate({ params: idParamsSchema }), orders.getOrder);

export default router;
