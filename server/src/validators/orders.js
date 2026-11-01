import { z } from "zod";
import { objectId } from "./menu.js";

const selectedOptionSchema = z.object({
  groupName: z.string().trim().min(1),
  choiceName: z.string().trim().min(1),
});

const orderItemSchema = z.object({
  menuItemId: objectId,
  quantity: z.number().int().min(1).max(20),
  note: z.string().trim().max(200).default(""),
  selectedOptions: z.array(selectedOptionSchema).default([]),
});

export const createOrderBodySchema = z
  .object({
    orderType: z.enum(["dine-in", "takeaway"]),
    tableNumber: z.number().int().min(1).optional(),
    customerNote: z.string().trim().max(500).default(""),
    items: z.array(orderItemSchema).min(1).max(50),
  })
  .superRefine((order, ctx) => {
    if (order.orderType === "dine-in" && order.tableNumber === undefined) {
      ctx.addIssue({
        code: "custom",
        path: ["tableNumber"],
        message: "Table number is required for dine-in orders",
      });
    }
  });
