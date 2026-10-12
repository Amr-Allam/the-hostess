# SPEC.md: Restaurant Ordering and Table Reservation System

Single source of truth. If code and this file disagree, fix one of them in the same commit.

## 1. Overview

Customers scan one QR code (or visit the site) to view the menu, order, and reserve a table. The kitchen sees orders live. The owner views daily sales reports and manages menu, reservations and settings.

**One restaurant. No customer accounts. No online payments.**

**Out of scope (v1):** online payments, customer accounts, per-table QR codes, SMS/email notifications, multi-restaurant support, staff-management UI.

## 2. Stack

| Part | Choice |
|---|---|
| Client | React + Vite, React Router, Tailwind CSS, Zustand (cart), Recharts (reports), socket.io-client |
| Server | Node.js + Express, Mongoose, Zod, jsonwebtoken, bcrypt, helmet, cors, express-rate-limit, socket.io |
| Database | MongoDB Atlas |
| Images | Cloudinary (server uploads via multer) |
| Hosting | Vercel (client), Render (server) |
| Language | JavaScript (ES modules) on both sides |

## 3. Folder structure

```
restaurant-system/
├── SPEC.md
├── PROGRESS.md
├── client/
│   └── src/
│       ├── api/            # fetch wrappers (one file per resource)
│       ├── components/     # shared UI
│       ├── features/       # menu, cart, orders, reservations, staff
│       ├── pages/          # route-level components
│       ├── store/          # Zustand stores (cart)
│       ├── lib/            # socket.js, format helpers
│       ├── App.jsx
│       └── main.jsx
└── server/
    ├── scripts/            # seed.js, create-user.js
    └── src/
        ├── config/         # env, db, cloudinary
        ├── models/
        ├── routes/
        ├── controllers/
        ├── middleware/     # auth, role, validate, errorHandler, rateLimit
        ├── validators/     # Zod schemas
        ├── services/       # pricing, availability, reports
        ├── sockets/        # socket setup and handlers
        ├── utils/
        ├── app.js          # Express app (no listen)
        └── server.js       # HTTP server + Socket.io + listen
```

## 4. Conventions

- ES modules (`import`/`export`) everywhere.
- Routes call controllers; controllers call services for business logic. Models hold schemas only.
- Every request body and query is validated with Zod before reaching the controller.
- Async errors go to one central error handler. Error response shape: `{ "error": { "message": "...", "details": [] } }`.
- Success responses return JSON. Create returns `201`.
- **Money is stored as integers in the smallest currency unit** (e.g. cents). The client formats it for display.
- **Dates and times for reservations are strings** in the restaurant's local time: `date` = `"YYYY-MM-DD"`, times = `"HH:mm"`. No timezone conversion for reservations.
- Secrets live in `.env` only. `.env` is in `.gitignore`. Commit `.env.example`.
- API base path: `/api`.

## 5. Environment variables

**server/.env**
```
PORT=5000
MONGODB_URI=
JWT_SECRET=
JWT_EXPIRES_IN=12h
CLIENT_URL=http://localhost:5173
TIMEZONE=Africa/Cairo
CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=
SEED_OWNER_EMAIL=
SEED_OWNER_PASSWORD=
SEED_KITCHEN_EMAIL=
SEED_KITCHEN_PASSWORD=
```

**client/.env**
```
VITE_API_URL=http://localhost:5000
VITE_CURRENCY=EGP
```

## 6. Data models (Mongoose)

**User**: `email` (unique), `passwordHash`, `role` (`"owner"` | `"kitchen"`)

**Category**: `name`, `order` (number, for sorting)

**MenuItem**
- `name`, `description`, `price` (int), `imageUrl`, `category` (ref Category), `available` (bool, default true)
- `optionGroups`: array of
  - `name` (e.g. "Size")
  - `type` (`"single"` | `"multiple"`)
  - `required` (bool)
  - `choices`: array of `{ name, priceDelta (int, can be 0 or negative) }`

**Table**: `number` (unique), `capacity`

**Order**
- `orderType` (`"dine-in"` | `"takeaway"`)
- `tableNumber` (required if dine-in)
- `items`: array of `{ menuItem (ref), name, unitPrice, quantity, selectedOptions: [{ groupName, choiceName, priceDelta }], note }`. Name and prices are **snapshotted** at order time.
- `customerNote`, `status`, `total` (int), `createdAt`, `updatedAt`

**Reservation**
- `name`, `phone`, `partySize`, `date`, `startTime`, `endTime`
- `startMinutes`, `endMinutes` (ints, minutes from midnight, used for overlap queries)
- `table` (ref Table), `status` (`"confirmed"` | `"cancelled"`)

**Settings** (single document)
- `openingHours`: for each weekday `{ open: "HH:mm", close: "HH:mm", closed: bool }`
- `slotLengthMinutes` (default 30), `reservationDurationMinutes` (default 90)

## 7. Business rules

**Order status flow:** `placed → preparing → ready → served`. Cancel allowed from `placed` or `preparing` → `cancelled`. No other transitions.

**Order pricing (server-side, never trust the client):**
1. Load each `menuItem` from the database. Reject if missing or `available: false`.
2. Validate selected options: each group exists, `single` groups have at most one choice, `required` groups have at least one, choices exist.
3. `unitPrice = item.price + sum(selected priceDeltas)`
4. `total = sum(unitPrice × quantity)`
5. Snapshot names and prices into the order.

**Dine-in orders:** `tableNumber` must match an existing Table.

