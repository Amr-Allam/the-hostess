import { request } from "./client.js";

export const login = (email, password) =>
  request("/auth/login", { method: "POST", body: { email, password } });

export const getMe = (token) => request("/auth/me", { token });
