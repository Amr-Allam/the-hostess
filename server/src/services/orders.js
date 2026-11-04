import MenuItem from "../models/MenuItem.js";
import Order from "../models/Order.js";
import Table from "../models/Table.js";
import { httpError } from "../utils/httpError.js";
import { priceOrder } from "./pricing.js";

const ACTIVE_STATUSES = ["placed", "preparing", "ready"];

// Order status flow: each status maps to the statuses it may move to.
const TRANSITIONS = {
  placed: ["preparing", "cancelled"],
  preparing: ["ready", "cancelled"],
  ready: ["served"],
  served: [],
  cancelled: [],
};

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

// Kitchen's list: orders still in progress, oldest first.
export function listActiveOrders() {
  return Order.find({ status: { $in: ACTIVE_STATUSES } }).sort({
    createdAt: 1,
    _id: 1,
  });
}

export async function updateOrderStatus(id, status) {
  const allowedFrom = Object.keys(TRANSITIONS).filter((from) =>
    TRANSITIONS[from].includes(status),
  );

  // One atomic operation: it only matches if the order is still in a status
  // that may move to `status`, so two simultaneous updates can't both succeed.
  const order = await Order.findOneAndUpdate(
    { _id: id, status: { $in: allowedFrom } },
    { status },
    { returnDocument: "after", runValidators: true },
  );
  if (order) return order;

  // No match: either the order doesn't exist or the move isn't allowed.
  const current = await Order.findById(id, "status");
  if (!current) throw httpError(404, "Order not found");
  throw httpError(
    409,
    `Cannot change an order from ${current.status} to ${status}`,
  );
}
