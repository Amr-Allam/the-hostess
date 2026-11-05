import { Router } from "express";
import * as menu from "../controllers/menuController.js";
import * as tables from "../controllers/tableController.js";
import * as uploads from "../controllers/uploadController.js";
import { uploadImage } from "../middleware/upload.js";
import { validate } from "../middleware/validate.js";
import { requireAuth } from "../middleware/auth.js";
import { requireRole } from "../middleware/role.js";
import {
  idParamsSchema,
  categoryBodySchema,
  menuItemBodySchema,
} from "../validators/menu.js";
import { tableBodySchema } from "../validators/tables.js";
import * as settings from "../controllers/settingsController.js";
import { settingsBodySchema } from "../validators/settings.js";
import * as reservations from "../controllers/reservationController.js";
import * as reports from "../controllers/reportController.js";
import { reportRangeQuerySchema } from "../validators/reports.js";
import {
  cancelReservationBodySchema,
  ownerReservationsQuerySchema,
} from "../validators/reservations.js";

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

router.post("/uploads", uploadImage, uploads.uploadImage);

router.get("/tables", tables.listTables);
router.post("/tables", validate({ body: tableBodySchema }), tables.createTable);
router.put(
  "/tables/:id",
  validate({ params: idParamsSchema, body: tableBodySchema }),
  tables.updateTable,
);
router.delete(
  "/tables/:id",
  validate({ params: idParamsSchema }),
  tables.deleteTable,
);

router.get("/settings", settings.getSettings);
router.put(
  "/settings",
  validate({ body: settingsBodySchema }),
  settings.updateSettings,
);

router.get(
  "/reservations",
  validate({ query: ownerReservationsQuerySchema }),
  reservations.listReservations,
);
router.patch(
  "/reservations/:id/status",
  validate({ params: idParamsSchema, body: cancelReservationBodySchema }),
  reservations.cancelReservation,
);

router.get(
  "/reports/daily",
  validate({ query: reportRangeQuerySchema }),
  reports.getDailyReport,
);
router.get(
  "/reports/top-items",
  validate({ query: reportRangeQuerySchema }),
  reports.getTopItems,
);

export default router;
