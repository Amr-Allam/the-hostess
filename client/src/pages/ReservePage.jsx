import { useState } from "react";
import BookingForm from "../features/reservations/BookingForm.jsx";

// "2030-01-07" -> "Monday, 7 January 2030". Parsed as a local date to avoid timezone shifts.
function formatDate(date) {
  return new Date(`${date}T00:00:00`).toLocaleDateString("en-GB", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function Confirmation({ reservation, onReset }) {
  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold">Reservation confirmed</h1>
      <dl className="space-y-2 rounded-lg border border-stone-200 bg-white p-4 text-sm">
        <div className="flex justify-between gap-3">
          <dt className="text-stone-500">Name</dt>
          <dd>{reservation.name}</dd>
        </div>
        <div className="flex justify-between gap-3">
          <dt className="text-stone-500">Date</dt>
          <dd>{formatDate(reservation.date)}</dd>
        </div>
        <div className="flex justify-between gap-3">
          <dt className="text-stone-500">Time</dt>
          <dd>
            {reservation.startTime} – {reservation.endTime}
          </dd>
        </div>
        <div className="flex justify-between gap-3">
          <dt className="text-stone-500">Party size</dt>
          <dd>{reservation.partySize}</dd>
        </div>
        <div className="flex justify-between gap-3">
          <dt className="text-stone-500">Table</dt>
          <dd>{reservation.table.number}</dd>
        </div>
      </dl>
      <p className="text-sm text-stone-500">
        To change or cancel your reservation, please contact the restaurant.
      </p>
      <button
        type="button"
        onClick={onReset}
        className="text-amber-700 underline"
      >
        Make another reservation
      </button>
    </div>
  );
}

export default function ReservePage() {
  const [reservation, setReservation] = useState(null);

  if (reservation) {
    return (
      <Confirmation
        reservation={reservation}
        onReset={() => setReservation(null)}
      />
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-semibold">Reserve a table</h1>
      <BookingForm onBooked={setReservation} />
    </div>
  );
}
