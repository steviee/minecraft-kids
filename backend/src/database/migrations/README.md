# Database Migrations

This directory contains database migration files for incremental schema updates.

## Migration File Naming Convention

Migration files follow the pattern: `{ID}_{name}.sql`

Example: `001_add_user_avatar_field.sql`

- **ID**: Sequential number (001, 002, 003, etc.)
- **name**: Descriptive name using lowercase and underscores

## Creating a New Migration

You can create a new migration using the MigrationManager:

```typescript
import { MigrationManager } from './index';
import { getDatabase } from '../db';

const db = getDatabase();
const manager = new MigrationManager(db);
const filename = manager.createMigration('add_user_avatar_field');
```

Or manually create a file following the naming convention.

## Migration File Structure

```sql
-- Migration: Add user avatar field
-- Created: 2025-10-30T12:00:00.000Z
-- Description: Adds avatar_url field to Users table

ALTER TABLE Users ADD COLUMN avatar_url TEXT;
```

## Rollback Files (Optional)

For migrations that need rollback support, create a corresponding `.rollback.sql` file:

Example: `001_add_user_avatar_field.rollback.sql`

```sql
-- Rollback: Add user avatar field

ALTER TABLE Users DROP COLUMN avatar_url;
```

## Running Migrations

Migrations are automatically run during database initialization, but you can also run them manually:

```typescript
import { runMigrations } from './migrations';
import { getDatabase } from '../db';

const db = getDatabase();
runMigrations(db);
```

## Migration Tracking

Applied migrations are tracked in the `_migrations` table. This table is automatically created and should not be modified manually.

## Best Practices

1. **Never modify applied migrations** - Create a new migration instead
2. **Test migrations** - Always test on a backup database first
3. **Use transactions** - Migrations are automatically wrapped in transactions
4. **Keep migrations small** - One logical change per migration
5. **Add rollback files** - For production environments, always create rollback files
6. **Document changes** - Add clear descriptions in migration files

## Current Status

Check migration status:

```typescript
import { getMigrationStatus } from './migrations';
import { getDatabase } from '../db';

const db = getDatabase();
const status = getMigrationStatus(db);

console.log('Available:', status.available.length);
console.log('Applied:', status.applied.length);
console.log('Pending:', status.pending.length);
```
