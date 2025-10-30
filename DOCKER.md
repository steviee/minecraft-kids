# Docker Development Environment

MCK Suite verwendet Docker Compose für lokale Entwicklung mit Traefik als Reverse Proxy und Unbound als DNS-Server zur Simulation der Produktionsumgebung.

## Architektur-Übersicht

```
┌─────────────────────────────────────────────┐
│        Traefik (Reverse Proxy)              │
│   Dashboard: http://traefik.mck.local       │
│   Port 80 (HTTP), 443 (HTTPS)               │
│   Port 8080 (Dashboard)                     │
│   Port 25565 (Minecraft)                    │
└─────────────────────────────────────────────┘
                     │
        ┌────────────┼────────────┐
        │            │            │
   ┌────▼────┐  ┌───▼────┐  ┌───▼─────────┐
   │Frontend │  │Backend │  │Minecraft    │
   │Vue/Vite │  │Express │  │Server(s)    │
   │         │  │        │  │itzg/mc-srv  │
   │Port 5173│  │Port    │  │Port 25565   │
   │         │  │3000    │  │             │
   └─────────┘  └────┬───┘  └─────────────┘
                     │
                ┌────▼────┐
                │SQLite DB│
                │ Volume  │
                └─────────┘

┌──────────────────────────────────────────────┐
│         Unbound (DNS Server)                 │
│   Local DNS: 127.0.0.1:5353                  │
│   Zone: *.mck.local, *.mc.mck.local          │
└──────────────────────────────────────────────┘
```

## Services

### Traefik
- **Image:** `traefik:v3.0`
- **Funktion:** Reverse Proxy mit automatischem Service Discovery
- **Dashboard:** http://traefik.mck.local:8080 oder http://localhost:8080
- **Features:**
  - Automatisches Routing via Docker Labels
  - HTTP/HTTPS Entrypoints
  - Minecraft TCP Routing

### Unbound
- **Image:** `mvance/unbound:latest`
- **Funktion:** DNS-Server für lokale Domänen
- **Port:** 5353 (TCP/UDP) - vermeidet Konflikt mit Host-DNS
- **Auflösungen:**
  - `*.mck.local` → Traefik (Backend/Frontend)
  - `*.mc.mck.local` → Minecraft Server

### Backend
- **Build:** `./backend/Dockerfile.dev`
- **Port:** 3000
- **Domain:** http://api.mck.local (via Traefik)
- **Features:**
  - Hot-reload mit ts-node-dev
  - SQLite Datenbank in `./backend/data`
  - Docker Socket für Container-Management

### Frontend
- **Build:** `./frontend/Dockerfile.dev`
- **Port:** 5173
- **Domain:** http://mck.local (via Traefik)
- **Features:**
  - Vite dev server mit Hot Module Replacement
  - Vue 3 + TypeScript

### Minecraft Servers

#### Test Server (minecraft-test)
- **Port:** 25566 (direkt) oder 25565 (via Traefik)
- **Version:** 1.20.4 Fabric
- **RCON:** Aktiviert auf Port 25575
- **Domain:** test.mc.mck.local

#### Survival Server (minecraft-survival)
- **Port:** 25567 (direkt)
- **Version:** 1.20.4 Fabric
- **Status:** Optional (Profile: `extra`)
- **Start:** `docker-compose --profile extra up`
- **Domain:** survival.mc.mck.local

## Quick Start

### 1. Prerequisites

```bash
# Docker & Docker Compose installiert
docker --version
docker-compose --version

# Optional: DNS konfigurieren (siehe unten)
```

### 2. Environment Setup

```bash
# .env Datei erstellen
cp .env.example .env

# Mindestens JWT_SECRET und RCON_PASSWORD ändern!
nano .env
```

### 3. Services Starten

```bash
# Alle Services starten
docker-compose up -d

# Logs ansehen
docker-compose logs -f

# Nur bestimmte Services starten
docker-compose up -d traefik backend frontend

# Mit Extra-Services (Survival Server)
docker-compose --profile extra up -d
```

### 4. Services Stoppen

```bash
# Alle Services stoppen
docker-compose down

# Services stoppen UND Volumes löschen
docker-compose down -v
```

## DNS-Konfiguration

Um die `.mck.local` Domänen zu nutzen, gibt es mehrere Möglichkeiten:

### Option 1: /etc/hosts (Einfach, keine DNS)

```bash
# /etc/hosts bearbeiten
sudo nano /etc/hosts

# Folgende Zeilen hinzufügen:
127.0.0.1 mck.local
127.0.0.1 api.mck.local
127.0.0.1 traefik.mck.local
127.0.0.1 test.mc.mck.local
127.0.0.1 survival.mc.mck.local
```

