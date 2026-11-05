# PROGRESS

## Phase 1: Foundation

- [x] Monorepo, `.gitignore`, `.env.example` files
- [x] Express app, Mongo connection, central error handler, health route
- [x] Zod `validate` middleware
- [x] All Mongoose models
- [x] Auth: login, `/me`, auth and role middleware
- [x] `seed.js`

## Phase 2: Menu

- [x] Owner CRUD for categories and menu items
- [x] Image upload (`POST /api/owner/uploads`)
- [x] Client scaffold, routing, Tailwind
- [x] Staff login page and protected routes
- [x] Customer menu page with categories, images, option selection

## Phase 3: Cart and orders

- [x] Zustand cart, cart page, checkout (table number or takeaway)
- [x] `POST /api/orders` with server-side pricing
- [x] Order status page (polling for now)

## Phase 4: Realtime

- [x] Socket.io server and client setup
- [x] Staff order endpoints (`GET /api/staff/orders`, `PATCH /api/staff/orders/:id/status`)
- [x] Kitchen display with live orders and status buttons
- [x] Customer status page updates live

## Phase 5: Reservations

- [x] Tables CRUD (`/api/owner/tables`) and settings (`GET`/`PUT /api/owner/settings`): API only, owner UI is Phase 6
- [x] Availability endpoint and booking form
- [x] Owner reservation list with cancel (`/api/owner/reservations`): API only, owner UI is Phase 6

## Phase 6: Owner dashboard

- [x] Report endpoints (`GET /api/owner/reports/daily`, `GET /api/owner/reports/top-items`)
- [x] Dashboard UI with Recharts: daily sales, order count, average order value, top items
- [x] Owner dashboard sections: Menu management (categories, items, option groups, image upload), Reservations, Tables, Settings

## Phase 7: Polish and deploy

- [ ] Mobile responsiveness, loading and error states across public and staff flows
- [ ] Tests for order pricing and reservation availability
- [x] Deploy to Atlas, Railway, and Vercel; public menu and staff login route are live
- [x] Generate the QR code from the live URL (`hostess-qr.png`)

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
- Orders: `POST /api/orders` returns `201` with the full order; `GET /api/orders/:id` returns the same shape (`404` if unknown, `400` for a malformed id). Limits: 1-50 lines, quantity 1-20, item note 200 characters, order note 500. `tableNumber` is required for dine-in (must match a Table) and not stored for takeaway. Pricing lives in `priceOrder` (`services/pricing.js`), a pure function: it takes menu items already loaded from the database and returns `{ lines, total }`, or a `400` listing every problem (missing or unavailable item, bad option, missing required group, negative unit price). `POST` is rate limited by `orderLimiter` (30 per 15 min per IP); `GET` is not.
- Client cart: Zustand store in `store/cartStore.js`, persisted to localStorage under `hostess_cart`. Identical item plus options merges into one line; the stored prices are for display only, the server recomputes everything. After a successful order the cart is cleared and the id is saved under `hostess_last_order` (`lib/lastOrder.js`), which drives the "Your order" nav link. `OrderStatusPage` polls every 5 seconds until `served` or `cancelled`; Phase 4 replaces this with sockets.
- Realtime: `sockets/index.js` attaches Socket.io to the HTTP server in `server.js`. A connection with no token is a customer; a valid kitchen/owner token joins the `kitchen` room; an invalid or expired token is refused. Controllers call `emitOrderNew` / `emitOrderUpdated` after the database write; the helpers do nothing if sockets aren't initialized. `order:join` takes an optional acknowledgment (sent even for an invalid id) and ignores invalid ids. The token is checked once at connect, so a socket open past expiry keeps receiving until it reconnects.
- Staff orders: `GET /api/staff/orders?status=active` (`status` must be `active`; oldest first) and `PATCH /api/staff/orders/:id/status` (`400` bad id or status, `404` unknown, `409` forbidden transition). The update is one atomic `findOneAndUpdate` filtered by the allowed source statuses, so simultaneous updates can't both succeed. Transition rules live in `services/orders.js`.
- Client realtime: `lib/socket.js` (`createSocket(token?)`), one connection per page, closed on cleanup. `useKitchenOrders` refetches the active list on every connect; `useLiveOrder` joins the order's room, waits for the acknowledgment, then fetches. Both ignore older copies by `updatedAt`. `OrderStatusPage` no longer polls and closes its socket once the order is served or cancelled.
- Tables: `/api/owner/tables` is owner CRUD. A duplicate `number` returns `409` (the unique-index error `11000` is translated in `services/tables.js`). Deleting a table that any reservation references returns `409`.
- Settings: `GET`/`PUT /api/owner/settings`. `PUT` replaces the whole document (all 7 days plus both minute fields). Each non-closed day needs `open < close` (no overnight hours); slot length and duration are integers 1-1440. A missing settings document returns `503` (`npm run seed` creates it).
- Availability: `services/availability.js` holds pure functions (`generateSlots`, `pickTable`, `listSlots`), the Phase 7 test targets. `utils/time.js` holds the timezone and date helpers (uses `TIMEZONE`). `GET /api/reservations/availability?date=&partySize=` returns `[{ startTime, available }]`: `[]` for a closed day, `400` for a past or invalid date, and slots that have already started today are `available: false`. `partySize` is 1-100. Limited by `availabilityLimiter` (120 per 15 min per IP).
- Booking: `POST /api/reservations` (limited by `reservationLimiter`, 20 per 15 min per IP) returns `201` with the reservation and `table: { _id, number }`. `400` for a past date, closed day, a `startTime` that is not a generated slot, or a slot already started today; `409` when no table is free or none is large enough. The table is the smallest free one that fits. The availability re-check is a fresh read right before the insert, not atomic, so two simultaneous requests could double-book (accepted for v1). Phone: 8-20 characters of digits, spaces, `+`, `-`, `(`, `)`.
- Owner reservations: `GET /api/owner/reservations?date=` (date optional; without it, today onward in `TIMEZONE`; sorted by date and start time; cancelled ones included; `table` populated as `{ _id, number }`). `PATCH /api/owner/reservations/:id/status` accepts only `{ status: "cancelled" }` through one atomic update on `confirmed` reservations (`409` if already cancelled, `404` if unknown).
- Client booking: `ReservePage` shows the confirmation; `features/reservations/BookingForm.jsx` is one page (date + party size, then slot grid, then name and phone). Availability results are keyed by `date|partySize|refresh`; a `409` on submit bumps `refresh` to reload the slots. The date picker's `min` uses the browser's local date; the server is the authority. Customers cannot look up or cancel a reservation (not in SPEC).
- Reports: `GET /api/owner/reports/daily?from=&to=` returns one row per local day `{ date, totalSales, orderCount, averageOrderValue }` (zero rows for days with no orders; the average is rounded to a whole piastre). `GET /api/owner/reports/top-items?from=&to=` returns the top 10 `{ menuItemId, name, quantity }` by quantity, ties by name. `from` and `to` are required, inclusive `YYYY-MM-DD` dates, at most 366 days apart (`400` otherwise). Cancelled orders are excluded and days are grouped in `TIMEZONE`. Pipelines live in `services/reports.js` and use a loose `createdAt` window (so the `{status, createdAt}` index helps) followed by an exact local-day match.
- Owner dashboard: `DashboardPage` is a tab shell (Reports, Menu, Reservations, Tables, Settings) using local state, so a refresh returns to Reports; no extra routes. `api/client.js` `request` sends a `FormData` body as multipart (no `Content-Type` header, no `JSON.stringify`) for image uploads.
