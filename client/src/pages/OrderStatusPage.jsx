import { Link, useParams } from "react-router";
import {
  FINAL_STATUSES,
  useLiveOrder,
} from "../features/orders/useLiveOrder.js";
import { formatPrice, formatPriceDelta } from "../lib/format.js";

const STEPS = ["placed", "preparing", "ready", "served"];

function OrderStatus({ id }) {
  const { order, error, notFound, connectionLost } = useLiveOrder(id);

  if (notFound) {
    return (
      <div className="space-y-2">
        <h1 className="text-xl font-semibold">Order not found</h1>
        <Link to="/" className="text-amber-700 underline">
          Back to the menu
        </Link>
      </div>
    );
  }
  if (!order) {
    return error ? (
      <p className="text-red-600">Could not load the order: {error}</p>
    ) : (
      <p className="text-stone-500">Loading order…</p>
    );
  }

  const stepIndex = STEPS.indexOf(order.status);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold">Order status</h1>
        <p className="text-sm text-stone-500">
          {order.orderType === "dine-in"
            ? `Dine-in · Table ${order.tableNumber}`
            : "Takeaway"}
        </p>
      </div>

      {order.status === "cancelled" ? (
        <p className="rounded bg-red-50 p-3 font-medium text-red-700">
          This order was cancelled.
        </p>
      ) : (
        <ol className="flex gap-2">
          {STEPS.map((step, i) => (
            <li
              key={step}
              className={`flex-1 rounded p-2 text-center text-sm capitalize ${
                i <= stepIndex
                  ? "bg-amber-600 text-white"
                  : "bg-stone-200 text-stone-500"
              }`}
            >
              {step}
            </li>
          ))}
        </ol>
      )}

      {connectionLost && !FINAL_STATUSES.includes(order.status) && (
        <p className="text-sm text-red-600">
          Connection problem, reconnecting… the status may be out of date.
        </p>
      )}

      <ul className="space-y-2">
        {order.items.map((item, i) => (
          <li
            key={i}
            className="flex justify-between gap-3 rounded-lg border border-stone-200 bg-white p-3"
          >
            <div>
              <p className="font-medium">
                {item.quantity} × {item.name}
              </p>
              {item.selectedOptions.map((o) => (
                <p
                  key={`${o.groupName}-${o.choiceName}`}
                  className="text-sm text-stone-500"
                >
                  {o.groupName}: {o.choiceName} {formatPriceDelta(o.priceDelta)}
                </p>
              ))}
            </div>
            <p className="font-semibold">
              {formatPrice(item.unitPrice * item.quantity)}
            </p>
          </li>
        ))}
      </ul>

      {order.customerNote && (
        <p className="text-sm text-stone-600">Note: {order.customerNote}</p>
      )}

      <p className="border-t border-stone-200 pt-4 text-right font-semibold">
        Total {formatPrice(order.total)}
      </p>
    </div>
  );
}

// key={id} resets all state when the URL changes to a different order.
export default function OrderStatusPage() {
  const { id } = useParams();
  return <OrderStatus key={id} id={id} />;
}
