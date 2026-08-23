# Agent Instructions

## Scope

- This repository contains a Laravel REST API in `Backend/` and a TypeScript/React/Vite app in `frontend/`.
- Treat `frontend-legacy/` as reference or legacy code unless the task explicitly targets it.
- Keep changes minimal and local. Do not refactor, rename, add features, or change unrelated files without a direct requirement.
- Follow existing patterns in the nearest implementation and preserve public APIs unless the task requires a contract change.

## Validation

- Backend: run `composer test` or `php artisan test` from `Backend/`.
- Frontend: run `npm run lint` and `npm run build` from `frontend/` as applicable.
- Frontend `/api` requests proxy to the backend at `http://localhost:8000` via `frontend/vite.config.ts`.
- Backend tests use in-memory SQLite; local development may use PostgreSQL/Supabase. Check environment configuration before database-related work.

## Boundaries

- Frontend entry and routing: `frontend/src/main.tsx`, `frontend/src/App.tsx`.
- Frontend pages, reusable components, shared context, services, types, and mock data live under their corresponding `frontend/src/` directories.
- Backend API routes are in `Backend/routes/api.php`; controllers are under `Backend/app/Http/Controllers/Api/`.
- Authentication uses Laravel Sanctum. Do not assume non-auth application data is already backed by the API; much of the frontend currently uses mock data and local state.
- Do not commit `Backend/.env`, credentials, `APP_KEY`, or database secrets.

## Documentation

- Backend setup and architecture: [Backend/backend.md](Backend/backend.md)
- Frontend structure: [frontend/README.md](frontend/README.md)
- Legacy product context: [frontend-legacy/README.md](frontend-legacy/README.md)
