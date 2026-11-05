import { useEffect, useState } from "react";
import { errorMessage } from "../../api/client.js";
import { getSettings, updateSettings } from "../../api/owner.js";
import { useAuth } from "./useAuth.js";

const DAYS = [
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
  "sunday",
];

const inputClass = "rounded border border-stone-300 px-3 py-2";

function dayLabel(day) {
  return day.charAt(0).toUpperCase() + day.slice(1);
}

function toForm(settings) {
  const openingHours = {};
  for (const day of DAYS) {
    const hours = settings.openingHours[day];
    openingHours[day] = {
      open: hours.open,
      close: hours.close,
      closed: hours.closed,
    };
  }
  return {
    openingHours,
    slotLengthMinutes: String(settings.slotLengthMinutes),
    reservationDurationMinutes: String(settings.reservationDurationMinutes),
  };
}

function parseMinutes(value) {
  if (!/^\d+$/.test(String(value).trim())) return null;
  const minutes = Number(value);
  return minutes >= 1 && minutes <= 1440 ? minutes : null;
}

export default function SettingsSection() {
  const { token } = useAuth();
  const [form, setForm] = useState(null);
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let cancelled = false;
    getSettings(token)
      .then((settings) => {
        if (!cancelled) {
          setForm(toForm(settings));
          setError("");
        }
      })
      .catch((err) => {
        if (!cancelled) setError(errorMessage(err));
      });
    return () => {
      cancelled = true;
    };
  }, [token]);

  function updateDay(day, patch) {
    setSaved(false);
    setForm((current) => ({
      ...current,
      openingHours: {
        ...current.openingHours,
        [day]: { ...current.openingHours[day], ...patch },
      },
    }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    const slotLengthMinutes = parseMinutes(form.slotLengthMinutes);
    const reservationDurationMinutes = parseMinutes(
      form.reservationDurationMinutes,
    );
    if (slotLengthMinutes === null || reservationDurationMinutes === null) {
      setError("Slot length and reservation length must be whole minutes from 1 to 1440.");
      setSaved(false);
      return;
    }
    for (const day of DAYS) {
      const hours = form.openingHours[day];
      if (!hours.closed && hours.open >= hours.close) {
        setError(`${dayLabel(day)} must close after it opens.`);
        setSaved(false);
        return;
      }
    }

    setSaving(true);
    setError("");
    setSaved(false);
    try {
      const savedSettings = await updateSettings(token, {
        openingHours: form.openingHours,
        slotLengthMinutes,
        reservationDurationMinutes,
      });
      setForm(toForm(savedSettings));
      setSaved(true);
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setSaving(false);
    }
  }

  if (!form) {
    return (
      <div className="space-y-4">
        <h2 className="text-lg font-semibold">Settings</h2>
        {error ? (
          <p className="text-sm text-red-600">{error}</p>
        ) : (
          <p className="text-stone-500">Loading settings…</p>
        )}
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <h2 className="text-lg font-semibold">Settings</h2>
      {error && <p className="text-sm text-red-600">{error}</p>}
      {saved && <p className="text-sm text-green-700">Saved.</p>}

      <div className="space-y-2">
        {DAYS.map((day) => {
          const hours = form.openingHours[day];
          return (
            <div
              key={day}
              className="flex flex-wrap items-center gap-3 rounded border border-stone-200 p-3"
            >
              <span className="w-24 text-sm font-medium">{dayLabel(day)}</span>
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={hours.closed}
                  onChange={(e) => updateDay(day, { closed: e.target.checked })}
                />
                Closed
              </label>
              <label className="text-sm">
                Open
                <input
                  type="time"
                  required
                  disabled={hours.closed}
                  value={hours.open}
                  onChange={(e) => updateDay(day, { open: e.target.value })}
                  className={`ml-2 ${inputClass} disabled:bg-stone-100`}
                />
              </label>
              <label className="text-sm">
                Close
                <input
                  type="time"
                  required
                  disabled={hours.closed}
                  value={hours.close}
                  onChange={(e) => updateDay(day, { close: e.target.value })}
                  className={`ml-2 ${inputClass} disabled:bg-stone-100`}
                />
              </label>
            </div>
          );
        })}
      </div>

      <div className="grid max-w-md gap-3 sm:grid-cols-2">
        <label className="text-sm">
          Slot length (minutes)
          <input
            required
            inputMode="numeric"
            value={form.slotLengthMinutes}
            onChange={(e) => {
              setSaved(false);
              setForm({ ...form, slotLengthMinutes: e.target.value });
            }}
            className={`mt-1 block w-full ${inputClass}`}
          />
        </label>
        <label className="text-sm">
          Reservation length (minutes)
          <input
            required
            inputMode="numeric"
            value={form.reservationDurationMinutes}
            onChange={(e) => {
              setSaved(false);
              setForm({ ...form, reservationDurationMinutes: e.target.value });
            }}
            className={`mt-1 block w-full ${inputClass}`}
          />
        </label>
      </div>

      <button
        type="submit"
        disabled={saving}
        className="rounded bg-stone-800 px-3 py-2 text-sm text-white disabled:opacity-60"
      >
        {saving ? "Saving…" : "Save settings"}
      </button>
    </form>
  );
}
