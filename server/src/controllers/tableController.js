import * as tableService from "../services/tables.js";

export async function listTables(req, res) {
  res.json(await tableService.listTables());
}

export async function createTable(req, res) {
  const table = await tableService.createTable(req.validated.body);
  res.status(201).json(table);
}

export async function updateTable(req, res) {
  const { id } = req.validated.params;
  res.json(await tableService.updateTable(id, req.validated.body));
}

export async function deleteTable(req, res) {
  await tableService.deleteTable(req.validated.params.id);
  res.status(204).end();
}
