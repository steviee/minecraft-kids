-- SQLite Database Schema for Minecraft Kids Server Management Suite
-- This schema defines the complete database structure for managing
-- Minecraft server instances with role-based access control

-- Enable foreign key constraints
PRAGMA foreign_keys = ON;

-- ============================================================================
-- Users Table
-- Stores user accounts with role-based access (admin, junior-admin)
-- ============================================================================
CREATE TABLE IF NOT EXISTS Users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    role TEXT NOT NULL CHECK (role IN ('admin', 'junior-admin')),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Index for faster username lookups during authentication
CREATE INDEX IF NOT EXISTS idx_users_username ON Users(username);

-- Index for email lookups
CREATE INDEX IF NOT EXISTS idx_users_email ON Users(email);

-- Index for role-based queries
CREATE INDEX IF NOT EXISTS idx_users_role ON Users(role);

-- ============================================================================
-- Instances Table
-- Stores Minecraft server instances with configuration
-- IMPORTANT: instance name is immutable after creation (used in DNS)
-- ============================================================================
CREATE TABLE IF NOT EXISTS Instances (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT UNIQUE NOT NULL,
    minecraft_version TEXT,
    fabric_version TEXT,
    server_port INTEGER UNIQUE,
    rcon_port INTEGER UNIQUE,
    rcon_password TEXT,
    voice_chat_port INTEGER UNIQUE,
    geyser_enabled INTEGER DEFAULT 0 CHECK (geyser_enabled IN (0, 1)),
    geyser_port INTEGER UNIQUE,
    max_players INTEGER DEFAULT 20,
    memory_allocation TEXT DEFAULT '2G',
    status TEXT DEFAULT 'stopped' CHECK (status IN ('running', 'stopped', 'starting', 'stopping', 'error')),
    container_id TEXT,
    created_by INTEGER NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (created_by) REFERENCES Users(id) ON DELETE RESTRICT
);

-- Index for name lookups (DNS hostname generation)
CREATE INDEX IF NOT EXISTS idx_instances_name ON Instances(name);

-- Index for status queries (dashboard filtering)
CREATE INDEX IF NOT EXISTS idx_instances_status ON Instances(status);

-- Index for creator queries
CREATE INDEX IF NOT EXISTS idx_instances_created_by ON Instances(created_by);

-- ============================================================================
-- UserInstancePermissions Table
-- Maps Junior-Admins to their allowed instances
-- Admins have access to all instances by default (not stored here)
-- ============================================================================
CREATE TABLE IF NOT EXISTS UserInstancePermissions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    instance_id INTEGER NOT NULL,
    granted_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    granted_by INTEGER NOT NULL,
    FOREIGN KEY (user_id) REFERENCES Users(id) ON DELETE CASCADE,
    FOREIGN KEY (instance_id) REFERENCES Instances(id) ON DELETE CASCADE,
    FOREIGN KEY (granted_by) REFERENCES Users(id) ON DELETE RESTRICT,
    UNIQUE(user_id, instance_id)
);

-- Index for user permission lookups
CREATE INDEX IF NOT EXISTS idx_user_instance_permissions_user ON UserInstancePermissions(user_id);

-- Index for instance permission queries
CREATE INDEX IF NOT EXISTS idx_user_instance_permissions_instance ON UserInstancePermissions(instance_id);

-- ============================================================================
-- SettingTemplates Table
-- Reusable configuration templates for server instances (Admin feature)
-- Templates contain common server configurations (mods, settings, etc.)
-- ============================================================================
CREATE TABLE IF NOT EXISTS SettingTemplates (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT UNIQUE NOT NULL,
    description TEXT,
    minecraft_version TEXT,
    fabric_version TEXT,
    memory_allocation TEXT DEFAULT '2G',
    max_players INTEGER DEFAULT 20,
    mods_config TEXT,
    server_properties TEXT,
    created_by INTEGER NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (created_by) REFERENCES Users(id) ON DELETE RESTRICT
);

-- Index for template name lookups
CREATE INDEX IF NOT EXISTS idx_setting_templates_name ON SettingTemplates(name);

-- Index for creator queries
CREATE INDEX IF NOT EXISTS idx_setting_templates_created_by ON SettingTemplates(created_by);

-- ============================================================================
-- SharedUserGroups Table
-- Shared whitelist/ops groups that can be assigned to multiple instances
-- Allows centralized management of player permissions across servers
-- ============================================================================
CREATE TABLE IF NOT EXISTS SharedUserGroups (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT UNIQUE NOT NULL,
    description TEXT,
    group_type TEXT NOT NULL CHECK (group_type IN ('whitelist', 'ops', 'both')),
    player_list TEXT NOT NULL,
    created_by INTEGER NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (created_by) REFERENCES Users(id) ON DELETE RESTRICT
);

-- Index for group name lookups
CREATE INDEX IF NOT EXISTS idx_shared_user_groups_name ON SharedUserGroups(name);

-- Index for group type filtering
CREATE INDEX IF NOT EXISTS idx_shared_user_groups_type ON SharedUserGroups(group_type);

