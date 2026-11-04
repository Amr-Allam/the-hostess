import { request } from "./client.js";

export const getActiveOrders = (token) =>
  request("/staff/orders?status=active", { token });

export const updateOrderStatus = (id, status, token) =>
  request(`/staff/orders/${id}/status`, {
    method: "PATCH",
    body: { status },
    token,
  });
