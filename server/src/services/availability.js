import { toMinutes, toTimeString } from "../utils/time.js";

// Pure functions: no database access, so they are easy to unit test (Phase 7).

// Start times (minutes from midnight) offered on a day. A slot is offered only if start + reservation duration fits before closing time.
// dayHours: { open, close, closed } as "HH:mm" strings.
export function generateSlots(dayHours, slotLengthMinutes, durationMinutes) {
  if (!dayHours || dayHours.closed) return [];
  const open = toMinutes(dayHours.open);
  const close = toMinutes(dayHours.close);
  const slots = [];
  for (
    let start = open;
    start + durationMinutes <= close;
    start += slotLengthMinutes
  ) {
    slots.push(start);
  }
  return slots;
}

// The smallest table that fits the party and has no overlapping reservation, or null.
// tables: { _id, number, capacity }. reservations: confirmed ones for that date,
// each { table, startMinutes, endMinutes }.
export function pickTable(tables, reservations, partySize, start, end) {
  const candidates = tables
    .filter((t) => t.capacity >= partySize)
    .sort((a, b) => a.capacity - b.capacity || a.number - b.number);

  return (
    candidates.find(
      (table) =>
        !reservations.some(
          (r) =>
            String(r.table) === String(table._id) &&
            r.startMinutes < end &&
            r.endMinutes > start,
        ),
    ) ?? null
  );
}

// Slots for the availability endpoint: [{ startTime, available }].
// nowMinutes is the current time in minutes when the date is today, else null:
// slots that have already started are not available.
export function listSlots({
  dayHours,
  slotLengthMinutes,
  durationMinutes,
  tables,
  reservations,
  partySize,
  nowMinutes = null,
}) {
  return generateSlots(dayHours, slotLengthMinutes, durationMinutes).map(
    (start) => {
      const isPast = nowMinutes !== null && start <= nowMinutes;
      const table = isPast
        ? null
        : pickTable(
            tables,
            reservations,
            partySize,
            start,
            start + durationMinutes,
          );
      return { startTime: toTimeString(start), available: table !== null };
    },
  );
}
