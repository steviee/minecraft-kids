# Database Module

SQLite database layer for the Minecraft Kids Server Management Suite.

## Overview

This module provides a complete database implementation using SQLite and better-sqlite3, including:

- **Schema Management**: Comprehensive SQL schema with 7 tables and 3 views
- **Type Safety**: Full TypeScript type definitions for all database models
- **Migrations**: Version-controlled database migrations system
- **Seeding**: Initial data seeding with admin user creation
- **Testing**: Comprehensive test suite for validation

## Database Schema

### Core Tables

1. **Users** - User accounts with role-based access (admin, junior-admin)
2. **Instances** - Minecraft server instances (name is immutable after creation)
3. **UserInstancePermissions** - Maps Junior-Admins to their allowed instances
4. **SettingTemplates** - Reusable configuration templates (Admin feature)
5. **SharedUserGroups** - Shared whitelist/ops groups (Admin feature)
6. **InstanceSharedGroups** - Many-to-many relationship between Instances and SharedUserGroups
7. **WhitelistRequests** - Tracks failed login attempts for whitelist approval

### Views

- **InstancePermissionsView** - Instance permissions with user details
- **PendingWhitelistRequestsView** - Pending whitelist requests with instance details
- **InstanceStatsView** - Instance statistics with counts

### Features

- Foreign key constraints enabled and enforced
- Automatic timestamp updates via triggers
- Comprehensive indexes for performance
- Unique constraints for data integrity
- Cascading deletes where appropriate

## File Structure

```
src/database/
├── schema.sql           # Complete SQL schema definition
├── db.ts                # Database connection and initialization
├── types.ts             # TypeScript type definitions
├── seed.ts              # Data seeding functionality
├── index.ts             # Main module exports
├── test-db.ts           # Comprehensive test suite
├── migrations/          # Migration files directory
│   ├── index.ts         # Migration system implementation
│   └── README.md        # Migration documentation
└── README.md            # This file
```

## Usage

### Initialize Database

```typescript
import { initializeDatabase } from './database';

await initializeDatabase();
```

### Get Database Instance

```typescript
import { getDatabase } from './database';

const db = getDatabase();
```

### Seed Admin User

```typescript
import { seedAdminUser, getDatabase } from './database';

await seedAdminUser(getDatabase(), {
  adminUsername: 'admin',
  adminEmail: 'admin@minecraft-kids.de',
  adminPassword: 'securepassword123'
});
```

### Seed Test Data (Development Only)

```typescript
import { seedDatabase, getDatabase } from './database';

await seedDatabase(getDatabase(), {
  includeTestData: true
});
```

### Using Prepared Statements

```typescript
import { getDatabase } from './database';
import { User } from './database/types';

const db = getDatabase();

const stmt = db.prepare('SELECT * FROM Users WHERE username = ?');
const user = stmt.get('admin') as User;
```

### Transactions

```typescript
import { dbConnection } from './database';

const result = dbConnection.transaction(() => {
  // All operations here are atomic
  const stmt = db.prepare('INSERT INTO Users ...');
  stmt.run(...);
  return true;
});
```

## NPM Scripts

```bash
# Run database tests
npm run test:db

# Initialize database (creates schema)
npm run db:init

# Seed admin user only
npm run db:seed:admin

# Seed admin user + test data
npm run db:seed
```

## Type Definitions

All database models have corresponding TypeScript interfaces:

```typescript
import type {
  User,
  Instance,
  UserInstancePermission,
  SettingTemplate,
  SharedUserGroup,
  WhitelistRequest,
  CreateUserData,
  CreateInstanceData
  // ... and more
} from './database/types';
```

## Migration System

The migration system allows for incremental schema updates:

### Create a Migration

```typescript
import { MigrationManager } from './database/migrations';
import { getDatabase } from './database';

const manager = new MigrationManager(getDatabase());
manager.createMigration('add_user_avatar_field');
```

### Run Pending Migrations

