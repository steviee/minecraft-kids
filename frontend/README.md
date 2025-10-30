# MCK Suite Frontend

Frontend UI for Minecraft Kids Server Management Suite.

## Tech Stack

- **Framework**: Vue 3 (Composition API)
- **Language**: TypeScript
- **Build Tool**: Vite
- **State Management**: Pinia
- **Routing**: Vue Router
- **HTTP Client**: Axios
- **Testing**: Vitest + Vue Test Utils

## Setup

1. Install dependencies:
```bash
npm install
```

## Development

```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run preview      # Preview production build
npm test             # Run tests
npm run test:ui      # Run tests with UI
npm run lint         # Lint code
npm run format       # Format code with Prettier
```

## Project Structure

```
src/
├── main.ts           # Application entry point
├── App.vue           # Root component
├── router/           # Vue Router configuration
├── stores/           # Pinia stores for state management
├── views/            # Page components
├── components/       # Reusable components
├── services/         # API service layer
├── types/            # TypeScript type definitions
└── assets/           # Static assets

public/               # Public static files
```

## Features

- **Public Status Page**: View all servers and their status (no login required)
- **Admin Dashboard**: Manage all instances (Admin only)
- **Junior Admin Dashboard**: Manage assigned instances
- **User Management**: Create and manage users (Admin only)
- **Instance Management**: Start/stop/restart servers, view logs
- **Live Console**: Real-time server console with RCON commands
- **Whitelist Management**: Approve/deny whitelist requests

(Features will be implemented progressively according to the development phases)
