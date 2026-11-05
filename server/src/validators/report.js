import { z } from "zod";
import { dayCount, isValidDate } from "../utils/time.js";

export const MAX_REPORT_DAYS = 366;

const date = z.string().refine(isValidDate, "Use a real date as YYYY-MM-DD");

export const reportRangeQuerySchema = z
  .object({ from: date, to: date })
  .superRefine((range, ctx) => {
    const days = dayCount(range.from, range.to);
    if (days < 1) {
      ctx.addIssue({
        code: "custom",
        path: ["to"],
        message: "`to` must not be before `from`",
      });
    } else if (days > MAX_REPORT_DAYS) {
      ctx.addIssue({
        code: "custom",
        path: ["to"],
        message: `The range cannot be longer than ${MAX_REPORT_DAYS} days`,
      });
    }
  });
