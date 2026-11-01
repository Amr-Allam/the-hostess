import { request } from "./client.js";

export const getMenu = () => request("/menu");
