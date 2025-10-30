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
├── routes/           # API route handlers
│   └── auth.routes.ts # Authentication endpoints
├── services/         # Business logic
│   └── auth.service.ts # Authentication service (bcrypt, JWT)
├── types/            # TypeScript type definitions
│   └── auth.types.ts  # Authentication types
├── middleware/       # Express middleware (TODO)
├── config/           # Configuration (TODO)
└── utils/            # Utility functions (TODO)

tests/                # Test files
├── index.test.ts     # Basic API tests
└── auth.test.ts      # Authentication tests (31 tests)
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

### Authentication (`/api/auth`)

All authentication endpoints for user registration, login, and token management.

#### Register User
```http
POST /api/auth/register
Content-Type: application/json

{
  "username": "john_doe",
  "email": "john@example.com",
  "password": "SecurePass123",
  "role": "junior-admin"
}
```

**Response** (201 Created):
```json
{
  "message": "User registered successfully",
  "user": {
    "id": 2,
    "username": "john_doe",
    "email": "john@example.com",
    "role": "junior-admin"
  }
}
```

**Validation Rules:**
- Username: 3-20 characters, alphanumeric + underscore
- Email: Valid email format
- Password: Min 8 characters, 1 uppercase, 1 lowercase, 1 number
- Role: "admin" or "junior-admin"

#### Login
```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "john@example.com",
  "password": "SecurePass123"
}
```

**Response** (200 OK):
```json
{
  "message": "Login successful",
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": 2,
    "username": "john_doe",
    "email": "john@example.com",
    "role": "junior-admin"
  }
}
```

**Tokens:**
- Access Token: Expires in 24 hours, used for API authentication
- Refresh Token: Expires in 7 days, used to get new access tokens

#### Refresh Access Token
```http
POST /api/auth/refresh
Content-Type: application/json

{
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Response** (200 OK):
```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "message": "Access token refreshed successfully"
}
```

### Error Responses

All endpoints return consistent error responses:

**400 Bad Request** - Validation error
```json
{
  "error": "Validation failed",
  "details": ["Password must be at least 8 characters"]
}
```

**401 Unauthorized** - Authentication failed
```json
{
  "error": "Invalid email or password"
}
```

**409 Conflict** - Duplicate resource
```json
{
  "error": "Email already exists"
}
```

**500 Internal Server Error** - Server error
```json
{
  "error": "Internal server error"
}
```

## Security

- **Password Hashing**: bcrypt with 12 salt rounds
- **JWT Authentication**: Separate access and refresh tokens
- **Token Expiration**: 24h for access, 7d for refresh
- **Environment Variables**: Secrets stored in .env (not in repo)
- **Validation**: Strict input validation for all auth endpoints

(More endpoints to be added as development progresses)
