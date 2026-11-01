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
- [x] Image upload (`POST /api/owner/uploads`)
- [x] Client scaffold, routing, Tailwind
- [x] Staff login page and protected routes
- [x] Customer menu page with categories, images, option selection

## Notes

- Routes: validate({ body, query, params }) puts checked data on `req.validated`; controllers read only from it.
- Errors: throw `httpError(status, message, details)` (`utils/httpError.js`); Express 5 forwards async errors, so no try/catch wrappers.
- Auth: `requireAuth` (loads the user from the DB on every request, sets `req.user`) then `requireRole(...)`. Rate limiters come from `createLimiter` in `middleware/rateLimit.js`.
- Money is in piastres (EGP 85 = 8500). Seed accounts come from `SEED_*` in `server/.env`; `npm run seed` is safe to re-run.
- Menu: public `GET /api/menu` returns categories sorted by `order`, each with its available items (empty categories included; the client hides them). Owner routes live in `routes/ownerRoutes.js`, gated once by `requireAuth` + `requireRole("owner")`.
- Menu items: option group names must be unique per item, choice names unique per group, and every group needs at least one choice. A category with any items (hidden ones too) can't be deleted (`409`). Items are hard-deleted.
- Uploads: `POST /api/owner/uploads` takes one file in the `image` form field (JPEG, PNG or WebP, max 5 MB, held in memory by multer) and streams it to Cloudinary into the `the-hostess` asset folder. It returns `201 { url }`, `400` for a bad or missing file, and `503` if the `CLOUDINARY_*` variables are not set.
- Client auth: `AuthProvider` (React context) keeps the JWT in localStorage (`hostess_token`) and checks it with `/api/auth/me` on load. `ProtectedRoute roles={[...]}` redirects to `/staff/login` when logged out or the role doesn't match. `STAFF_HOME` in `features/staff/routes.js` maps each role to its landing page.
- Client menu: `MenuPage` fetches `/api/menu` and hides categories with no items. `ItemOptionsModal` handles option selection with a live price; its Add to cart button and quantity come in Phase 3. Prices are formatted by `lib/format.js` from piastres using `VITE_CURRENCY`.
