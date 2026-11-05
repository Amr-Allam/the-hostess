import { env } from "../config/env.js";
import Reservation from "../models/Reservation.js";
import Table from "../models/Table.js";
import { httpError } from "../utils/httpError.js";
import {
  nowMinutes,
  toMinutes,
  toTimeString,
  todayInTimezone,
  weekdayName,
} from "../utils/time.js";
import { generateSlots, listSlots, pickTable } from "./availability.js";
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

function badRequest(path, message) {
  return httpError(400, message, [{ path, message }]);
}

export async function createReservation(body) {
  const { name, phone, partySize, date, startTime } = body;
  const today = todayInTimezone(env.TIMEZONE);
  if (date < today) throw badRequest("body.date", "Date is in the past");

  const settings = await getSettings();
  const dayHours = settings.openingHours[weekdayName(date)];
  if (dayHours.closed) {
    throw badRequest("body.date", "The restaurant is closed on this day");
  }

  // Only generated slots can be booked (inside opening hours, on the slot grid).
  const durationMinutes = settings.reservationDurationMinutes;
  const start = toMinutes(startTime);
  const slots = generateSlots(
    dayHours,
    settings.slotLengthMinutes,
    durationMinutes,
  );
  if (!slots.includes(start)) {
    throw badRequest("body.startTime", "This time cannot be booked");
  }
  if (date === today && start <= nowMinutes(env.TIMEZONE)) {
    throw badRequest("body.startTime", "This time has already passed");
  }

  // Re-check availability right before inserting, as SPEC requires.
  const end = start + durationMinutes;
  const [tables, reservations] = await Promise.all([
    Table.find().lean(),
    Reservation.find({ date, status: "confirmed" }).lean(),
  ]);
  const table = pickTable(tables, reservations, partySize, start, end);
  if (!table) {
    const fitsSomewhere = tables.some((t) => t.capacity >= partySize);
    throw httpError(
      409,
      fitsSomewhere
        ? "No table is free at this time"
        : "No table is large enough for this party",
    );
  }

  const reservation = await Reservation.create({
    name,
    phone,
    partySize,
    date,
    startTime,
    endTime: toTimeString(end),
    startMinutes: start,
    endMinutes: end,
    table: table._id,
  });

  return {
    ...reservation.toObject(),
    table: { _id: table._id, number: table.number },
  };
}
