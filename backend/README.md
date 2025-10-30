# MCK Suite Backend

Backend API for Minecraft Kids Server Management Suite.

## Tech Stack

- **Runtime**: Node.js
- **Framework**: Express.js
- **Language**: TypeScript
- **Database**: SQLite (better-sqlite3)
- **Container Management**: Docker (dockerode)
- **Authentication**: JWT + bcrypt
- **Testing**: Vitest

## Setup

1. Install dependencies:
```bash
npm install
```

2. Copy environment file:
```bash
cp .env.example .env
```

3. Update `.env` with your configuration

## Development

```bash
npm run dev     # Start development server with hot-reload
npm run build   # Build TypeScript to JavaScript
npm run start   # Start production server
npm test        # Run tests
npm run lint    # Lint code
npm run format  # Format code with Prettier
```

## Project Structure

```
src/
├── index.ts          # Main entry point
├── routes/           # API route handlers
├── middleware/       # Express middleware (auth, RBAC)
├── services/         # Business logic (Docker, DB)
├── models/           # Data models and interfaces
├── config/           # Configuration
└── utils/            # Utility functions

tests/                # Test files
```

## API Endpoints

### Health Check
- `GET /health` - Health check endpoint

### Public
- `GET /api` - API information

(More endpoints to be added as development progresses)
