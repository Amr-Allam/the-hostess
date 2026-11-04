import { useCallback, useEffect, useRef, useState } from "react";
import { getActiveOrders, updateOrderStatus } from "../../api/staff.js";
import { createSocket } from "../../lib/socket.js";
import { useAuth } from "../staff/useAuth.js";

const ACTIVE_STATUSES = ["placed", "preparing", "ready"];
const RETRY_MS = 5000;

// Oldest first.
const byAge = (a, b) =>
  a.createdAt.localeCompare(b.createdAt) || a._id.localeCompare(b._id);

// Returns the list with `order` added, replaced, or removed (once it is no
// longer active). Ignores an order older than the copy we already have.
function applyOrder(list, order) {
  const existing = list.find((o) => o._id === order._id);
  if (existing && existing.updatedAt > order.updatedAt) return list;

  const rest = list.filter((o) => o._id !== order._id);
  if (!ACTIVE_STATUSES.includes(order.status)) return rest;
  return [...rest, order].sort(byAge);
}

// Live list of active orders for the kitchen display.
// `orders` is null until the first load finishes.
export function useKitchenOrders() {
  const { token, logout } = useAuth();
  const [orders, setOrders] = useState(null);
  const [connected, setConnected] = useState(false);
  const [error, setError] = useState("");

  // Refs keep the socket effect from restarting when these change.
  const logoutRef = useRef(logout);
  const reloadRef = useRef(() => {});
  useEffect(() => {
    logoutRef.current = logout;
  });

  useEffect(() => {
    const socket = createSocket(token);
    let cancelled = false;
    let loading = false;
    let dirty = false; // an event arrived while a fetch was in flight
    let retryTimer;

    // Fetches the full list. Runs on every (re)connect, so anything missed
    // while offline is caught up.
    async function load() {
      clearTimeout(retryTimer);
      if (loading) {
        dirty = true;
        return;
      }
      loading = true;
      try {
        do {
          dirty = false;
          const data = await getActiveOrders(token);
          if (cancelled) return;
          setOrders(data);
          setError("");
        } while (dirty); // an event raced the fetch: fetch again
      } catch (err) {
        if (cancelled) return;
        if (err.status === 401) {
          logoutRef.current();
          return;
        }
        setError(err.message);
        retryTimer = setTimeout(load, RETRY_MS);
      } finally {
        loading = false;
      }
    }
    reloadRef.current = load;

    function handleOrder(order) {
      if (loading) dirty = true;
      // Before the first load, the fetch will include this order.
      setOrders((prev) => (prev === null ? prev : applyOrder(prev, order)));
    }

    socket.on("connect", () => {
      setConnected(true);
      load();
    });
    socket.on("disconnect", () => setConnected(false));
    socket.on("connect_error", (err) => {
      setConnected(false);
      // The server refuses expired tokens and does not retry on its own.
      if (err.message === "Invalid or expired token") logoutRef.current();
    });
    socket.on("order:new", handleOrder);
    socket.on("order:updated", handleOrder);

    return () => {
      cancelled = true;
      clearTimeout(retryTimer);
      socket.close();
    };
  }, [token]);

  // Throws on failure so the card can show the message.
  const changeStatus = useCallback(
    async (id, status) => {
      try {
        const updated = await updateOrderStatus(id, status, token);
        setOrders((prev) => (prev === null ? prev : applyOrder(prev, updated)));
      } catch (err) {
        if (err.status === 401) logoutRef.current();
        // Someone else changed or removed the order: show the real state.
        else if (err.status === 409 || err.status === 404) reloadRef.current();
        throw err;
      }
    },
    [token],
  );

  return { orders, connected, error, changeStatus };
}
