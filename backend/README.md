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
npm run dev              # Start development server with hot-reload
npm run build            # Build TypeScript to JavaScript
npm run start            # Start production server
npm test                 # Run tests
npm run test:db          # Run database tests
npm run lint             # Lint code
npm run format           # Format code with Prettier
```

## Database Commands

```bash
npm run db:init          # Initialize database (create schema)
npm run db:seed:admin    # Seed admin user only
npm run db:seed          # Seed admin user + test data
npm run test:db          # Run database test suite
```

## Project Structure

```
src/
├── index.ts          # Main entry point
├── database/         # Database layer (SQLite)
│   ├── schema.sql    # Complete SQL schema
│   ├── db.ts         # Database connection
│   ├── types.ts      # TypeScript definitions
│   ├── seed.ts       # Data seeding
│   ├── test-db.ts    # Test suite
│   ├── migrations/   # Migration system
│   └── README.md     # Database documentation
├── routes/           # API route handlers (TODO)
├── middleware/       # Express middleware (TODO)
├── services/         # Business logic (TODO)
├── config/           # Configuration (TODO)
└── utils/            # Utility functions (TODO)

tests/                # Test files
data/                 # SQLite database files (gitignored)
```

## Database

The backend uses SQLite with better-sqlite3 for data persistence. The database layer includes:

### Features
- Complete schema with 7 tables and 3 views
- Full TypeScript type definitions
- Migration system for schema versioning
- Data seeding for initial setup
- Comprehensive test suite (15 tests, 100% pass rate)

### Tables
1. **Users** - User accounts with role-based access
2. **Instances** - Minecraft server instances
3. **UserInstancePermissions** - Junior-Admin instance access
4. **SettingTemplates** - Reusable server configurations
5. **SharedUserGroups** - Shared whitelist/ops groups
6. **InstanceSharedGroups** - Instance-group relationships
7. **WhitelistRequests** - Player whitelist requests

### Default Admin Credentials
```
Username: admin
Email: admin@minecraft-kids.de
Password: admin123
```
**IMPORTANT**: Change these immediately in production!

For detailed database documentation, see [src/database/README.md](./src/database/README.md).

## API Endpoints

### Health Check
- `GET /health` - Health check endpoint

### Public
- `GET /api` - API information

(More endpoints to be added as development progresses)
