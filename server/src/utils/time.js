const WEEKDAYS = [
  "sunday",
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
];

// "HH:mm" -> minutes from midnight.
export function toMinutes(time) {
  const [hours, minutes] = time.split(":").map(Number);
  return hours * 60 + minutes;
}

// Minutes from midnight -> "HH:mm".
export function toTimeString(minutes) {
  const hh = String(Math.floor(minutes / 60)).padStart(2, "0");
  const mm = String(minutes % 60).padStart(2, "0");
  return `${hh}:${mm}`;
}

// True for a real calendar date written as "YYYY-MM-DD" (rejects 2026-02-30).
export function isValidDate(date) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return false;
  const parsed = new Date(`${date}T00:00:00Z`);
  return (
    !Number.isNaN(parsed.getTime()) &&
    parsed.toISOString().slice(0, 10) === date
  );
}

// Lowercase weekday name ("monday") of a "YYYY-MM-DD" string. Reservation dates are plain local dates, so no timezone conversion is involved.
export function weekdayName(date) {
  return WEEKDAYS[new Date(`${date}T00:00:00Z`).getUTCDay()];
}

function localParts(timeZone, now) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(now);
  return Object.fromEntries(parts.map((p) => [p.type, p.value]));
}

// Today's date ("YYYY-MM-DD") in the restaurant's timezone.
export function todayInTimezone(timeZone, now = new Date()) {
  const p = localParts(timeZone, now);
  return `${p.year}-${p.month}-${p.day}`;
}

// Current time in the restaurant's timezone, as minutes from midnight.
export function nowMinutes(timeZone, now = new Date()) {
  const p = localParts(timeZone, now);
  return Number(p.hour) * 60 + Number(p.minute);
}

const DAY_MS = 24 * 60 * 60 * 1000;

// Number of calendar days from `from` to `to`, both included ("YYYY-MM-DD", from <= to).
export function dayCount(from, to) {
  return (
    Math.round(
      (Date.parse(`${to}T00:00:00Z`) - Date.parse(`${from}T00:00:00Z`)) /
        DAY_MS,
    ) + 1
  );
}

// Every date from `from` to `to`, both included, as "YYYY-MM-DD" strings.
export function eachDate(from, to) {
  const start = Date.parse(`${from}T00:00:00Z`);
  return Array.from({ length: dayCount(from, to) }, (_, i) =>
    new Date(start + i * DAY_MS).toISOString().slice(0, 10),
  );
}