-- ============================================================================
-- InstanceSharedGroups Table
-- Many-to-many relationship between Instances and SharedUserGroups
-- ============================================================================
CREATE TABLE IF NOT EXISTS InstanceSharedGroups (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    instance_id INTEGER NOT NULL,
    group_id INTEGER NOT NULL,
    assigned_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    assigned_by INTEGER NOT NULL,
    FOREIGN KEY (instance_id) REFERENCES Instances(id) ON DELETE CASCADE,
    FOREIGN KEY (group_id) REFERENCES SharedUserGroups(id) ON DELETE CASCADE,
    FOREIGN KEY (assigned_by) REFERENCES Users(id) ON DELETE RESTRICT,
    UNIQUE(instance_id, group_id)
);

-- Index for instance group queries
CREATE INDEX IF NOT EXISTS idx_instance_shared_groups_instance ON InstanceSharedGroups(instance_id);

-- Index for group instance queries
CREATE INDEX IF NOT EXISTS idx_instance_shared_groups_group ON InstanceSharedGroups(group_id);

-- ============================================================================
-- WhitelistRequests Table
-- Tracks failed login attempts from non-whitelisted players
-- Admins/Junior-Admins can approve requests to update whitelist
-- ============================================================================
CREATE TABLE IF NOT EXISTS WhitelistRequests (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    instance_id INTEGER NOT NULL,
    player_name TEXT NOT NULL,
    player_uuid TEXT,
    request_timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
    ip_address TEXT,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'denied', 'expired')),
    approved_by INTEGER,
    approved_at DATETIME,
    denial_reason TEXT,
    FOREIGN KEY (instance_id) REFERENCES Instances(id) ON DELETE CASCADE,
    FOREIGN KEY (approved_by) REFERENCES Users(id) ON DELETE SET NULL
);

-- Index for instance whitelist requests
CREATE INDEX IF NOT EXISTS idx_whitelist_requests_instance ON WhitelistRequests(instance_id);

-- Index for player name lookups
CREATE INDEX IF NOT EXISTS idx_whitelist_requests_player ON WhitelistRequests(player_name);

-- Index for status filtering (pending requests dashboard)
CREATE INDEX IF NOT EXISTS idx_whitelist_requests_status ON WhitelistRequests(status);

-- Composite index for finding pending requests for an instance
CREATE INDEX IF NOT EXISTS idx_whitelist_requests_instance_status ON WhitelistRequests(instance_id, status);

-- ============================================================================
-- Triggers for automatic timestamp updates
-- ============================================================================

-- Update timestamp trigger for Users
CREATE TRIGGER IF NOT EXISTS update_users_timestamp
AFTER UPDATE ON Users
FOR EACH ROW
BEGIN
    UPDATE Users SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
END;

-- Update timestamp trigger for Instances
CREATE TRIGGER IF NOT EXISTS update_instances_timestamp
AFTER UPDATE ON Instances
FOR EACH ROW
BEGIN
    UPDATE Instances SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
END;

-- Update timestamp trigger for SettingTemplates
CREATE TRIGGER IF NOT EXISTS update_setting_templates_timestamp
AFTER UPDATE ON SettingTemplates
FOR EACH ROW
BEGIN
    UPDATE SettingTemplates SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
END;

-- Update timestamp trigger for SharedUserGroups
CREATE TRIGGER IF NOT EXISTS update_shared_user_groups_timestamp
AFTER UPDATE ON SharedUserGroups
FOR EACH ROW
BEGIN
    UPDATE SharedUserGroups SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
END;

-- ============================================================================
-- Views for common queries
-- ============================================================================

-- View for instance permissions with user details
CREATE VIEW IF NOT EXISTS InstancePermissionsView AS
SELECT
    uip.id,
    uip.user_id,
    u.username,
    u.email,
    u.role,
    uip.instance_id,
    i.name AS instance_name,
    i.status AS instance_status,
    uip.granted_at,
    uip.granted_by,
    gb.username AS granted_by_username
FROM UserInstancePermissions uip
JOIN Users u ON uip.user_id = u.id
JOIN Instances i ON uip.instance_id = i.id
JOIN Users gb ON uip.granted_by = gb.id;

-- View for pending whitelist requests with instance details
CREATE VIEW IF NOT EXISTS PendingWhitelistRequestsView AS
SELECT
    wr.id,
    wr.instance_id,
    i.name AS instance_name,
    wr.player_name,
    wr.player_uuid,
    wr.request_timestamp,
    wr.ip_address
FROM WhitelistRequests wr
JOIN Instances i ON wr.instance_id = i.id
WHERE wr.status = 'pending'
ORDER BY wr.request_timestamp DESC;

-- View for instance statistics
CREATE VIEW IF NOT EXISTS InstanceStatsView AS
SELECT
    i.id,
    i.name,
    i.status,
    i.minecraft_version,
    i.max_players,
    i.created_at,
    u.username AS created_by_username,
    (SELECT COUNT(*) FROM UserInstancePermissions WHERE instance_id = i.id) AS assigned_users_count,
    (SELECT COUNT(*) FROM WhitelistRequests WHERE instance_id = i.id AND status = 'pending') AS pending_whitelist_count
FROM Instances i
JOIN Users u ON i.created_by = u.id;