**Nachteil:** Keine Wildcard-Unterstützung, jede Domain muss einzeln eingetragen werden.

### Option 2: System-DNS auf Unbound umstellen (Vollständig)

```bash
# NetworkManager DNS-Konfiguration (Ubuntu/Debian)
sudo nano /etc/NetworkManager/conf.d/dns.conf

# Inhalt:
[main]
dns=none

# resolv.conf anpassen
sudo nano /etc/resolv.conf

# Inhalt:
nameserver 127.0.0.1:5353
nameserver 1.1.1.1  # Fallback
```

**Vorteil:** Wildcards funktionieren, alle `*.mck.local` Domains werden aufgelöst.

### Option 3: dnsmasq (Empfohlen für Entwicklung)

```bash
# dnsmasq installieren
sudo apt install dnsmasq

# Konfiguration
sudo nano /etc/dnsmasq.conf

# Zeilen hinzufügen:
server=/mck.local/127.0.0.1#5353
server=1.1.1.1

# dnsmasq neu starten
sudo systemctl restart dnsmasq
```

## Service-URLs

Nach dem Start sind folgende URLs verfügbar:

### Via Traefik (mit DNS):
- Frontend: http://mck.local
- Backend API: http://api.mck.local
- Traefik Dashboard: http://traefik.mck.local:8080

### Direkt (ohne DNS):
- Frontend: http://localhost:5173
- Backend API: http://localhost:3000
- Traefik Dashboard: http://localhost:8080
- Minecraft Test: localhost:25566
- Minecraft Survival: localhost:25567

## Nützliche Befehle

```bash
# Services neu bauen
docker-compose build

# Einzelnen Service neu bauen
docker-compose build backend

# Service neu starten
docker-compose restart backend

# In Container einloggen
docker-compose exec backend sh
docker-compose exec frontend sh

# Logs einzelner Services
docker-compose logs -f backend
docker-compose logs -f minecraft-test

# Service-Status prüfen
docker-compose ps

# Volumes anzeigen
docker volume ls | grep mck

# Netzwerk inspizieren
docker network inspect mck-network
```

## Troubleshooting

### Port bereits belegt

```bash
# Port 80 belegt?
sudo lsof -i :80
# Lösung: Service stoppen oder docker-compose.yml Port ändern

# Port 5353 (DNS) belegt?
sudo lsof -i :5353
# Lösung: In docker-compose.yml anderen Port verwenden
```

### DNS funktioniert nicht

```bash
# Unbound Container prüfen
docker-compose logs unbound

# DNS-Auflösung testen
dig @localhost -p 5353 mck.local
nslookup mck.local 127.0.0.1:5353
```

### Container startet nicht

```bash
# Logs ansehen
docker-compose logs <service-name>

# Container neu bauen
docker-compose build <service-name>
docker-compose up -d <service-name>

# Alle Container und Volumes löschen und neu starten
docker-compose down -v
docker-compose up -d --build
```

### Minecraft Server startet nicht

```bash
# Logs ansehen
docker-compose logs minecraft-test

# Häufige Probleme:
# - EULA nicht akzeptiert (in docker-compose.yml: EULA=TRUE)
# - Zu wenig RAM
# - Falsche Minecraft Version
```

## Development Workflow

```bash
# 1. Services starten
docker-compose up -d

# 2. Code bearbeiten (Hot-reload aktiv)
# Backend: Änderungen in ./backend/src werden automatisch neu geladen
# Frontend: Vite HMR funktioniert automatisch

# 3. Logs beobachten
docker-compose logs -f backend frontend

# 4. Tests ausführen
cd backend && npm test
cd frontend && npm test

# 5. Services stoppen
docker-compose down
```

## Produktion vs. Entwicklung

| Feature | Entwicklung | Produktion |
|---------|-------------|------------|
| Domänen | `*.mck.local` | `*.minecraft-kids.de` |
| HTTPS | Nein | Ja (Let's Encrypt) |
| Hot-Reload | Ja | Nein |
| Volumes | Source-Code gemountet | Nur Daten |
| DNS | Unbound (lokal) | Unbound (Server) |
| Traefik | Insecure Dashboard | Secure Dashboard |

## Weitere Informationen

- Traefik Dokumentation: https://doc.traefik.io/traefik/
- Unbound Dokumentation: https://unbound.docs.nlnetlabs.nl/
- itzg/minecraft-server: https://github.com/itzg/docker-minecraft-server
