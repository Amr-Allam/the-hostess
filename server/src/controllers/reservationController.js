import * as reservationService from "../services/reservations.js";

export async function getAvailability(req, res) {
  res.json(await reservationService.getAvailability(req.validated.query));
}

export async function createReservation(req, res) {
  const reservation = await reservationService.createReservation(
    req.validated.body,
  );
  res.status(201).json(reservation);
}
