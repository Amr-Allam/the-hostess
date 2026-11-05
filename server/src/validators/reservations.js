import { z } from "zod";
import { isValidDate } from "../utils/time.js";

const TIME = /^([01]\d|2[0-3]):[0-5]\d$/;

const date = z.string().refine(isValidDate, "Use a real date as YYYY-MM-DD");

export const availabilityQuerySchema = z.object({
  date,
  partySize: z.coerce.number().int().min(1).max(100),
});

export const createReservationBodySchema = z.object({
  name: z.string().trim().min(1).max(100),
  // Lenient on purpose: Egyptian and international formats vary.
  phone: z
    .string()
    .trim()
    .regex(/^[0-9+\-()\s]{8,20}$/, "Enter a valid phone number"),
  partySize: z.number().int().min(1).max(100),
  date,
  startTime: z.string().regex(TIME, "Use HH:mm"),
});
