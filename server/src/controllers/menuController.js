import * as menuService from "../services/menu.js";

export async function getMenu(req, res) {
  res.json(await menuService.getPublicMenu());
}

export async function createCategory(req, res) {
  const category = await menuService.createCategory(req.validated.body);
  res.status(201).json(category);
}

export async function updateCategory(req, res) {
  const { id } = req.validated.params;
  res.json(await menuService.updateCategory(id, req.validated.body));
}

export async function deleteCategory(req, res) {
  await menuService.deleteCategory(req.validated.params.id);
  res.status(204).end();
}

export async function listMenuItems(req, res) {
  res.json(await menuService.listMenuItems());
}

export async function createMenuItem(req, res) {
  const item = await menuService.createMenuItem(req.validated.body);
  res.status(201).json(item);
}

export async function updateMenuItem(req, res) {
  const { id } = req.validated.params;
  res.json(await menuService.updateMenuItem(id, req.validated.body));
}

export async function deleteMenuItem(req, res) {
  await menuService.deleteMenuItem(req.validated.params.id);
  res.status(204).end();
}
