# ARDNET — Farm-to-Market Price Exchange

This folder contains the ARDNET capstone project's source-code workspace, copied from the original local `ARDNET_GUI` directory for collaboration inside the FMPEX GitHub repository.

> **Repository layout:** This is a self-contained copy of ARDNET source code. It does **not** overwrite or automatically replace the existing `FMPEX/ArdNet` application. Review the applications and test their configurations before choosing a single deployment target.

## Project overview

ARDNET helps farmers publish produce listings and lets buyers browse listings and view reference market prices. The project also includes role-based dashboards, authentication, weather information, and notification/alert features. The codebase has developed additional integrations such as email notifications, a message broker, and a SOAP/XML market-information interface; confirm the status of each feature in the current checkout before demonstrating it.

## Directory guide

```text
ARDNET_Source_Code/
├── ARDNET_Frontend/             React + Vite user interface
│   ├── public/                 Static assets
│   ├── src/                    Application source
│   │   ├── api/                HTTP client, endpoint configuration and services
│   │   ├── components/         Reusable UI components
│   │   ├── context/            React context providers
│   │   ├── features/           Feature-oriented UI modules
│   │   ├── hooks/              Reusable React hooks
│   │   ├── layout/             Shared page and dashboard layouts
│   │   ├── pages/              Route-level screens
│   │   ├── redux/              Global application state
│   │   ├── styles/             SCSS and styling
│   │   └── utils/              Shared helpers
│   └── package.json           Frontend dependencies and scripts
├── ARDNET_Backend/              Node.js + Express APIs and workers
│   ├── src/
│   │   ├── config/             PostgreSQL and other configuration
│   │   ├── controllers/        Request handling and business rules
│   │   ├── middleware/         JWT verification and role checks
│   │   ├── routes/             REST endpoint definitions
│   │   ├── services/           Integration and domain services
│   │   └── server.js           Express server entry point
│   ├── migrations/             Database migration files (if present)
│   ├── scripts/                Utilities (if present)
│   ├── examples/               Integration examples (if present)
│   ├── tests/                  Tests (if present)
│   └── package.json           Backend dependencies and scripts
├── docs/
│   └── SOURCE_CODE_GUIDE.md    Architecture, communication and workflow guide
├── .gitignore                  Local/dependency/secret exclusions
└── ...                         Other original root-level files and folders
```

The tree is an orientation guide based on the ARDNET project structure discussed during development; the exact files and optional directories may differ in this snapshot. Any original root-level `src/` or `public/` directory is retained when present and should be evaluated before use, rather than silently treated as the canonical frontend.

## How the applications communicate

1. **React UI:** Pages and feature components call functions in `ARDNET_Frontend/src/api/`.
2. **HTTP requests:** The shared API client sends JSON requests to the Express backend (historically `http://localhost:5000`) and adds the JWT `Authorization: Bearer <token>` header to protected requests.
3. **Backend routing and security:** Express routes under `/api/...` pass requests through authentication/authorization middleware as needed, then to controllers.
4. **Database access:** Controllers/services use the PostgreSQL connection pool to read or write users, listings, prices, alerts, notifications, and audit records.
5. **External integrations:** Weather information uses Open-Meteo; transactional email uses Brevo. RabbitMQ-based price-alert notifications involve a publisher and worker when those services are enabled. A SOAP/XML market-information service may also be present; check its current route and implementation.

See **[docs/SOURCE_CODE_GUIDE.md](docs/SOURCE_CODE_GUIDE.md)** for request flows, directory responsibilities, and integration details.

## Local setup

### Prerequisites

- A Node.js version compatible with the `package.json` files
- PostgreSQL with the ARDNET schema and appropriate test data
- Optional: Docker/RabbitMQ for queued alerts, plus service credentials for Brevo and other integrations

### Backend

```powershell
cd ARDNET_Source_Code\ARDNET_Backend
npm install
node src/server.js
```

The backend has previously used port `5000`. Verify the active port in configuration. Use `npm run` to inspect scripts supported by this checkout.

### Frontend

In a second terminal:

```powershell
cd ARDNET_Source_Code\ARDNET_Frontend
npm install
npm run dev
```

Vite normally displays the exact local URL in the terminal (often `http://localhost:5173`). Check the frontend API configuration in `src/api/config.js` and align it with your running backend.

### Environment configuration — important

**Do not commit the actual `.env` file, passwords, API tokens, database dumps containing private data, or private keys.** The source-code copy deliberately omits environment files. ARDNET previously used a shared `.env` at the original project root; confirm the backend's actual dotenv path before creating `ARDNET_Source_Code/.env` locally. Provide necessary variables to collaborators through a secure channel. If you add an `.env.example`, use placeholders only.

Common integration categories include PostgreSQL connection details, JWT secrets, Brevo email credentials, RabbitMQ connection settings, and any optional external-service settings. **Use the variable names found in the actual source files**, rather than assuming the names from this guide.

## Collaboration and safety

- Work on a feature branch and open a pull request for review.
- Keep `package.json` and lockfiles tracked so dependencies are reproducible.
- Ignore `node_modules/`, build output, `.env*` secrets, logs, archives and local backups.
- Review the entire staged file list before committing.
- Source-code upload is not the same as deployment: configure the database/services and run authentication, listing, market, and notification tests separately.

## Related documentation

- [Source code structure and communication](docs/SOURCE_CODE_GUIDE.md)
