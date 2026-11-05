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

// Owner list: one date, or everything from today onward. Cancelled ones included.
export function listReservations({ date }) {
  const filter = date
    ? { date }
    : { date: { $gte: todayInTimezone(env.TIMEZONE) } };
  return Reservation.find(filter)
    .sort({ date: 1, startMinutes: 1, _id: 1 })
    .populate("table", "number")
    .lean();
}

export async function cancelReservation(id) {
  // One atomic update filtered on "confirmed", so two simultaneous cancels
  // cannot both succeed.
  const reservation = await Reservation.findOneAndUpdate(
    { _id: id, status: "confirmed" },
    { status: "cancelled" },
    { returnDocument: "after", runValidators: true },
  ).populate("table", "number");

  if (reservation) return reservation;
  if (await Reservation.exists({ _id: id })) {
    throw httpError(409, "Reservation is already cancelled");
  }
  throw httpError(404, "Reservation not found");
}
