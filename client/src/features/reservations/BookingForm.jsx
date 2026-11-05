import { useEffect, useState } from "react";
import { createReservation, getAvailability } from "../../api/reservations.js";

const MAX_PARTY_SIZE = 100; // matches the server limit

// Today's date in the browser's local time as YYYY-MM-DD (not toISOString, which is UTC).
function todayLocal() {
  const now = new Date();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${now.getFullYear()}-${month}-${day}`;
}

const inputClass = "mt-1 w-full rounded border border-stone-300 px-3 py-2";

export default function BookingForm({ onBooked }) {
  const [date, setDate] = useState("");
  const [partySizeInput, setPartySizeInput] = useState("2");
  const [selected, setSelected] = useState(null);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [errors, setErrors] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  // Bumped after a failed booking so the slot list is fetched again.
  const [refresh, setRefresh] = useState(0);
  // { key, slots, error } for the most recent availability request.
  const [result, setResult] = useState(null);

  const partySize = Number(partySizeInput);
  const partySizeValid =
    Number.isInteger(partySize) &&
    partySize >= 1 &&
    partySize <= MAX_PARTY_SIZE;
  const key = date && partySizeValid ? `${date}|${partySize}|${refresh}` : null;

  useEffect(() => {
    if (!key) return;
    let cancelled = false;
    getAvailability(date, partySize)
      .then((slots) => {
        if (!cancelled) setResult({ key, slots, error: "" });
      })
      .catch((err) => {
        if (!cancelled) setResult({ key, slots: null, error: err.message });
      });
    return () => {
      cancelled = true;
    };
  }, [key, date, partySize]);

  const current = key && result?.key === key ? result : null;
  const loading = Boolean(key) && !current;
  const slots = current?.slots ?? null;

  // A selection only counts while that slot is still offered for this date and party.
  const chosen = slots?.some((s) => s.startTime === selected && s.available)
    ? selected
    : null;

  async function handleSubmit(e) {
    e.preventDefault();
    setErrors([]);
    setSubmitting(true);
    try {
      const reservation = await createReservation({
        name,
        phone,
        partySize,
        date,
        startTime: chosen,
      });
      onBooked(reservation);
    } catch (err) {
      setErrors(
        err.details?.length ? err.details.map((d) => d.message) : [err.message],
      );
      // The slot may have just been taken: show the up-to-date list.
      if (err.status === 409) setRefresh((n) => n + 1);
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block text-sm">
          Date
          <input
            type="date"
            required
            min={todayLocal()}
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className={inputClass}
          />
        </label>
        <label className="block text-sm">
          Party size
          <input
            type="number"
            required
            min="1"
            max={MAX_PARTY_SIZE}
            step="1"
            value={partySizeInput}
            onChange={(e) => setPartySizeInput(e.target.value)}
            className={inputClass}
          />
        </label>
      </div>

      {key && (
        <fieldset className="space-y-2">
          <legend className="text-sm font-medium">Time</legend>
          {loading && <p className="text-stone-500">Loading times…</p>}
          {current?.error && (
            <p className="text-red-600">
              Could not load times: {current.error}
            </p>
          )}
          {slots?.length === 0 && (
            <p className="text-stone-500">
              The restaurant is closed on this day.
            </p>
          )}
          {slots?.length > 0 && !slots.some((s) => s.available) && (
            <p className="text-stone-500">
              No tables are available on this day for this party size.
            </p>
          )}
          {slots?.length > 0 && (
            <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
              {slots.map((slot) => (
                <button
                  key={slot.startTime}
                  type="button"
                  disabled={!slot.available}
                  aria-pressed={chosen === slot.startTime}
                  onClick={() => setSelected(slot.startTime)}
                  className={`rounded border px-2 py-2 text-sm ${
                    chosen === slot.startTime
                      ? "border-amber-600 bg-amber-600 text-white"
                      : slot.available
                        ? "border-stone-300 bg-white hover:border-amber-400"
                        : "cursor-not-allowed border-stone-200 bg-stone-100 text-stone-400 line-through"
                  }`}
                >
                  {slot.startTime}
                </button>
              ))}
            </div>
          )}
        </fieldset>
      )}

      {chosen && (
        <div className="space-y-4">
          <label className="block text-sm">
            Name
            <input
              type="text"
              required
              maxLength={100}
              autoComplete="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className={inputClass}
            />
          </label>
          <label className="block text-sm">
            Phone
            <input
              type="tel"
              required
              maxLength={20}
              autoComplete="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className={inputClass}
            />
          </label>
        </div>
      )}

      {errors.length > 0 && (
        <ul className="space-y-1 text-sm text-red-600">
          {errors.map((message) => (
            <li key={message}>{message}</li>
          ))}
        </ul>
      )}

      <button
        type="submit"
        disabled={!chosen || submitting}
        className="w-full rounded bg-stone-800 px-5 py-2 text-white disabled:opacity-60"
      >
        {submitting ? "Booking…" : "Reserve table"}
      </button>
    </form>
  );
}