**Reservation availability:**
- Slots are generated from opening hours and `slotLengthMinutes`. A slot is only offered if `start + reservationDuration ≤ closing time`.
- A table is free for a range if `capacity ≥ partySize` and no `confirmed` reservation on that table and date overlaps it. Overlap: `existing.startMinutes < newEnd && existing.endMinutes > newStart`.
- A slot is available if at least one table is free.
- On booking, the server assigns the **smallest** free table that fits, and **re-checks availability at creation** to prevent double booking.
- Reservations are auto-confirmed. Past dates and closed days are rejected.

**Reports:** exclude `cancelled` orders. Group by day using `TIMEZONE`. Metrics: total sales, order count, average order value, top items by quantity.

## 8. API endpoints

**Public**

| Method | Path | Purpose |
|---|---|---|
| GET | `/api/menu` | Categories with their available items |
| POST | `/api/orders` | Place an order. Body: `{ orderType, tableNumber?, customerNote?, items: [{ menuItemId, quantity, note?, selectedOptions: [{ groupName, choiceName }] }] }` |
| GET | `/api/orders/:id` | Order status for the customer status page |
| GET | `/api/reservations/availability?date=&partySize=` | Slots: `[{ startTime, available }]` |
| POST | `/api/reservations` | Body: `{ name, phone, partySize, date, startTime }` |

**Auth**

| Method | Path | Purpose |
|---|---|---|
| POST | `/api/auth/login` | `{ email, password }` → `{ token, user: { email, role } }` |
| GET | `/api/auth/me` | Current user (any staff) |

There is **no signup route**. Staff accounts are created by `scripts/seed.js` and `scripts/create-user.js`.

**Kitchen + owner**

| Method | Path | Purpose |
|---|---|---|
| GET | `/api/staff/orders?status=active` | Active orders (`placed`, `preparing`, `ready`) |
| PATCH | `/api/staff/orders/:id/status` | Body: `{ status }`, validated against the flow |

**Owner only**

| Method | Path | Purpose |
|---|---|---|
| POST/PUT/DELETE | `/api/owner/categories` (`/:id`) | Category CRUD |
| POST/PUT/DELETE | `/api/owner/menu-items` (`/:id`) | Menu item CRUD |
| GET | `/api/owner/menu-items` | All items including unavailable |
| POST | `/api/owner/uploads` | Image upload → `{ url }` |
| GET/POST/PUT/DELETE | `/api/owner/tables` (`/:id`) | Table CRUD |
| GET | `/api/owner/reservations?date=` | List reservations |
| PATCH | `/api/owner/reservations/:id/status` | Cancel a reservation |
| GET/PUT | `/api/owner/settings` | Opening hours, slot length, duration |
| GET | `/api/owner/reports/daily?from=&to=` | Per-day sales, order count, average order value |
| GET | `/api/owner/reports/top-items?from=&to=` | Top items |

Auth middleware reads `Authorization: Bearer <token>`. Role middleware: `/api/staff/*` allows `kitchen` and `owner`; `/api/owner/*` allows `owner`.

Public endpoints (`POST /api/orders`, `POST /api/reservations`, availability, login) are rate limited.

## 9. Socket.io events

**Connection:** the client connects to the server. Staff pass their JWT in `auth: { token }`; the server verifies it and joins the socket to the `kitchen` room (kitchen and owner roles).

| Direction | Event | Payload | Purpose |
|---|---|---|---|
| client → server | `order:join` | `{ orderId }` | Customer joins room `order:<id>` |
| server → `kitchen` | `order:new` | full order | New order arrived |
| server → `kitchen` + `order:<id>` | `order:updated` | full order | Status changed |

The REST endpoint changes the data first, then emits the event. Sockets never write to the database.

## 10. Client routes

**Public:** `/` (menu), `/cart` (cart and checkout), `/order/:id` (live status), `/reserve` (reservation form)

**Staff (unlinked from customer UI):** `/staff/login`, `/staff/kitchen` (kitchen + owner), `/staff/dashboard` (owner)

Owner dashboard sections: Reports, Menu management, Reservations, Tables, Settings.

- The customer's last order ID is kept in localStorage so they can return to the status page.
- Staff pages use a protected-route component that checks the token and role, redirecting to `/staff/login`. After login: `kitchen` → `/staff/kitchen`, `owner` → `/staff/dashboard`.
- The cart lives in a Zustand store (persisted to localStorage).

## 11. Build phases

Mark each item done in PROGRESS.md.

**Phase 1: Foundation**
- Monorepo, `.gitignore`, `.env.example` files
- Express app, Mongo connection, central error handler, health route
- All Mongoose models
- Auth: login, `/me`, auth and role middleware
- `seed.js`: owner, kitchen, sample categories, items, tables, default settings

**Phase 2: Menu**
- Owner CRUD for categories and menu items, image upload
- Client scaffold, routing, Tailwind
- Staff login page and protected routes
- Customer menu page with categories, images, option selection

**Phase 3: Cart and orders**
- Zustand cart, cart page, checkout (table number or takeaway)
- `POST /api/orders` with server-side pricing
- Order status page (polling for now)

**Phase 4: Realtime**
- Socket.io server and client setup
- Kitchen display with live orders and status buttons
- Customer status page updates live

**Phase 5: Reservations**
- Settings and Tables management
- Availability endpoint and booking form
- Owner reservation list with cancel

**Phase 6: Owner dashboard**
- Report endpoints (aggregation)
- Dashboard UI with Recharts: daily sales, order count, average order value, top items

**Phase 7: Polish and deploy**
- Mobile responsiveness, loading and error states
- Tests for order pricing and reservation availability
- Deploy to Atlas, Render, Vercel; generate the QR code from the live URL
