import { request } from "./client.js";

const auth = (token) => ({ token });

export const getDailyReport = (token, from, to) =>
  request(`/owner/reports/daily?${new URLSearchParams({ from, to })}`, auth(token));

export const getTopItems = (token, from, to) =>
  request(
    `/owner/reports/top-items?${new URLSearchParams({ from, to })}`,
    auth(token),
  );

export const listMenuItems = (token) =>
  request("/owner/menu-items", auth(token));

export const createCategory = (token, body) =>
  request("/owner/categories", { method: "POST", body, token });

export const updateCategory = (token, id, body) =>
  request(`/owner/categories/${id}`, { method: "PUT", body, token });

export const deleteCategory = (token, id) =>
  request(`/owner/categories/${id}`, { method: "DELETE", token });

export const createMenuItem = (token, body) =>
  request("/owner/menu-items", { method: "POST", body, token });

export const updateMenuItem = (token, id, body) =>
  request(`/owner/menu-items/${id}`, { method: "PUT", body, token });

export const deleteMenuItem = (token, id) =>
  request(`/owner/menu-items/${id}`, { method: "DELETE", token });

export const uploadMenuImage = (token, file) => {
  const body = new FormData();
  body.append("image", file);
  return request("/owner/uploads", { method: "POST", body, token });
};

export const listTables = (token) => request("/owner/tables", auth(token));

export const createTable = (token, body) =>
  request("/owner/tables", { method: "POST", body, token });

export const updateTable = (token, id, body) =>
  request(`/owner/tables/${id}`, { method: "PUT", body, token });

export const deleteTable = (token, id) =>
  request(`/owner/tables/${id}`, { method: "DELETE", token });

export const listReservations = (token, date) => {
  const query = date ? `?${new URLSearchParams({ date })}` : "";
  return request(`/owner/reservations${query}`, auth(token));
};

export const cancelReservation = (token, id) =>
  request(`/owner/reservations/${id}/status`, {
    method: "PATCH",
    body: { status: "cancelled" },
    token,
  });

export const getSettings = (token) => request("/owner/settings", auth(token));

export const updateSettings = (token, body) =>
  request("/owner/settings", { method: "PUT", body, token });
