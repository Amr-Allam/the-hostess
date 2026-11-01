import { useState } from "react";
import { Link, useNavigate } from "react-router";
import { createOrder } from "../api/orders.js";
import { formatPrice, formatPriceDelta } from "../lib/format.js";
import { setLastOrderId } from "../lib/lastOrder.js";
import { MAX_QUANTITY, useCartStore } from "../store/cartStore.js";

export default function CartPage() {
  const navigate = useNavigate();
  const lines = useCartStore((s) => s.lines);
  const setQuantity = useCartStore((s) => s.setQuantity);
  const removeLine = useCartStore((s) => s.removeLine);
  const clear = useCartStore((s) => s.clear);

  const [orderType, setOrderType] = useState("dine-in");
  const [tableNumber, setTableNumber] = useState("");
  const [customerNote, setCustomerNote] = useState("");
  const [errors, setErrors] = useState([]);
  const [submitting, setSubmitting] = useState(false);

  // Display estimate only; the server calculates the real total.
  const total = lines.reduce((sum, l) => sum + l.unitPrice * l.quantity, 0);

  if (lines.length === 0) {
    return (
      <div className="space-y-2">
        <h1 className="text-xl font-semibold">Cart</h1>
        <p className="text-stone-500">Your cart is empty.</p>
        <Link to="/" className="text-amber-700 underline">
          Browse the menu
        </Link>
      </div>
    );
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setErrors([]);
    setSubmitting(true);
    try {
      const order = await createOrder({
        orderType,
        ...(orderType === "dine-in" && { tableNumber: Number(tableNumber) }),
        customerNote,
        items: lines.map((l) => ({
          menuItemId: l.menuItemId,
          quantity: l.quantity,
          selectedOptions: l.selectedOptions.map(
            ({ groupName, choiceName }) => ({ groupName, choiceName }),
          ),
        })),
      });
      clear();
      setLastOrderId(order._id);
      navigate(`/order/${order._id}`, { replace: true });
    } catch (err) {
      const messages = err.details?.length
        ? err.details.map((d) => d.message)
        : [err.message];
      setErrors(messages);
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <h1 className="text-xl font-semibold">Cart</h1>

      <ul className="space-y-3">
        {lines.map((line) => (
          <li
            key={line.key}
            className="rounded-lg border border-stone-200 bg-white p-3"
          >
            <div className="flex justify-between gap-3">
              <div>
                <p className="font-medium">{line.name}</p>
                {line.selectedOptions.map((o) => (
                  <p
                    key={`${o.groupName}-${o.choiceName}`}
                    className="text-sm text-stone-500"
                  >
                    {o.groupName}: {o.choiceName}{" "}
                    {formatPriceDelta(o.priceDelta)}
                  </p>
                ))}
              </div>
              <p className="font-semibold">
                {formatPrice(line.unitPrice * line.quantity)}
              </p>
            </div>
            <div className="mt-2 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  aria-label="Decrease quantity"
                  disabled={line.quantity <= 1}
                  onClick={() => setQuantity(line.key, line.quantity - 1)}
                  className="h-8 w-8 rounded border border-stone-300 disabled:opacity-40"
                >
                  −
                </button>
                <span className="w-6 text-center">{line.quantity}</span>
                <button
                  type="button"
                  aria-label="Increase quantity"
                  disabled={line.quantity >= MAX_QUANTITY}
                  onClick={() => setQuantity(line.key, line.quantity + 1)}
                  className="h-8 w-8 rounded border border-stone-300 disabled:opacity-40"
                >
                  +
                </button>
              </div>
              <button
                type="button"
                onClick={() => removeLine(line.key)}
                className="text-sm text-red-600"
              >
                Remove
              </button>
            </div>
          </li>
        ))}
      </ul>

      <fieldset className="space-y-2">
        <legend className="text-sm font-medium">Order type</legend>
        <label className="flex items-center gap-2 text-sm">
          <input
            type="radio"
            name="orderType"
            checked={orderType === "dine-in"}
            onChange={() => setOrderType("dine-in")}
          />
          Dine-in
        </label>
        <label className="flex items-center gap-2 text-sm">
          <input
            type="radio"
            name="orderType"
            checked={orderType === "takeaway"}
            onChange={() => setOrderType("takeaway")}
          />
          Takeaway
        </label>
      </fieldset>

      {orderType === "dine-in" && (
        <label className="block text-sm">
          Table number
          <input
            type="number"
            min="1"
            step="1"
            required
            value={tableNumber}
            onChange={(e) => setTableNumber(e.target.value)}
            className="mt-1 w-full rounded border border-stone-300 px-3 py-2"
          />
        </label>
      )}

      <label className="block text-sm">
        Note for the kitchen (optional)
        <textarea
          maxLength={500}
          rows={3}
          value={customerNote}
          onChange={(e) => setCustomerNote(e.target.value)}
          className="mt-1 w-full rounded border border-stone-300 px-3 py-2"
        />
      </label>

      {errors.length > 0 && (
        <ul className="space-y-1 text-sm text-red-600">
          {errors.map((message) => (
            <li key={message}>{message}</li>
          ))}
        </ul>
      )}

      <div className="flex items-center justify-between border-t border-stone-200 pt-4">
        <span className="font-semibold">Total {formatPrice(total)}</span>
        <button
          type="submit"
          disabled={submitting}
          className="rounded bg-stone-800 px-5 py-2 text-white disabled:opacity-60"
        >
          {submitting ? "Placing order…" : "Place order"}
        </button>
      </div>
    </form>
  );
}
