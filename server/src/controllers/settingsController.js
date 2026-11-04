import * as settingsService from "../services/settings.js";

export async function getSettings(req, res) {
  res.json(await settingsService.getSettings());
}

export async function updateSettings(req, res) {
  res.json(await settingsService.updateSettings(req.validated.body));
}
