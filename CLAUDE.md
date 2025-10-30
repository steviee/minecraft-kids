# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Workflow & Rules

**Issue-Driven Development**
- Every task must be described in a GitHub Issue before implementation
- Use `gh` CLI for all GitHub operations (issues, projects, wiki)
- Use `git` CLI for all source code operations (commit, push, branch)
- All tasks must be documented in their issue, tested, and marked complete
- Use GitHub Actions for automated testing and CI/CD where possible

**Code Quality Standards**
- NEVER use placeholders or TODO comments in code
- ALWAYS finish tasks completely before marking them done
- Use idiomatic code patterns for Node.js/Express backend and Vue frontend
- If new dependencies are discovered during implementation, create new GitHub Issues and manage dependencies using `gh` CLI

**Documentation Requirements**
- ALWAYS update README.md when functionality changes
- Document what's working and what's planned
- Keep CLAUDE.md up to date with architectural decisions

## Project Overview

**Minecraft Kids Server Management Suite** (`mck-suite`) is a comprehensive web-based multi-user platform for managing multiple modded Minecraft Java Edition server instances with role-based access control and a custom client launcher.

### Domain
Production: `minecraft-kids.de`
Server subdomain scheme: `<servername>.mc.minecraft-kids.de`

### Architecture Components

1. **Server Management Tool** (Backend + Frontend)
   - Multi-user web application with role-based permissions (Admin, Junior-Admin, Guest)
   - Backend: Node.js with Express + TypeScript
   - Frontend: Vue 3 with TypeScript and Composition API
   - Database: SQLite
   - Container orchestration: Docker (using itzg/minecraft-server)

2. **Custom Client Launcher** (Standalone Java application)
   - Single executable JAR file distributed via public website
   - JavaFX-based GUI
   - Auto-synchronization of Minecraft version, Fabric, and mods
   - Microsoft OAuth 2.0 authentication

3. **Network Integration**
   - Dynamic DNS via Unbound for `mc.minecraft-kids.de` zone
   - Add-on management (Simple Voice Chat, Geyser/Floodgate)

## Project Structure

```
/backend/          # Backend API and server management logic (NOT YET IMPLEMENTED)
/frontend/         # Web UI for admins and public status page (NOT YET IMPLEMENTED)
/launcher/         # Java/JavaFX custom client launcher (NOT YET IMPLEMENTED)
/docs/             # Comprehensive project documentation
  - prd.md         # Product Requirements Document (German)
  - tasks.md       # Detailed development roadmap with phases
```

## User Roles & Permissions

**Admin ("root")**
- Full system access
- Can create/manage/delete all instances
- Can create and assign users (Admins, Junior-Admins)
- Can modify system settings and DNS configuration

**Junior-Admin**
- Limited web interface access
- Can only see and manage assigned instances
- Can start/stop/restart servers, use console, manage whitelist
- Cannot create instances or modify system settings

**Guest (Public)**
- View public status page showing all servers and their online/offline status
- Download custom launcher
- Access to admin login page

## Database Schema (SQLite)

Core tables required:
- `Users` - User accounts with role (admin/junior-admin)
- `Instances` - Minecraft server instances (name is immutable after creation)
- `UserInstancePermissions` - Maps Junior-Admins to their allowed instances
- `SettingTemplates` - Reusable configuration templates (Admin feature)
- `SharedUserGroups` - Shared whitelist/ops groups (Admin feature)
- `WhitelistRequests` - Tracks failed login attempts for whitelist approval

## Development Phases

**Current Status**: Phase 0 (Project setup) - No implementation exists yet

### Milestone 1: Server Management Suite

**Phase 0**: Project Setup & Foundation (~1-2 days)
- Initialize Git structure with /backend and /frontend
- Create docker-compose.yml for local development
- Initialize backend project (Node.js/Express + TypeScript)
- Initialize frontend project (Vue 3 + TypeScript)
- Set up SQLite database with schema
- Create GitHub issues for all phases
- Set up GitHub Actions for CI/CD

**Phase 1**: User Authentication & Roles (~3-4 days)
- Implement JWT-based authentication with bcrypt password hashing
- Build RBAC middleware with role-based access control
- Create login UI and admin user management interface

