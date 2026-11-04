import { useEffect, useState } from "react";
import { getOrder } from "../../api/orders.js";
import { clearLastOrderId, getLastOrderId } from "../../lib/lastOrder.js";
import { createSocket } from "../../lib/socket.js";

export const FINAL_STATUSES = ["served", "cancelled"];
const RETRY_MS = 5000;

// Keeps whichever copy of the order is newer, so a slow fetch can't
// overwrite a fresher live update.
const newest = (current, incoming) =>
  current && current.updatedAt > incoming.updatedAt ? current : incoming;

// Live status of one order for the customer page.
// `order` is null until the first load finishes.
export function useLiveOrder(id) {
  const [order, setOrder] = useState(null);
  const [error, setError] = useState("");
  const [notFound, setNotFound] = useState(false);
  const [connectionLost, setConnectionLost] = useState(false);

  useEffect(() => {
    const socket = createSocket();
    let cancelled = false;
    let retryTimer;

    function accept(incoming) {
      setOrder((prev) => newest(prev, incoming));
      // Nothing more will change, so stop listening.
      if (FINAL_STATUSES.includes(incoming.status)) {
        clearTimeout(retryTimer);
        socket.close();
      }
    }

    async function load() {
      clearTimeout(retryTimer);
      try {
        const data = await getOrder(id);
        if (cancelled) return;
        setError("");
        accept(data);
      } catch (err) {
        if (cancelled) return;
        if (err.status === 404 || err.status === 400) {
          setNotFound(true);
          if (getLastOrderId() === id) clearLastOrderId();
          socket.close();
          return;
        }
        setError(err.message);
        retryTimer = setTimeout(load, RETRY_MS);
      }
    }

    // On every (re)connect: rooms are lost when a connection drops, so join again, then fetch to catch up on anything missed while offline. The fetch waits for the server to confirm the join, so no update can fall between the two. If no confirmation comes within 5 seconds, fetch anyway.
    socket.on("connect", () => {
      setConnectionLost(false);
      socket.timeout(5000).emit("order:join", { orderId: id }, () => load());
    });
    socket.on("disconnect", () => setConnectionLost(true));
    socket.on("connect_error", () => setConnectionLost(true));
    socket.on("order:updated", accept);

    return () => {
      cancelled = true;
      clearTimeout(retryTimer);
      socket.close();
    };
  }, [id]);

  return { order, error, notFound, connectionLost };
}
