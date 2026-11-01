import * as orderService from "../services/orders.js";

export async function createOrder(req, res) {
  const order = await orderService.createOrder(req.validated.body);
  res.status(201).json(order);
}

export async function getOrder(req, res) {
  res.json(await orderService.getOrder(req.validated.params.id));
}
