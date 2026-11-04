import * as orderService from "../services/orders.js";
import { emitOrderNew, emitOrderUpdated } from "../sockets/index.js";

export async function createOrder(req, res) {
  const order = await orderService.createOrder(req.validated.body);
  emitOrderNew(order);
  res.status(201).json(order);
}

export async function getOrder(req, res) {
  res.json(await orderService.getOrder(req.validated.params.id));
}

export async function listActiveOrders(req, res) {
  res.json(await orderService.listActiveOrders());
}

export async function updateOrderStatus(req, res) {
  const order = await orderService.updateOrderStatus(
    req.validated.params.id,
    req.validated.body.status,
  );
  emitOrderUpdated(order);
  res.json(order);
}
