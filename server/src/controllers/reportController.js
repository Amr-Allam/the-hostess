import * as reportService from "../services/reports.js";

export async function getDailyReport(req, res) {
  res.json(await reportService.getDailyReport(req.validated.query));
}

export async function getTopItems(req, res) {
  res.json(await reportService.getTopItems(req.validated.query));
}
