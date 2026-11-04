import { env } from "../config/env.js";
import Reservation from "../models/Reservation.js";
import Table from "../models/Table.js";
import { httpError } from "../utils/httpError.js";
import { nowMinutes, todayInTimezone, weekdayName } from "../utils/time.js";
import { listSlots } from "./availability.js";
import { getSettings } from "./settings.js";

export async function getAvailability({ date, partySize }) {
  const today = todayInTimezone(env.TIMEZONE);
  if (date < today) {
    throw httpError(400, "Date is in the past", [
      { path: "query.date", message: "Date is in the past" },
    ]);
  }

  const settings = await getSettings();
  const dayHours = settings.openingHours[weekdayName(date)];

  const [tables, reservations] = await Promise.all([
    Table.find().lean(),
    Reservation.find({ date, status: "confirmed" }).lean(),
  ]);

  return listSlots({
    dayHours,
    slotLengthMinutes: settings.slotLengthMinutes,
    durationMinutes: settings.reservationDurationMinutes,
    tables,
    reservations,
    partySize,
    nowMinutes: date === today ? nowMinutes(env.TIMEZONE) : null,
  });
}
