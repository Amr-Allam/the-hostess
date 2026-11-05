import { useEffect, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ComposedChart,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { errorMessage } from "../../api/client.js";
import { getDailyReport, getTopItems } from "../../api/owner.js";
import { formatAmount, formatPrice } from "../../lib/format.js";
import { useAuth } from "./useAuth.js";

const MAX_DAYS = 366;
const inputClass = "rounded border border-stone-300 px-3 py-2";

function isoDate(date) {
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${date.getFullYear()}-${month}-${day}`;
}

function defaultRange() {
  const to = new Date();
  const from = new Date();
  from.setDate(to.getDate() - 6);
  return { from: isoDate(from), to: isoDate(to) };
}

function rangeError(from, to) {
  if (!from || !to) return "Choose a start and end date.";
  const start = Date.parse(`${from}T00:00:00Z`);
  const end = Date.parse(`${to}T00:00:00Z`);
  if (Number.isNaN(start) || Number.isNaN(end)) return "Use real dates.";
  const days = Math.round((end - start) / 86400000) + 1;
  if (days < 1) return "The end date cannot be before the start date.";
  if (days > MAX_DAYS) return `The range cannot be longer than ${MAX_DAYS} days.`;
  return "";
}

function shortDate(date) {
  return date.slice(5);
}

function moneyTooltip(value) {
  return formatPrice(value);
}

function mixedTooltip(value, name) {
  return name === "Orders" ? value : formatPrice(value);
}

export default function ReportsSection() {
  const { token } = useAuth();
  const initial = defaultRange();
  const [from, setFrom] = useState(initial.from);
  const [to, setTo] = useState(initial.to);
  const [applied, setApplied] = useState(initial);
  const [formError, setFormError] = useState("");
  const [rows, setRows] = useState(null);
  const [topItems, setTopItems] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    Promise.all([
      getDailyReport(token, applied.from, applied.to),
      getTopItems(token, applied.from, applied.to),
    ])
      .then(([daily, items]) => {
        if (cancelled) return;
        setRows(daily);
        setTopItems(items);
        setError("");
      })
      .catch((err) => {
        if (cancelled) return;
        setRows(null);
        setTopItems(null);
        setError(errorMessage(err));
      });
    return () => {
      cancelled = true;
    };
  }, [token, applied]);

  function handleSubmit(e) {
    e.preventDefault();
    const message = rangeError(from, to);
    setFormError(message);
    if (!message) setApplied({ from, to });
  }

  const totalSales = rows?.reduce((sum, row) => sum + row.totalSales, 0) ?? 0;
  const orderCount = rows?.reduce((sum, row) => sum + row.orderCount, 0) ?? 0;
  const average =
    orderCount === 0 ? 0 : Math.round(totalSales / orderCount);

  return (
    <div className="space-y-6">
      <h2 className="text-lg font-semibold">Reports</h2>

      <form onSubmit={handleSubmit} className="flex flex-wrap items-end gap-3">
        <label className="text-sm">
          From
          <input
            type="date"
            required
            value={from}
            onChange={(e) => setFrom(e.target.value)}
            className={`mt-1 block ${inputClass}`}
          />
        </label>
        <label className="text-sm">
          To
          <input
            type="date"
            required
            value={to}
            onChange={(e) => setTo(e.target.value)}
            className={`mt-1 block ${inputClass}`}
          />
        </label>
        <button
          type="submit"
          className="rounded bg-stone-800 px-3 py-2 text-sm text-white"
        >
          Show
        </button>
      </form>
      {formError && <p className="text-sm text-red-600">{formError}</p>}
      {error && <p className="text-sm text-red-600">{error}</p>}

      {rows === null ? (
        !error && <p className="text-stone-500">Loading reports…</p>
      ) : (
        <>
          <dl className="grid gap-3 sm:grid-cols-3">
            <div className="rounded border border-stone-200 p-3">
              <dt className="text-sm text-stone-500">Sales</dt>
              <dd className="text-lg font-semibold">{formatPrice(totalSales)}</dd>
            </div>
            <div className="rounded border border-stone-200 p-3">
              <dt className="text-sm text-stone-500">Orders</dt>
              <dd className="text-lg font-semibold">{orderCount}</dd>
            </div>
            <div className="rounded border border-stone-200 p-3">
              <dt className="text-sm text-stone-500">Average order</dt>
              <dd className="text-lg font-semibold">{formatPrice(average)}</dd>
            </div>
          </dl>

          <section className="space-y-2">
            <h3 className="font-medium">Daily sales</h3>
            <div className="h-72 w-full">
              <ResponsiveContainer>
                <LineChart data={rows}>
                  <CartesianGrid stroke="#e7e5e4" />
                  <XAxis dataKey="date" tickFormatter={shortDate} minTickGap={24} />
                  <YAxis tickFormatter={formatAmount} width={56} />
                  <Tooltip formatter={moneyTooltip} />
                  <Line
                    type="monotone"
                    dataKey="totalSales"
                    name="Sales"
                    stroke="#d97706"
                    strokeWidth={2}
                    dot={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </section>

          <section className="space-y-2">
            <h3 className="font-medium">Orders and average order value</h3>
            <div className="h-72 w-full">
              <ResponsiveContainer>
                <ComposedChart data={rows}>
                  <CartesianGrid stroke="#e7e5e4" />
                  <XAxis dataKey="date" tickFormatter={shortDate} minTickGap={24} />
                  <YAxis yAxisId="count" allowDecimals={false} width={40} />
                  <YAxis
                    yAxisId="money"
                    orientation="right"
                    tickFormatter={formatAmount}
                    width={56}
                  />
                  <Tooltip formatter={mixedTooltip} />
                  <Legend />
                  <Bar
                    yAxisId="count"
                    dataKey="orderCount"
                    name="Orders"
                    fill="#78716c"
                  />
                  <Line
                    yAxisId="money"
                    type="monotone"
                    dataKey="averageOrderValue"
                    name="Average order"
                    stroke="#d97706"
                    strokeWidth={2}
                    dot={false}
                  />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          </section>

          <section className="space-y-2">
            <h3 className="font-medium">Top items</h3>
            {topItems.length === 0 ? (
              <p className="text-stone-500">No items sold in this range.</p>
            ) : (
              <div className="w-full" style={{ height: Math.max(220, topItems.length * 36) }}>
                <ResponsiveContainer>
                  <BarChart
                    data={topItems}
                    layout="vertical"
                    margin={{ left: 8, right: 16 }}
                  >
                    <CartesianGrid stroke="#e7e5e4" horizontal={false} />
                    <XAxis type="number" allowDecimals={false} />
                    <YAxis
                      type="category"
                      dataKey="name"
                      width={140}
                      tick={{ fontSize: 12 }}
                    />
                    <Tooltip />
                    <Bar dataKey="quantity" name="Quantity" fill="#d97706" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </section>
        </>
      )}
    </div>
  );
}
