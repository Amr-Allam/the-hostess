import { Router } from "express";
import * as orders from "../controllers/orderController.js";
import { validate } from "../middleware/validate.js";
import { requireAuth } from "../middleware/auth.js";
import { requireRole } from "../middleware/role.js";
import { idParamsSchema } from "../validators/menu.js";
import {
  activeOrdersQuerySchema,
  updateOrderStatusBodySchema,
} from "../validators/staff.js";

const router = Router();

// Everything under /api/staff is for kitchen and owner.
router.use(requireAuth, requireRole("kitchen", "owner"));

router.get(
  "/orders",
  validate({ query: activeOrdersQuerySchema }),
  orders.listActiveOrders,
);
router.patch(
  "/orders/:id/status",
  validate({ params: idParamsSchema, body: updateOrderStatusBodySchema }),
  orders.updateOrderStatus,
);

export default router;
