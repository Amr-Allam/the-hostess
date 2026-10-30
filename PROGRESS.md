# PROGRESS

## Phase 1: Foundation

- [x] Monorepo, `.gitignore`, `.env.example` files
- [x] Express app, Mongo connection, central error handler, health route
- [x] Zod `validate` middleware
- [x] All Mongoose models
- [x] Auth: login, `/me`, auth and role middleware
- [x] `seed.js`

## Phase 2: Menu

- [x] Owner CRUD for categories and menu items (image upload still pending, see below)
- [ ] Image upload (`POST /api/owner/uploads`)
- [ ] Client scaffold, routing, Tailwind
- [ ] Staff login page and protected routes
- [ ] Customer menu page with categories, images, option selection

## Notes

- Routes: validate({ body, query, params }) puts checked data on `req.validated`; controllers read only from it.
- Errors: throw `httpError(status, message, details)` (`utils/httpError.js`); Express 5 forwards async errors, so no try/catch wrappers.
- Auth: `requireAuth` (loads the user from the DB on every request, sets `req.user`) then `requireRole(...)`. Rate limiters come from `createLimiter` in `middleware/rateLimit.js`.
- Money is in piastres (EGP 85 = 8500). Seed accounts come from `SEED_*` in `server/.env`; `npm run seed` is safe to re-run.
- Menu: public `GET /api/menu` returns categories sorted by `order`, each with its available items (empty categories included; the client hides them). Owner routes live in `routes/ownerRoutes.js`, gated once by `requireAuth` + `requireRole("owner")`.
- Menu items: option group names must be unique per item, choice names unique per group, and every group needs at least one choice. A category with any items (hidden ones too) can't be deleted (`409`). Items are hard-deleted.
