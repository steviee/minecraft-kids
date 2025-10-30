# Sub-Agent Configuration for MCK Suite

This document describes the specialized Claude Code agent configuration for parallel development using git worktrees.

## Overview

The MCK Suite project is structured to support parallel development across three main areas:
1. **Backend** (Node.js/Express + TypeScript)
2. **Frontend** (Vue 3 + TypeScript)
3. **DevOps** (Docker, CI/CD, Infrastructure)

Each area can have its own git worktree and dedicated Claude Code agent with specialized context.

## Worktree Structure

```
mck-suite/                    # Main worktree (main branch)
├── backend/
├── frontend/
├── launcher/
├── docs/
└── .github/

mck-suite-backend/            # Backend worktree (backend/* branches)
mck-suite-frontend/           # Frontend worktree (frontend/* branches)
mck-suite-devops/             # DevOps worktree (devops/* branches)
```

## Setting Up Worktrees

```bash
# From main repository
git worktree add ../mck-suite-backend -b backend/feature-name
git worktree add ../mck-suite-frontend -b frontend/feature-name
git worktree add ../mck-suite-devops -b devops/feature-name
```

## Agent Specializations

### Backend Agent

**Focus Areas:**
- Node.js/Express API development
- TypeScript implementation
- Database schema and queries (SQLite)
- Docker SDK integration (dockerode)
- Authentication (JWT, bcrypt)
- RBAC middleware
- WebSocket/RCON integration

**Relevant Issues:**
- All issues labeled `backend`
- Issues labeled `database`
- Phase 1, 2, and 3 backend tasks

**Context Prompt:**
```
You are a specialized backend agent for the MCK Suite project. Focus on:
- Node.js/Express + TypeScript best practices
- RESTful API design with RBAC
- SQLite database operations with better-sqlite3
- Docker container management via dockerode
- JWT authentication and security
- WebSocket implementation for live console

Follow the backend coding standards in backend/.eslintrc and backend/.prettierrc.
Never use placeholders or TODOs. Complete all implementations fully.
```

**Working Directory:** `mck-suite-backend/backend/`

### Frontend Agent

**Focus Areas:**
- Vue 3 with Composition API
- TypeScript components
- Pinia state management
- Vue Router navigation
- Axios API integration
- UI/UX design
- Component testing with Vitest

**Relevant Issues:**
- All issues labeled `frontend`
- Phase 1, 2 frontend tasks
- UI/UX related issues

**Context Prompt:**
```
You are a specialized frontend agent for the MCK Suite project. Focus on:
- Vue 3 Composition API with TypeScript
- Component-based architecture
- Pinia for state management
- Vue Router for navigation
- Responsive UI design
- API integration with Axios
- Component testing with Vitest + Vue Test Utils

Follow the frontend coding standards in frontend/.eslintrc and frontend/.prettierrc.
Use idiomatic Vue 3 patterns. Complete all implementations without placeholders.
```

**Working Directory:** `mck-suite-frontend/frontend/`

### DevOps Agent

**Focus Areas:**
- Docker and docker-compose
- GitHub Actions CI/CD
- Infrastructure configuration
- Deployment scripts
- Nginx reverse proxy
- DNS configuration (Unbound)
- Production deployment

**Relevant Issues:**
- All issues labeled `docker` or `deployment`
- Phase 0 setup tasks
- Phase 3 deployment tasks

**Context Prompt:**
```
You are a specialized DevOps agent for the MCK Suite project. Focus on:
- Docker containerization and orchestration
- docker-compose for local and production environments
- GitHub Actions workflows for CI/CD
- Production deployment with Nginx
- SSL/TLS configuration
- Infrastructure as code
- System administration tasks

Follow infrastructure best practices. Ensure security and reliability.
Complete all configurations fully without placeholders.
```

**Working Directory:** `mck-suite-devops/`

## Branch Naming Convention

- **Backend branches**: `backend/feature-name` or `backend/issue-N`
- **Frontend branches**: `frontend/feature-name` or `frontend/issue-N`
- **DevOps branches**: `devops/feature-name` or `devops/issue-N`
- **Launcher branches**: `launcher/feature-name` or `launcher/issue-N`

## Workflow

### 1. Create Worktree for Specific Work
```bash
# Example: Working on backend authentication (Issue #5)
git worktree add ../mck-suite-backend -b backend/issue-5-auth
cd ../mck-suite-backend
```

### 2. Launch Specialized Claude Code Agent
```bash
# In the worktree directory
claude-code
```

### 3. Provide Agent Context
Give the agent the appropriate specialization prompt from above, along with:
- The specific issue number to work on
- Reference to this agents.md file
- The project's CLAUDE.md file

### 4. Work on the Issue
The specialized agent works on the issue following:
- The issue's acceptance criteria
- The technical todos
- Project coding standards
- No placeholders policy

### 5. Create Pull Request
```bash
# After work is complete and tested
git add .
git commit -m "Implement authentication system (#5)"
git push -u origin backend/issue-5-auth

# Create PR using gh CLI
gh pr create --base main --title "[Backend] Implement authentication system" --body "Closes #5"
```

### 6. Cleanup Worktree After Merge
```bash
cd ../mck-suite
git worktree remove ../mck-suite-backend
git branch -d backend/issue-5-auth
```

## Parallel Development Example

You can run multiple agents simultaneously:

**Terminal 1 - Backend Agent:**
```bash
cd mck-suite-backend
claude-code  # Working on Issue #5 (Authentication)
```

**Terminal 2 - Frontend Agent:**
```bash
cd mck-suite-frontend
claude-code  # Working on Issue #7 (Login UI)
```

**Terminal 3 - DevOps Agent:**
```bash
cd mck-suite-devops
claude-code  # Working on Issue #4 (Docker Compose)
```

Each agent operates independently in its own worktree, avoiding conflicts.

## Agent Communication

Since agents work in separate worktrees:
- **Dependencies** between issues are tracked in GitHub
- **Blocked issues** wait for their dependencies to be merged
- **API contracts** are documented in the backend README and OpenAPI spec
- **Component interfaces** are defined in TypeScript types

## Best Practices

1. **One agent per component area** - Don't mix frontend and backend work in one session
2. **Complete issues fully** - Follow the "no placeholders" rule
3. **Test before PR** - Run CI locally: `npm test && npm run lint && npm run build`
4. **Update documentation** - Keep READMEs current with implemented features
5. **Close issues properly** - Use "Closes #N" in PR description

## Issue Assignment to Agents

GitHub labels map to agents:

| Label | Agent | Worktree |
|-------|-------|----------|
| `backend` | Backend Agent | mck-suite-backend |
| `frontend` | Frontend Agent | mck-suite-frontend |
| `docker`, `deployment` | DevOps Agent | mck-suite-devops |
| `launcher` | Launcher Agent | mck-suite-launcher |

Multi-component issues (e.g., `backend` + `frontend`) should be split into separate issues with dependencies.

## Getting Started

See issue #21 "[Phase 0] Set Up Git Worktree Structure for Parallel Development" for the complete setup guide.
