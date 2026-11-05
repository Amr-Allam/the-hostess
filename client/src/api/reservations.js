import { request } from "./client.js";

export const getAvailability = (date, partySize) =>
  request(
    `/reservations/availability?${new URLSearchParams({ date, partySize })}`,
  );

export const createReservation = (body) =>
  request("/reservations", { method: "POST", body });
