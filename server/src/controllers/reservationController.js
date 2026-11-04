import * as reservationService from "../services/reservations.js";

export async function getAvailability(req, res) {
  res.json(await reservationService.getAvailability(req.validated.query));
}