```typescript
import { runMigrations } from './database/migrations';
import { getDatabase } from './database';

runMigrations(getDatabase());
```

### Check Migration Status

```typescript
import { getMigrationStatus } from './database/migrations';
import { getDatabase } from './database';

const status = getMigrationStatus(getDatabase());
console.log('Pending migrations:', status.pending.length);
```

See [migrations/README.md](./migrations/README.md) for detailed migration documentation.

## Database Configuration

Configure the database via environment variables:

```bash
# Database file path (default: ./data/mck-suite.db)
DATABASE_PATH=/path/to/database.db

# Environment (development enables verbose logging)
NODE_ENV=development
```

## Security Considerations

1. **Password Hashing**: All passwords are hashed using bcrypt (saltRounds=10)
2. **Foreign Keys**: Enabled and enforced for referential integrity
3. **Prepared Statements**: Always use prepared statements to prevent SQL injection
4. **Role Validation**: User roles are checked via SQL constraints
5. **Immutable Fields**: Instance name cannot be changed after creation

## Testing

Run the comprehensive test suite:

```bash
npm run test:db
```

The test suite validates:
- Database initialization
- Schema creation
- Foreign key constraints
- Table and view existence
- Index and trigger creation
- CRUD operations
- Constraint enforcement
- Timestamp triggers
- Transactions

## Default Admin Credentials

When seeding the database, the default admin credentials are:

```
Username: admin
Email: admin@minecraft-kids.de
Password: admin123
```

**IMPORTANT**: Change these credentials immediately in production!

## Database Statistics

Get database statistics:

```typescript
import { dbConnection } from './database';

const stats = dbConnection.getStats();
console.log(`Database size: ${stats.size} bytes`);
console.log(`Tables: ${stats.tables.length}`);
```

## Backup and Optimization

### Create Backup

```typescript
import { dbConnection } from './database';

await dbConnection.backup('./backups/mck-suite-backup.db');
```

### Optimize Database

```typescript
import { dbConnection } from './database';

dbConnection.optimize(); // Runs VACUUM and ANALYZE
```

## Troubleshooting

### Foreign Key Constraint Errors

If you encounter foreign key constraint errors, ensure:
1. Foreign keys are enabled: `PRAGMA foreign_keys = ON`
2. Referenced records exist before creating relationships
3. Deletion order respects foreign key constraints

### Database Locked Errors

SQLite uses file-level locking. If you encounter locked database errors:
1. Close all connections properly
2. Use transactions for multiple operations
3. Avoid long-running transactions

### Schema Changes

Never modify applied migrations. Instead:
1. Create a new migration file
2. Apply the changes incrementally
3. Test on a backup database first

## Performance Tips

1. **Use Indexes**: Indexes are already created for common queries
2. **Use Transactions**: Batch operations in transactions for better performance
3. **Prepared Statements**: Reuse prepared statements for repeated queries
4. **VACUUM**: Periodically run `dbConnection.optimize()` to reclaim space
5. **Analyze**: The ANALYZE command updates query optimizer statistics

## Integration with Express

Example integration in your Express app:

```typescript
import express from 'express';
import { initializeDatabase, closeDatabase, seedAdminUser, getDatabase } from './database';

const app = express();

// Initialize database on startup
async function startup() {
  try {
    await initializeDatabase();
    await seedAdminUser(getDatabase());

    app.listen(3000, () => {
      console.log('Server running on port 3000');
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

// Cleanup on shutdown
process.on('SIGINT', () => {
  closeDatabase();
  process.exit(0);
});

startup();
```

## Next Steps

After database implementation, the following modules should be developed:

1. **Repository Layer**: Data access layer with business logic
2. **Authentication Middleware**: JWT-based authentication
3. **RBAC Middleware**: Role-based access control
4. **API Routes**: RESTful endpoints for database operations

## Support

For issues or questions about the database implementation:
1. Check the test suite for usage examples
2. Review the schema.sql for table structures
3. Consult the TypeScript types for data models
4. See the migration documentation for schema updates
