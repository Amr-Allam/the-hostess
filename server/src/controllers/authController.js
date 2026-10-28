import * as authService from "../services/auth.js";

export async function login(req, res) {
  const { email, password } = req.validated.body;
  res.json(await authService.login(email, password));
}

export function me(req, res) {
  res.json({ user: { email: req.user.email, role: req.user.role } });
}
