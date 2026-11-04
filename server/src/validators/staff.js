import { z } from "zod";

export const activeOrdersQuerySchema = z.object({
  status: z.literal("active"),
});

export const updateOrderStatusBodySchema = z.object({
  status: z.enum(["placed", "preparing", "ready", "served", "cancelled"]),
});
