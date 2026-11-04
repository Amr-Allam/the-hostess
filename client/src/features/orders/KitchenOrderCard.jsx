import { useState } from "react";

const STATUS_STYLE = {
  placed: "bg-amber-100 text-amber-800",
  preparing: "bg-blue-100 text-blue-800",
  ready: "bg-green-100 text-green-800",
};

// The one forward step for each active status.
const NEXT_STEP = {
  placed: { status: "preparing", label: "Start preparing" },
  preparing: { status: "ready", label: "Mark ready" },
  ready: { status: "served", label: "Mark served" },
};

const CAN_CANCEL = ["placed", "preparing"];

function formatAge(createdAt, now) {
  const minutes = Math.max(
    0,
    Math.floor((now - Date.parse(createdAt)) / 60000),
  );
  if (minutes < 1) return "Just now";
  if (minutes < 60) return `${minutes} min ago`;
  return `${Math.floor(minutes / 60)} h ${minutes % 60} min ago`;
}

export default function KitchenOrderCard({ order, now, onChangeStatus }) {
  const [busy, setBusy] = useState(false);
  const [actionError, setActionError] = useState("");
  const next = NEXT_STEP[order.status];

  async function run(status) {
    setBusy(true);
    setActionError("");
    try {
      await onChangeStatus(order._id, status);
    } catch (err) {
      setActionError(err.message);
    } finally {
      setBusy(false);
    }
  }

  function handleCancel() {
    if (window.confirm("Cancel this order?")) run("cancelled");
  }

  return (
    <li className="space-y-3 rounded-lg border border-stone-200 bg-white p-4">
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="font-semibold">
            {order.orderType === "dine-in"
              ? `Table ${order.tableNumber}`
              : "Takeaway"}
          </p>
          <p className="text-sm text-stone-500">
            {formatAge(order.createdAt, now)}
          </p>
        </div>
        <span
          className={`rounded px-2 py-1 text-xs font-medium capitalize ${STATUS_STYLE[order.status]}`}
        >
          {order.status}
        </span>
      </div>

      <ul className="space-y-2">
        {order.items.map((item, i) => (
          <li key={i}>
            <p className="font-medium">
              {item.quantity} × {item.name}
            </p>
            {item.selectedOptions.map((o) => (
              <p
                key={`${o.groupName}-${o.choiceName}`}
                className="text-sm text-stone-500"
              >
                {o.groupName}: {o.choiceName}
              </p>
            ))}
            {item.note && (
              <p className="text-sm text-stone-600">Note: {item.note}</p>
            )}
          </li>
        ))}
      </ul>

      {order.customerNote && (
        <p className="rounded bg-amber-50 p-2 text-sm text-stone-700">
          Note: {order.customerNote}
        </p>
      )}

      {actionError && <p className="text-sm text-red-600">{actionError}</p>}

      <div className="flex gap-2">
        <button
          type="button"
          disabled={busy}
          onClick={() => run(next.status)}
          className="flex-1 rounded bg-stone-800 px-3 py-2 text-white disabled:opacity-60"
        >
          {next.label}
        </button>
        {CAN_CANCEL.includes(order.status) && (
          <button
            type="button"
            disabled={busy}
            onClick={handleCancel}
            className="rounded border border-red-300 px-3 py-2 text-red-600 disabled:opacity-60"
          >
            Cancel
          </button>
        )}
      </div>
    </li>
  );
}
