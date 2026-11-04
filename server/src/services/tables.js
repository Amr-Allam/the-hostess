import Reservation from "../models/Reservation.js";
import Table from "../models/Table.js";
import { httpError } from "../utils/httpError.js";

const UPDATE_OPTIONS = { returnDocument: "after", runValidators: true };

// MongoDB reports a unique-index violation as error code 11000.
function translateDuplicate(err) {
  if (err?.code !== 11000) return err;
  return httpError(409, "Table number already exists", [
    { path: "body.number", message: "Table number already exists" },
  ]);
}

export function listTables() {
  return Table.find().sort({ number: 1 });
}

export async function createTable(data) {
  try {
    return await Table.create(data);
  } catch (err) {
    throw translateDuplicate(err);
  }
}

export async function updateTable(id, data) {
  let table;
  try {
    table = await Table.findByIdAndUpdate(id, data, UPDATE_OPTIONS);
  } catch (err) {
    throw translateDuplicate(err);
  }
  if (!table) throw httpError(404, "Table not found");
  return table;
}

export async function deleteTable(id) {
  if (await Reservation.exists({ table: id })) {
    throw httpError(409, "Table still has reservations");
  }
  const table = await Table.findByIdAndDelete(id);
  if (!table) throw httpError(404, "Table not found");
}