**Phase 2**: Core Management Tool (~5-7 days)
- Implement Docker container management (create/start/stop/restart/delete)
- Build instance management API with RBAC protection
- Create admin dashboard and public status page
- Implement live console with WebSocket and RCON
- Build whitelist automation workflow

**Phase 3**: Network Integration & Deployment (~3-5 days)
- Implement Unbound DNS configuration generation
- Add-on management (Simple Voice Chat, Geyser/Floodgate)
- Production deployment with Docker Compose and Nginx

### Milestone 2: Custom Client Launcher

**Phase 4**: Launcher Development (~7-10 days)
- Build JavaFX application with Maven
- Implement server-pack.json synchronization
- Add Minecraft asset and library downloads
- Integrate Fabric installer automation
- Implement Microsoft OAuth 2.0 flow

**Phase 5**: Final Integration (~1-2 days)
- Host launcher JAR on web server
- Create server-pack.json manifest endpoint
- Write user documentation

## Key Technical Constraints

1. **Server name immutability**: Instance names cannot be changed after creation (used in DNS hostname)
2. **Fabric-first**: All mod support is Fabric-based
3. **Single JAR launcher**: Launcher must be one executable fat JAR (maven-shade-plugin)
4. **JWT authentication**: Backend uses JWT tokens for session management
5. **Port management**: Add-ons require dedicated UDP port allocation
6. **Container isolation**: Each Minecraft instance runs in its own Docker container

## Important Implementation Notes

### Backend Authentication
- Use bcrypt for password hashing
- JWT tokens must include user_id and role in payload
- RBAC middleware must extract instance_id from request parameters for Junior-Admin permission checks
- Protected endpoints: All `/api/*` except `/api/public/*` and `/api/auth/login`

### Docker Integration
- Service module must wrap docker commands (run, stop, start, logs)
- Container naming scheme must align with DNS scheme
- Instance creation must support Junior-Admin assignment and automatic ops.json entry

### Launcher Workaround
- Use separate Main class (non-JavaFX) to avoid packaging issues with JavaFX and maven-shade-plugin
- This Main class then launches the actual JavaFX Application class

### Whitelist Automation
- Log file watcher detects failed login attempts
- Shows as "Whitelist Requests" in UI
- One-click approval updates whitelist live via RCON or file modification

## Common Commands

### Documentation
```bash
cat docs/prd.md      # Product requirements (German)
cat docs/tasks.md    # Development roadmap
```

### Development
```bash
# Backend (Node.js/Express + TypeScript)
cd backend
npm install          # Install dependencies
npm run dev          # Start development server with hot-reload
npm run build        # Build TypeScript to JavaScript
npm test             # Run tests
npm run lint         # Run ESLint

# Frontend (Vue 3 + TypeScript)
cd frontend
npm install          # Install dependencies
npm run dev          # Start Vite dev server
npm run build        # Build for production
npm run preview      # Preview production build
npm test             # Run tests
npm run lint         # Run ESLint

# Docker
docker-compose up -d    # Start all services
docker-compose down     # Stop all services
docker-compose logs -f  # View logs
```

### GitHub Workflow
```bash
# Issues
gh issue list                    # List all issues
gh issue view <number>           # View specific issue
gh issue create                  # Create new issue
gh issue close <number>          # Close issue

# Repository
gh repo view                     # View repo details
gh pr list                       # List pull requests
gh workflow list                 # List GitHub Actions workflows
gh run list                      # List workflow runs
```

## Documentation

All project documentation is in German and located in `/docs/`:
- **prd.md**: Complete product requirements document (Vision, user roles, features, technical requirements)
- **tasks.md**: Phased development plan with acceptance criteria and technical todos

Refer to these documents for detailed feature specifications and implementation guidance.

## MCP Integration

The project has MCP server configuration in `.mcp.json` with:
- Gitea integration (enabled) - Git server at https://git.deltacity.org
- Playwright, Stripe, Browser (all disabled)

When working with version control, the Gitea MCP tools are available for repository operations.
- ALWAYS use a feature branch for every issue and create a pull request with proper description when the issue is done.
- ALWAYS keep the issue documentation up-to-date and close issues with their respective PRs.