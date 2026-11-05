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

export async function listReservations(req, res) {
  res.json(await reservationService.listReservations(req.validated.query));
}

export async function cancelReservation(req, res) {
  res.json(await reservationService.cancelReservation(req.validated.params.id));
}
