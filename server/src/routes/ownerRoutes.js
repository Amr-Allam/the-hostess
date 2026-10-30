import { Router } from "express";
import * as menu from "../controllers/menuController.js";
import { validate } from "../middleware/validate.js";
import { requireAuth } from "../middleware/auth.js";
import { requireRole } from "../middleware/role.js";
import {
  idParamsSchema,
  categoryBodySchema,
  menuItemBodySchema,
} from "../validators/menu.js";

const router = Router();

// Everything under /api/owner is owner-only.
router.use(requireAuth, requireRole("owner"));

router.post(
  "/categories",
  validate({ body: categoryBodySchema }),
  menu.createCategory,
);
router.put(
  "/categories/:id",
  validate({ params: idParamsSchema, body: categoryBodySchema }),
  menu.updateCategory,
);
router.delete(
  "/categories/:id",
  validate({ params: idParamsSchema }),
  menu.deleteCategory,
);

router.get("/menu-items", menu.listMenuItems);
router.post(
  "/menu-items",
  validate({ body: menuItemBodySchema }),
  menu.createMenuItem,
);
router.put(
  "/menu-items/:id",
  validate({ params: idParamsSchema, body: menuItemBodySchema }),
  menu.updateMenuItem,
);
router.delete(
  "/menu-items/:id",
  validate({ params: idParamsSchema }),
  menu.deleteMenuItem,
);

export default router;
