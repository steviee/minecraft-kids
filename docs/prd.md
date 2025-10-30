Product Requirements Document: Minecraft Kids Server Management Suite

Autor: Version: 2.0 Datum: 30. Oktober 2025 Domain: minecraft-kids.de

1. Vision und Zielsetzung

1.1. Vision

Eine allumfassende, web-basierte Multi-User-Plattform zu schaffen, die es Administratoren ermöglicht, mehrere gemoddete Minecraft-Java-Server-Instanzen mühelos zu verwalten und Berechtigungen an untergeordnete Administratoren zu delegieren. Gleichzeitig soll für Endanwender der Zugang zu diesen Servern durch einen benutzerdefinierten Launcher radikal vereinfacht werden, der über eine öffentliche Statusseite zugänglich ist.

1.2. Problemstellung

    Für Haupt-Administratoren: Die Verwaltung mehrerer Server ist komplex. Es fehlt eine einfache Möglichkeit, die Kontrolle über einzelne Server (z.B. für die eigene Welt eines Kindes) sicher abzugeben.

    Für Junior-Administratoren (z.B. Kinder): Sie möchten Kontrolle über ihre eigene Welt haben (Spieler einladen, Spielmodus ändern), ohne Zugriff auf andere Server oder komplexe Systemeinstellungen zu haben.

    Für Spieler/Eltern: Die Installation von Mods und die Konfiguration des Clients ist eine hohe technische Hürde. Es fehlt eine zentrale, einfache Anlaufstelle, um den Server-Status zu sehen und das Spiel zu starten.

1.3. Zielgruppe

    Admin ("root"): Der Haupt-Administrator mit vollem Systemzugriff.

    Junior-Admin: Ein Benutzer mit eingeschränkten Rechten, der nur eine oder mehrere ihm zugewiesene Instanzen verwalten darf.

    Nicht angemeldeter Benutzer ("Guest"): Jeder, der die öffentliche Domain besucht, um den Server-Status zu prüfen oder den Launcher herunterzuladen.

2. Funktionsumfang und Anforderungen

Das Projekt besteht aus dem Server Management Tool (Backend + Web-UI mit Rollen) und dem Custom Client Launcher.

2.1. Benutzerrollen & Berechtigungen

Das System muss drei verschiedene Benutzerrollen unterstützen:

    Admin:

        Kann alle Aktionen ausführen: Instanzen erstellen/verwalten/löschen, Systemeinstellungen ändern, DNS verwalten.

        Kann Benutzerkonten (Admins, Junior-Admins) erstellen, bearbeiten und löschen.

        Kann Junior-Admins zu einer oder mehreren Instanzen zuweisen.

    Junior-Admin:

        Kann sich in das Webinterface einloggen.

        Sieht nur die ihm zugewiesenen Instanzen.

        Kann für seine Instanzen Aktionen ausführen: Starten, Stoppen, Neustarten, Konsole nutzen, Whitelist verwalten, Spielmodus ändern.

        Kann keine neuen Instanzen erstellen, keine Systemeinstellungen ändern und keine anderen Benutzer verwalten.

    Guest (nicht angemeldet):

        Hat keinen Zugriff auf das Admin-Dashboard.

        Sieht nur die öffentliche Übersichtsseite.

2.2. Öffentliche Übersichtsseite

    Zugänglichkeit: Die Startseite der Domain (minecraft-kids.de) ist öffentlich zugänglich.

    Inhalt:

        Zeigt eine Liste aller Server-Instanzen mit ihrem Namen und Live-Status (Online/Offline).

        Enthält einen prominenten Download-Button für den Custom Client Launcher.

        Enthält einen "Admin Login"-Button, der zur Login-Seite des Management-Tools führt.

        Zeigt keine technischen Details wie Ports oder IP-Adressen an.

2.3. Server Management Tool

2.3.1. Kernarchitektur

    Containerisierung: Jede Minecraft-Instanz läuft in einem isolierten Docker-Container (itzg/minecraft-server).

    Technologie-Stack: Web-Backend (Node.js/Python) mit API, Frontend (React/Vue), SQLite-Datenbank.

    Authentifizierung: Ein sicheres Login-System (Benutzername/Passwort) mit Session-Management.

2.3.2. Features

    Instanz-Verwaltung:

        Admins können Instanzen erstellen, starten, stoppen, neustarten und löschen.

        Der Servername ist nach der Erstellung unveränderlich, da er Teil des DNS-Hostnamens ist.

        Beim Erstellen einer Instanz kann ein Admin diese einem Junior-Admin zuweisen und ihn automatisch zum Server-Operator (OP) machen.

    Live-Konsole & Logs:

        Anzeige des Live-Server-Logs und Senden von RCON-Befehlen, jeweils mit Berechtigungsprüfung.

    Konfigurations-Management:

        Admins können Einstellungs-Templates und geteilte Benutzergruppen (Whitelist/Ops) verwalten.

    Whitelist-Automatisierung:

        Das Tool erkennt fehlgeschlagene Login-Versuche und zeigt sie als "Whitelist-Anfragen" an.

        Admins und die zuständigen Junior-Admins können Anfragen für ihre Server per Knopfdruck genehmigen, was die Whitelist live aktualisiert.

2.4. Netzwerk- und Add-on-Integration

    Dynamisches DNS:

        Automatische Generierung und Neuladen der Unbound-Konfiguration für die Zone mc.minecraft-kids.de.

        Namensschema: <servername>.mc.minecraft-kids.de.

    Add-on-Management (Fabric First):

        Simple Voice Chat und Geyser/Floodgate sind pro Instanz aktivierbar.

        Das Tool verwaltet die Zuweisung dedizierter UDP-Ports und die automatische Konfiguration.

2.5. Custom Client Launcher

    Ziel & Distribution: Eine einzelne, ausführbare .jar-Datei, die über die öffentliche Übersichtsseite heruntergeladen wird.

    Funktionalität:

        Zeigt eine Liste der verfügbaren Server an.

        Synchronisiert den Client (Minecraft-Version, Fabric, Mods) automatisch basierend auf einem serverseitigen server-pack.json-Manifest.

        Erzwingt den Login über den sicheren Microsoft OAuth 2.0 Flow.
