import Settings from "../models/Settings.js";
import { httpError } from "../utils/httpError.js";

// Settings is a single document: always the first one. `npm run seed` creates it.
function notConfigured() {
  return httpError(503, "Restaurant settings are not configured");
}

export async function getSettings() {
  const settings = await Settings.findOne().sort({ _id: 1 });
  if (!settings) throw notConfigured();
  return settings;
}

// Replaces the whole document: the body must contain every field.
export async function updateSettings(data) {
  const settings = await Settings.findOneAndUpdate({}, data, {
    returnDocument: "after",
    runValidators: true,
    sort: { _id: 1 },
  });
  if (!settings) throw notConfigured();
  return settings;
}
