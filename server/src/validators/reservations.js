import { z } from "zod";
import { isValidDate } from "../utils/time.js";

const date = z.string().refine(isValidDate, "Use a real date as YYYY-MM-DD");

export const availabilityQuerySchema = z.object({
  date,
  partySize: z.coerce.number().int().min(1).max(100),
});
