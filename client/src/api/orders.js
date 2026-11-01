import { request } from "./client.js";

export const createOrder = (body) =>
  request("/orders", { method: "POST", body });

export const getOrder = (id) => request(`/orders/${id}`);
