import MenuItem from "../models/MenuItem.js";
import Order from "../models/Order.js";
import Table from "../models/Table.js";
import { httpError } from "../utils/httpError.js";
import { priceOrder } from "./pricing.js";

export async function createOrder(body) {
  const isDineIn = body.orderType === "dine-in";

  if (isDineIn && !(await Table.exists({ number: body.tableNumber }))) {
    throw httpError(400, "Table does not exist", [
      { path: "body.tableNumber", message: "Table does not exist" },
    ]);
  }

  // One query for all distinct items; prices always come from the database.
  const ids = [...new Set(body.items.map((i) => i.menuItemId))];
  const menuItems = await MenuItem.find({ _id: { $in: ids } }).lean();
  const byId = new Map(menuItems.map((m) => [String(m._id), m]));

  const { lines, total } = priceOrder(byId, body.items);

  return Order.create({
    orderType: body.orderType,
    tableNumber: isDineIn ? body.tableNumber : undefined,
    items: lines,
    customerNote: body.customerNote,
    total,
  });
}

export async function getOrder(id) {
  const order = await Order.findById(id);
  if (!order) throw httpError(404, "Order not found");
  return order;
}
