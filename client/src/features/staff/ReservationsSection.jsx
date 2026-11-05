import { useEffect, useState } from "react";
import { errorMessage } from "../../api/client.js";
import { cancelReservation, listReservations } from "../../api/owner.js";
import { useAuth } from "./useAuth.js";

const inputClass = "mt-1 block rounded border border-stone-300 px-3 py-2";

export default function ReservationsSection() {
  const { token } = useAuth();
  const [date, setDate] = useState("");
  const [applied, setApplied] = useState("");
  const [reservations, setReservations] = useState(null);
  const [error, setError] = useState("");
  const [cancellingId, setCancellingId] = useState("");

  useEffect(() => {
    let cancelled = false;
    listReservations(token, applied)
      .then((rows) => {
        if (cancelled) return;
        setReservations(rows);
        setError("");
      })
      .catch((err) => {
        if (cancelled) return;
        setReservations(null);
        setError(errorMessage(err));
      });
    return () => {
      cancelled = true;
    };
  }, [token, applied]);

  async function handleCancel(id) {
    if (!window.confirm("Cancel this reservation?")) return;
    setCancellingId(id);
    setError("");
    try {
      const updated = await cancelReservation(token, id);
      setReservations((rows) =>
        rows.map((row) => (row._id === id ? updated : row)),
      );
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setCancellingId("");
    }
  }

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold">Reservations</h2>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          setApplied(date);
        }}
        className="flex flex-wrap items-end gap-3"
      >
        <label className="text-sm">
          Date
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className={inputClass}
          />
        </label>
        <button
          type="submit"
          className="rounded bg-stone-800 px-3 py-2 text-sm text-white"
        >
          Show
        </button>
        <button
          type="button"
          onClick={() => {
            setDate("");
            setApplied("");
          }}
          className="rounded border border-stone-300 px-3 py-2 text-sm"
        >
          Upcoming
        </button>
      </form>

      <p className="text-sm text-stone-500">
        {applied ? `Reservations on ${applied}.` : "Reservations from today onward."}
      </p>
      {error && <p className="text-sm text-red-600">{error}</p>}

      {reservations === null ? (
        !error && <p className="text-stone-500">Loading reservations…</p>
      ) : reservations.length === 0 ? (
        <p className="text-stone-500">No reservations.</p>
      ) : (
        <ul className="divide-y divide-stone-200 rounded border border-stone-200">
          {reservations.map((reservation) => (
            <li
              key={reservation._id}
              className="flex flex-wrap items-center justify-between gap-3 p-3"
            >
              <div>
                <p className="font-medium">
                  {reservation.name}{" "}
                  <span className="font-normal text-stone-500">
                    {reservation.phone}
                  </span>
                </p>
                <p className="text-sm text-stone-600">
                  {reservation.date} {reservation.startTime}–{reservation.endTime}
                  {" · "}
                  {reservation.partySize}{" "}
                  {reservation.partySize === 1 ? "guest" : "guests"}
                  {" · table "}
                  {reservation.table?.number ?? "—"}
                  {" · "}
                  {reservation.status}
                </p>
              </div>
              {reservation.status === "confirmed" && (
                <button
                  type="button"
                  disabled={cancellingId === reservation._id}
                  onClick={() => handleCancel(reservation._id)}
                  className="rounded border border-red-300 px-3 py-1.5 text-sm text-red-700 disabled:opacity-60"
                >
                  {cancellingId === reservation._id ? "Cancelling…" : "Cancel"}
                </button>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
