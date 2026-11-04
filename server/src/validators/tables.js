import { z } from "zod";

export const tableBodySchema = z.object({
  number: z.number().int().min(1),
  capacity: z.number().int().min(1),
});
