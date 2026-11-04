import StaffBar from "../features/staff/StaffBar.jsx";
import KitchenOrderCard from "../features/orders/KitchenOrderCard.jsx";
import { useKitchenOrders } from "../features/orders/useKitchenOrders.js";
import { useNow } from "../features/orders/useNow.js";

export default function KitchenPage() {
  const { orders, connected, error, changeStatus } = useKitchenOrders();
  const now = useNow();

  return (
    <>
      <StaffBar />
      <div className="mx-auto max-w-5xl space-y-4 p-4">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-semibold">Kitchen</h1>
          <span
            className={`text-sm ${connected ? "text-green-700" : "text-amber-700"}`}
          >
            {connected ? "Live" : "Connecting…"}
          </span>
        </div>

        {!connected && orders !== null && (
          <p className="rounded bg-amber-50 p-3 text-sm text-amber-800">
            Connection lost, reconnecting. New orders may not appear until it is
            back.
          </p>
        )}
        {error && (
          <p className="text-sm text-red-600">Could not load orders: {error}</p>
        )}

        {orders === null ? (
          !error && <p className="text-stone-500">Loading orders…</p>
        ) : orders.length === 0 ? (
          <p className="text-stone-500">No active orders.</p>
        ) : (
          <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {orders.map((order) => (
              <KitchenOrderCard
                key={order._id}
                order={order}
                now={now}
                onChangeStatus={changeStatus}
              />
            ))}
          </ul>
        )}
      </div>
    </>
  );
}
