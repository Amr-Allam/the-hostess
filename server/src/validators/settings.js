import { z } from "zod";

const time = z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, "Use HH:mm");

const dayHoursSchema = z
  .object({
    open: time,
    close: time,
    closed: z.boolean().default(false),
  })
  .superRefine((day, ctx) => {
    // Same-length "HH:mm" strings compare correctly as text. No overnight hours.
    if (!day.closed && day.open >= day.close) {
      ctx.addIssue({
        code: "custom",
        path: ["close"],
        message: "Closing time must be after opening time",
      });
    }
  });

const minutes = z.number().int().min(1).max(1440);

export const settingsBodySchema = z.object({
  openingHours: z.object({
    monday: dayHoursSchema,
    tuesday: dayHoursSchema,
    wednesday: dayHoursSchema,
    thursday: dayHoursSchema,
    friday: dayHoursSchema,
    saturday: dayHoursSchema,
    sunday: dayHoursSchema,
  }),
  slotLengthMinutes: minutes,
  reservationDurationMinutes: minutes,
});
