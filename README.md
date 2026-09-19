# StematelArt - Project Overview

StematelArt is a digital art community and commission platform for SMK Telkom Purwokerto. It allows creators and clients to showcase artwork, handle user profiles, manage commissions with integrated payment escrow, and explore community artwork.

## Main Features

- **Authentication**: User registration, login, logout, and token management via Laravel Sanctum.
- **Profiles**: User profile management and custom avatars.
- **Posts & Artworks**: Artwork upload, display, and categorization.
- **Commission & Escrow**: End-to-end commission workflows integrated with Midtrans payment escrow.
- **Social & Discovery Features**: Social feed (4), Discovery (5), and Ranking (6) features (currently implemented with mock data and local state in the frontend).

## Technology Stack

- **Backend**: Laravel 12 (PHP 8.2+)
- **Frontend**: React 18, TypeScript, Vite
- **Database**: PostgreSQL (local / Supabase) / SQLite (in-memory tests)
- **Storage**: Supabase / S3-compatible storage
- **Payments**: Midtrans Payment Gateway (Snap API)

## Repository Structure

```
.
├── Backend/          # Laravel REST API application
├── Frontend/         # React + TypeScript + Vite SPA application
├── frontend-legacy/  # Legacy frontend reference codebase
├── docs/             # Technical documentation and phase designs
└── .agents/          # Agent skills and workflow configurations
```

## Architecture

- **Backend**: Laravel RESTful API delivering JSON endpoints.
- **Frontend**: Single Page Application (SPA) built with React and Vite.
- **Authentication**: Bearer token authentication via Laravel Sanctum.
- **Storage**: Artwork files stored via Supabase S3-compatible storage driver; avatars stored locally/public disk.
- **API Proxy**: Local frontend Vite server proxies `/api` calls to backend (`http://localhost:8000`).

## Backend Setup

### Prerequisites

- PHP >= 8.2
- Composer
- PostgreSQL or SQLite extension

### Installation Steps

1. Navigate to the `Backend/` directory:
   ```bash
   cd Backend
   ```
2. Copy environment file:
   ```bash
   cp .env.example .env
   ```
3. Install dependencies:
   ```bash
   composer install
   ```
4. Generate application key:
   ```bash
   php artisan key:generate
   ```
5. Run database migrations:
   ```bash
   php artisan migrate
   ```
6. Run backend test suite:
   ```bash
   composer test
   # or: php artisan test
   ```

## Frontend Setup

### Prerequisites

- Node.js >= 18.x
- npm

### Installation Steps

1. Navigate to the `Frontend/` directory:
   ```bash
   cd Frontend
   ```
2. Copy environment file:
   ```bash
   cp .env.example .env.local
   ```
3. Configure `VITE_*` environment variables in `.env.local`:
   ```env
   VITE_MIDTRANS_ENV=sandbox
   VITE_MIDTRANS_SNAP_URL=https://app.sandbox.midtrans.com/snap/snap.js
   VITE_MIDTRANS_CLIENT_KEY=your_sandbox_client_key
   VITE_API_BASE_URL=http://localhost:8000/api
   ```
4. Install dependencies:
   ```bash
   npm install
   ```
5. Start development server:
   ```bash
   npm run dev
   ```
6. Build for production:
   ```bash
   npm run build
   ```

## Environment Setup

Key credentials requiring configuration before running full flows:

- **Database**: Configure `DB_CONNECTION`, `DB_HOST`, `DB_PORT`, `DB_DATABASE`, `DB_USERNAME`, `DB_PASSWORD` in `Backend/.env`.
- **Midtrans Integration**:
  - Backend (`Backend/.env`):
    ```env
    MIDTRANS_ENV=sandbox
    MIDTRANS_SERVER_KEY=your_midtrans_server_key
    MIDTRANS_CLIENT_KEY=your_midtrans_client_key
    MIDTRANS_IS_PRODUCTION=false
    ```
  - Frontend (`Frontend/.env.local`):
    ```env
    VITE_MIDTRANS_CLIENT_KEY=your_midtrans_client_key
    ```

## Database Setup

- **Migrations**: Run database migrations to prepare database schema:
  ```bash
  cd Backend
  php artisan migrate
  ```
- **Seeders**: Seed initial sample data:
  ```bash
  php artisan db:seed
  ```
- **Automated Tests**: Unit and integration tests run against an isolated in-memory SQLite database automatically configured in `Backend/phpunit.xml`.

## Running Locally

### Option 1: Docker Compose

Spin up PostgreSQL database, Laravel API backend, and React frontend simultaneously:
```bash
docker-compose up --build
```

### Option 2: Manual / Independent Servers

1. **Start Backend**:
   ```bash
   cd Backend
   php artisan serve --port=8000
   ```
2. **Start Frontend**:
   ```bash
   cd Frontend
   npm run dev
   ```

Access frontend at `http://localhost:3000` (or Vite assigned port) and backend API at `http://localhost:8000/api`.

## Testing

Run validation commands across both subprojects:

- **Backend Tests**:
  ```bash
  cd Backend
  composer test
  ```
- **Frontend Code Quality & Build**:
  ```bash
  cd Frontend
  npm run lint
  npm run build
  ```

## Commission & Escrow Overview

- Phase 12 Commission & Escrow functionality is technically implemented in the backend API and frontend workflows.
- Integration uses Midtrans Snap API for escrow deposit payments.
- **Sandbox Ready**: Configured to run against Midtrans Sandbox for development and testing.
- **External Blockers**: Webhook notifications and production Midtrans merchant activation require external verification and network accessibility (e.g. ngrok or live domain for webhook callbacks) prior to production go-live.

## Production Readiness Caveats

- **Mock Data Usage**: Frontend features for Social feed (4), Discovery (5), and Ranking (6) currently rely on mock data and local React state; API integration for these modules is pending future backend phases.
- **Manual Verification**: Production deployment requires manual verification of Midtrans webhooks, storage policies on Supabase, HTTPS enforcement, and production environment variables.

## Development Workflow

1. Keep backend logic within `Backend/` and frontend logic within `Frontend/`.
2. Ensure changes follow existing conventions (Laravel REST API patterns in `Backend/app/Http/Controllers/Api/`, React context/components in `Frontend/src/`).
3. Run backend tests (`composer test`) and frontend validation (`npm run lint` & `npm run build`) before submitting changes.
4. Keep `frontend-legacy/` untouched as it serves strictly for reference.

## Important Security Notes

- **Never Commit Secrets**: Do not commit `.env`, `APP_KEY`, API secrets, or Midtrans private keys to version control.
- **Token Security**: Laravel Sanctum tokens and session details must be stored securely.
- **Environment Isolation**: Always use sandbox keys for local testing and verify production keys are loaded via secure environment variable injection.

## Useful Commands

| Task | Command | Directory |
| --- | --- | --- |
| Run backend API | `php artisan serve` | `Backend/` |
| Run backend tests | `composer test` | `Backend/` |
| Run database migrations | `php artisan migrate` | `Backend/` |
| Seed database | `php artisan db:seed` | `Backend/` |
| Run frontend dev server | `npm run dev` | `Frontend/` |
| Lint frontend code | `npm run lint` | `Frontend/` |
| Build frontend | `npm run build` | `Frontend/` |
| Run full stack with Docker | `docker-compose up` | Root |
