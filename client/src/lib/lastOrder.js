const KEY = "hostess_last_order";

export const getLastOrderId = () => localStorage.getItem(KEY);
export const setLastOrderId = (id) => localStorage.setItem(KEY, id);
export const clearLastOrderId = () => localStorage.removeItem(KEY);
