# CureOS — Hospital Information System

A modular, production-ready clinical operations platform built with **Next.js + TypeScript**. CureOS provides role-based dashboards, a robust RBAC system, PDF reporting, real database analytics, and end-to-end developer documentation so teams can ship hospital workflows reliably.

---

## Quick description
A secure, extensible hospital back-office platform that unifies patient workflows, permissions, and document exports into a single developer-friendly codebase.

## Key features 
- Role-based dashboards (Admin, Doctor, Nurse, Pharmacist, Lab Tech, Reception)
- Fine-grained RBAC with emergency override and audit trails
- PDF export and printable reports (server-side + client helpers)
- Real DB-driven analytics and charts (Postgres + Prisma)
- Real-time updates via Socket.io (live dashboards)
- Mobile-first, accessible UI (Tailwind, shadcn/ui)
- Comprehensive docs and automated tests (Vitest)

## Tech stack 🔧
- Frontend: Next.js 15, React 19, TypeScript, Tailwind CSS
- UI: shadcn/ui, Framer Motion, Lucide icons
- Backend: Next.js API routes, NextAuth.js (session + auth)
- Database: PostgreSQL + Prisma
- Real-time: Socket.io
- Testing / tooling: Vitest, ESLint, Prettier, Prisma

---

## Getting started — fast (30–60s)
1. Clone:
   ```bash
   git clone https://github.com/<org>/<repo>.git
   cd cureos-hospital-system
   ```
2. Install:
   ```bash
   npm install
   ```
3. Create env and configure (see `docs/QUICK_START.md`):
   ```bash
   cp .env.example .env
   # set DATABASE_URL, NEXTAUTH_SECRET, RBAC_* credentials
   ```
4. Prepare DB & seed:
   ```bash
   npx prisma generate
   npx prisma db push        # or `npm run migrate:dev` for migrations
   npm run prisma:seed
   ```
5. Run app:
   ```bash
   npm run dev
   # open http://localhost:3000
   ```

> Tip: run `npm run test` to verify the test-suite and `npm run lint` for linting.

### Important env vars (minimum)
- DATABASE_URL — Postgres connection
- NEXTAUTH_SECRET — session signing key
- NEXT_PUBLIC_APP_URL — app origin for callbacks
- RBAC_ADMIN_EMAIL / RBAC_ADMIN_PASSWORD — seed admin account

For a full list and examples see: `docs/QUICK_START.md` and `prisma/seed-rbac.ts`.

## Project structure (high level)
- `app/` — Next.js app routes, pages & role-based layouts
- `components/` — UI primitives & dashboard components
- `lib/` — utilities, Prisma client, auth helpers
- `services/` — business logic and API integrations
- `prisma/` — schema.prisma, seeds, migrations
- `public/` — static assets
- `docs/` — architecture, guides, API reference
- `tests/` — unit & integration tests (Vitest)

See `docs/` for deeper module-level documentation and architecture notes.

---

## Tests & CI
- Unit / integration tests: `npm test` (Vitest)
- Test files: `tests/` and `tests/integration/`
- Recommended CI: run `npm ci && npm run lint && npm run test && npm run build`

---

## Security & Compliance
- RBAC-first design, audit logging, and time-limited emergency overrides
- Review `docs/COMPREHENSIVE_RBAC_GUIDE.md` for implementation details
- Do not commit credentials; use environment variables and secrets manager for production

---

## Scripts (most-used)
```bash
npm install
npm run dev         # local dev
npm run build       # production build
npm start           # run production
npm run test        # run test suite
npm run migrate:dev # prisma migrate (dev)
npm run prisma:seed # seed RBAC and demo data
```

---

## Contributing
We welcome contributions and improvements.
- Open an issue to discuss large changes
- Fork → branch → PR against `main`
- Include tests & documentation for new features

PR checklist:
- Reproducible locally
- Tests added/updated
- Docs updated (`docs/` or `README.md`)
- No secrets in the commit history

---

## License
This repository is **proprietary — all rights reserved**. To open-source, add an SPDX `LICENSE` (e.g. MIT) and update this section.

---

## Support & contact
- Read the docs: `docs/` (quick start, API reference, architecture)
- Report bugs / request features: open an issue on GitHub
- For commercial support or onboarding: contact the maintainers via repository settings

---

If you want, I can also:
- Add CI/coverage badges to the top of this README ✅
- Create `CONTRIBUTING.md` and issue/PR templates ✅
- Produce a short repo summary for the GitHub description and social preview ✅

