# Minecraft Kids Server Management Suite

A comprehensive web-based multi-user platform for managing multiple modded Minecraft Java Edition server instances with role-based access control and a custom client launcher.

## 🎯 Project Status

**Current Phase:** Phase 0 - Project Setup ✅

### Milestone 1: Server Management Suite (In Progress)
- [x] Project structure initialized
- [x] Backend setup (Node.js/Express + TypeScript)
- [x] Frontend setup (Vue 3 + TypeScript)
- [x] Development environment (Docker Compose)
- [x] GitHub Issues created for all phases
- [x] CI/CD workflows configured
- [ ] Database schema implementation
- [ ] Authentication system
- [ ] Instance management
- [ ] Deployment

### Milestone 2: Custom Client Launcher (Planned)
- [ ] JavaFX launcher foundation
- [ ] Client synchronization
- [ ] Microsoft OAuth integration
- [ ] Game launch implementation

## 🏗️ Architecture

### Components

1. **Server Management Tool** (Backend + Frontend)
   - Multi-user web application with RBAC (Admin, Junior-Admin, Guest)
   - Backend: Node.js/Express + TypeScript
   - Frontend: Vue 3 + TypeScript + Pinia
   - Database: SQLite
   - Container orchestration: Docker (itzg/minecraft-server)

2. **Custom Client Launcher** (Java Application)
   - Single executable JAR file
   - JavaFX-based GUI
   - Auto-sync of Minecraft version, Fabric, and mods
   - Microsoft OAuth 2.0 authentication

3. **Network Integration**
   - Dynamic DNS via Unbound (`*.mc.minecraft-kids.de`)
   - Add-on management (Simple Voice Chat, Geyser/Floodgate)

## 🚀 Quick Start

### Prerequisites
- Node.js 20+
- Docker & Docker Compose
- Git

### Development Setup

1. **Clone the repository:**
```bash
git clone git@github.com:steviee/minecraft-kids.git
cd minecraft-kids
```

2. **Set up environment:**
```bash
cp .env.example .env
# Edit .env with your configuration
```

3. **Start development environment:**
```bash
docker-compose up -d
```

Or run backend and frontend separately:

```bash
# Terminal 1 - Backend
cd backend
npm install
npm run dev

# Terminal 2 - Frontend
cd frontend
npm install
npm run dev
```

4. **Access the application:**
- Frontend: http://localhost:5173
- Backend API: http://localhost:3000
- API Health: http://localhost:3000/health

## 📚 Documentation

- **[CLAUDE.md](./CLAUDE.md)** - Guide for Claude Code development
- **[.claude/agents.md](./.claude/agents.md)** - Sub-agent configuration for parallel development
- **[docs/prd.md](./docs/prd.md)** - Product Requirements Document (German)
- **[docs/tasks.md](./docs/tasks.md)** - Detailed development roadmap
- **[backend/README.md](./backend/README.md)** - Backend documentation
- **[frontend/README.md](./frontend/README.md)** - Frontend documentation

## 🛠️ Development

### Project Structure

```
mck-suite/
├── backend/          # Node.js/Express API
├── frontend/         # Vue 3 UI
├── launcher/         # Java launcher (Phase 4)
├── docs/             # Documentation (PRD, tasks)
├── .github/          # GitHub Actions workflows
└── .claude/          # Claude Code configuration
```

### Available Commands

```bash
# Backend
cd backend
npm run dev          # Development server
npm run build        # Build TypeScript
npm test             # Run tests
npm run lint         # Lint code

# Frontend
cd frontend
npm run dev          # Vite dev server
npm run build        # Production build
npm test             # Run tests
npm run lint         # Lint code

# Docker
docker-compose up    # Start all services
docker-compose down  # Stop all services
docker-compose logs  # View logs
```

### Git Workflow with Worktrees

See [.claude/agents.md](./.claude/agents.md) for detailed instructions on using git worktrees with specialized Claude Code agents.

**Branch naming convention:**
- `backend/*` - Backend features/fixes
- `frontend/*` - Frontend features/fixes
- `devops/*` - Infrastructure/deployment
- `launcher/*` - Launcher development

## 🎭 User Roles

### Admin ("root")
- Full system access
- Create/manage/delete all instances
- Create and assign users
- Modify system settings and DNS

### Junior-Admin
- Limited to assigned instances only
- Start/stop/restart servers
- Use console and RCON
- Manage whitelist for assigned servers
- Cannot create instances or modify system

### Guest (Public)
- View public status page
- See all servers and their status
- Download custom launcher
- Access admin login page

## 📋 Issue Tracking

All development tasks are tracked in GitHub Issues:
- View issues: `gh issue list`
- View milestones: https://github.com/steviee/minecraft-kids/milestones

Issues are organized by:
- **Milestones**: Milestone 1 (Server Tool), Milestone 2 (Launcher)
- **Phases**: phase-0 through phase-5
- **Components**: backend, frontend, docker, launcher, deployment

## 🧪 Testing

```bash
# Backend tests
cd backend && npm test

# Frontend tests
cd frontend && npm test

# Run CI checks locally
npm run lint && npm run build && npm test
```

## 🚢 Deployment

Production deployment guide coming in Phase 3.

**Target environment:**
- Domain: minecraft-kids.de
- Server subdomain: *.mc.minecraft-kids.de
- Container orchestration: Docker Compose
- Reverse proxy: Nginx
- SSL: Let's Encrypt

## 🤝 Contributing

1. Check [GitHub Issues](https://github.com/steviee/minecraft-kids/issues) for open tasks
2. Create a worktree for your work (see [.claude/agents.md](./.claude/agents.md))
3. Follow the coding standards (ESLint, Prettier)
4. Never use placeholders or TODO comments
5. Test thoroughly before creating PR
6. Use `gh pr create` to submit your work

## 📄 License

MIT

## 🔗 Links

- **Repository**: https://github.com/steviee/minecraft-kids
- **Issues**: https://github.com/steviee/minecraft-kids/issues
- **Milestones**: https://github.com/steviee/minecraft-kids/milestones
- **Production Domain**: minecraft-kids.de (not yet deployed)

---

**Generated with [Claude Code](https://claude.com/claude-code)** - See CLAUDE.md for development guidelines.
