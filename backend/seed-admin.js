/**
 * Quick seed script to create admin user
 */
const Database = require('better-sqlite3');
const bcrypt = require('bcrypt');
const path = require('path');

async function seedAdmin() {
  const dbPath = path.join(__dirname, 'data', 'mck-suite.db');
  const db = new Database(dbPath);

  // Check if admin exists
  const existing = db.prepare('SELECT id FROM Users WHERE username = ?').get('admin');

  if (existing) {
    console.log('Admin user already exists');
    db.close();
    return;
  }

  console.log('Creating admin user...');

  const passwordHash = await bcrypt.hash('admin123', 10);

  const stmt = db.prepare(`
    INSERT INTO Users (username, email, password_hash, role)
    VALUES (?, ?, ?, ?)
  `);

  stmt.run('admin', 'admin@minecraft-kids.de', passwordHash, 'admin');

  console.log('Admin user created successfully!');
  console.log('Username: admin');
  console.log('Password: admin123');
  console.log('IMPORTANT: Change this password in production!');

  db.close();
}

seedAdmin().catch(console.error);
