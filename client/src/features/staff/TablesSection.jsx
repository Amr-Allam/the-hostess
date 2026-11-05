import { useEffect, useState } from "react";
import { errorMessage } from "../../api/client.js";
import {
  createTable,
  deleteTable,
  listTables,
  updateTable,
} from "../../api/owner.js";
import { useAuth } from "./useAuth.js";

const inputClass = "mt-1 w-full rounded border border-stone-300 px-3 py-2";

function parsePositiveInt(value) {
  if (!/^\d+$/.test(String(value).trim())) return null;
  const number = Number(value);
  return number >= 1 ? number : null;
}

const emptyForm = { number: "", capacity: "" };

export default function TablesSection() {
  const { token } = useAuth();
  const [tables, setTables] = useState(null);
  const [error, setError] = useState("");
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const [saving, setSaving] = useState(false);

  function load() {
    return listTables(token)
      .then((rows) => {
        setTables(rows);
        setError("");
      })
      .catch((err) => {
        setTables(null);
        setError(errorMessage(err));
      });
  }

  useEffect(() => {
    let cancelled = false;
    listTables(token)
      .then((rows) => {
        if (!cancelled) {
          setTables(rows);
          setError("");
        }
      })
      .catch((err) => {
        if (!cancelled) {
          setTables(null);
          setError(errorMessage(err));
        }
      });
    return () => {
      cancelled = true;
    };
  }, [token]);

  function startEdit(table) {
    setEditingId(table._id);
    setForm({ number: String(table.number), capacity: String(table.capacity) });
    setError("");
  }

  function cancelEdit() {
    setEditingId(null);
    setForm(emptyForm);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    const number = parsePositiveInt(form.number);
    const capacity = parsePositiveInt(form.capacity);
    if (number === null || capacity === null) {
      setError("Table number and seats must be whole numbers of at least 1.");
      return;
    }
    setSaving(true);
    setError("");
    try {
      if (editingId) await updateTable(token, editingId, { number, capacity });
      else await createTable(token, { number, capacity });
      cancelEdit();
      await load();
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(table) {
    if (!window.confirm(`Delete table ${table.number}?`)) return;
    setError("");
    try {
      await deleteTable(token, table._id);
      if (editingId === table._id) cancelEdit();
      await load();
    } catch (err) {
      setError(errorMessage(err));
    }
  }

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold">Tables</h2>
      {error && <p className="text-sm text-red-600">{error}</p>}

      <form
        onSubmit={handleSubmit}
        className="grid max-w-md gap-3 rounded border border-stone-200 p-4 sm:grid-cols-2"
      >
        <label className="text-sm">
          Table number
          <input
            required
            inputMode="numeric"
            value={form.number}
            onChange={(e) => setForm({ ...form, number: e.target.value })}
            className={inputClass}
          />
        </label>
        <label className="text-sm">
          Seats
          <input
            required
            inputMode="numeric"
            value={form.capacity}
            onChange={(e) => setForm({ ...form, capacity: e.target.value })}
            className={inputClass}
          />
        </label>
        <div className="flex gap-2 sm:col-span-2">
          <button
            type="submit"
            disabled={saving}
            className="rounded bg-stone-800 px-3 py-2 text-sm text-white disabled:opacity-60"
          >
            {saving ? "Saving…" : editingId ? "Save table" : "Add table"}
          </button>
          {editingId && (
            <button
              type="button"
              onClick={cancelEdit}
              className="rounded border border-stone-300 px-3 py-2 text-sm"
            >
              Cancel
            </button>
          )}
        </div>
      </form>

      {tables === null ? (
        !error && <p className="text-stone-500">Loading tables…</p>
      ) : tables.length === 0 ? (
        <p className="text-stone-500">No tables yet.</p>
      ) : (
        <ul className="divide-y divide-stone-200 rounded border border-stone-200">
          {tables.map((table) => (
            <li
              key={table._id}
              className="flex items-center justify-between gap-3 p-3"
            >
              <p>
                Table {table.number}{" "}
                <span className="text-stone-500">
                  {table.capacity} {table.capacity === 1 ? "seat" : "seats"}
                </span>
              </p>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => startEdit(table)}
                  className="text-sm text-amber-800"
                >
                  Edit
                </button>
                <button
                  type="button"
                  onClick={() => handleDelete(table)}
                  className="text-sm text-red-700"
                >
                  Delete
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
