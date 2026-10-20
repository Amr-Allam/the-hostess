# PROGRESS

## Phase 1: Foundation

- [x] Monorepo, `.gitignore`, `.env.example` files
- [x] Express app, Mongo connection, central error handler, health route
- [ ] Zod `validate` middleware
- [ ] All Mongoose models
- [ ] Auth: login, `/me`, auth and role middleware
- [ ] `seed.js`

## Notes

- `GET /api/health` returns `{ status, db }`.
- Settings `openingHours` keys are lowercase `monday`…`sunday`.
