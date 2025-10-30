Entwicklungsplan: Minecraft Kids Server Management Suite (Phased Rollout)

Meilenstein 1: Server Management Suite (Backend & Admin-UI)

Ziel: Ein voll funktionsfähiges, deploybares Web-Tool zur Verwaltung von Minecraft-Servern mit Benutzerrollen und öffentlicher Statusseite. Nach Abschluss dieses Meilensteins ist das System für Administratoren einsatzbereit.

Phase 0: Projekt-Setup & Fundament (ca. 1-2 Tage)

    Task 0.1: Projekt-Setup & Fundament

        Kontext: Schaffung einer sauberen und organisierten Codebasis. Dies ist der erste Schritt für jedes Softwareprojekt, um die Trennung zwischen Backend und Frontend sicherzustellen. Das Datenbankschema muss die neuen Anforderungen für Benutzer und Berechtigungen von Anfang an berücksichtigen (siehe PRD 2.1).

        Akzeptanzkriterien:
            Das Git-Repository enthält die Ordner /backend und /frontend.
            Ein docker-compose.yml für die lokale Entwicklung ist vorhanden.
            Das Backend- und Frontend-Projekt sind initialisiert.
            Eine SQLite-Datenbankdatei mit dem korrekten Schema kann erstellt werden.

        Technische Todos:
            [ ] Git-Repository mit den Ordnern /backend und /frontend initialisieren.
            [ ] Basis-docker-compose.yml für die lokale Entwicklung anlegen.
            [ ] Backend-Projekt initialisieren (Node.js/Express oder Python/FastAPI).
            [ ] Frontend-Projekt initialisieren (React/Vue).
            [ ] SQLite-Datenbank einrichten und ein Skript zur Erstellung des Schemas schreiben (Tabellen: Instances, SettingTemplates, SharedUserGroups, WhitelistRequests, Users, UserInstancePermissions).

Phase 1: Benutzerauthentifizierung & Rollen (Höchste Priorität) (ca. 3-4 Tage)

    Task 1.1: Implementierung des Backend-Authentifizierungssystems

        Kontext: Implementierung des sicheren Zugangs zum Management-Tool, wie in PRD 2.3.1 gefordert. Dies ist die Grundlage für alle Berechtigungsprüfungen und die Trennung der Benutzerrollen.

        Akzeptanzkriterien:
            Ein neuer Benutzer kann über einen API-Endpunkt (geschützt, nur für Admins) registriert werden.
            Ein Benutzer kann sich über /api/auth/login anmelden.
            Passwörter werden sicher mit bcrypt gehasht in der Users-Tabelle gespeichert.
            Bei erfolgreichem Login wird ein gültiges JWT (JSON Web Token) zurückgegeben.

        Technische Todos:
            [ ] API-Endpunkt /api/auth/register erstellen (muss später durch RBAC geschützt werden).
            [ ] bcrypt-Bibliothek integrieren und Logik zum Hashen von Passwörtern implementieren.
            [ ] API-Endpunkt /api/auth/login erstellen, der Benutzerdaten prüft und ein JWT generiert.
            [ ] JWT-Bibliothek integrieren und die Token-Erstellung mit Benutzer-ID und Rolle im Payload umsetzen.

    Task 1.2: Implementierung des Rollenbasierten Berechtigungssystems (RBAC)

        Kontext: Erstellung einer zentralen Kontrollinstanz (Middleware), die jede API-Anfrage abfängt und die Berechtigungen des Benutzers gemäß den in PRD 2.1 definierten Rollen (Admin, Junior-Admin) prüft.

        Akzeptanzkriterien:
            Eine Middleware fängt alle geschützten API-Routen ab.
            Anfragen ohne gültiges JWT werden mit 401 Unauthorized abgelehnt.
            Anfragen von Admins werden immer durchgelassen.
            Anfragen von Junior-Admins werden nur durchgelassen, wenn sie die Berechtigung für die spezifische Ressource (z.B. Instanz-ID) haben.

        Technische Todos:
            [ ] Eine API-Middleware-Funktion erstellen, die den JWT aus dem Authorization-Header validiert.
            [ ] Logik implementieren, die die Rolle des Benutzers aus dem Token extrahiert.
            [ ] Logik für Junior-Admins implementieren: Die Middleware muss die angefragte instance_id aus den Request-Parametern extrahieren und in der UserInstancePermissions-Tabelle prüfen.

    Task 1.3: UI für Login und Benutzerverwaltung

        Kontext: Erstellung der Benutzeroberflächen, damit sich Benutzer anmelden und Admins die Benutzerkonten verwalten können (PRD 2.1).

        Akzeptanzkriterien:
            Eine Login-Seite unter /login ist verfügbar.
            Nach erfolgreichem Login wird das JWT im Browser gespeichert und der Benutzer zum Dashboard weitergeleitet.
            Eine Seite /admin/users ist nur für Admins zugänglich und listet alle Benutzer auf.
            Admins können auf dieser Seite neue Benutzer (Admins/Junior-Admins) erstellen und bestehende bearbeiten.

        Technische Todos:
            [ ] Login-Seiten-Komponente im Frontend erstellen.
            [ ] Logik zum Speichern des JWT (z.B. in localStorage) und zum Setzen des Authorization-Headers für alle folgenden API-Anfragen implementieren.
            [ ] Eine geschützte Routen-Komponente im Frontend erstellen, die den Zugriff auf Admin-Seiten steuert.
            [ ] Eine "Benutzerverwaltung"-Komponente mit Formularen zum Erstellen und Bearbeiten von Benutzern entwickeln.

Phase 2: Kernfunktionalität des Management-Tools (ca. 5-7 Tage)

    Task 2.1: Implementierung der Kern-Instanzverwaltung (API & Docker)

        Kontext: Implementierung der Kernlogik zur Steuerung der Minecraft-Server-Container (PRD 2.3.1). Alle Aktionen müssen durch das RBAC-System geschützt sein. Der Servername muss nach der Erstellung unveränderlich sein (PRD 2.3.2).

        Akzeptanzkriterien:
            Ein Admin kann über die API eine neue Instanz erstellen.
            Admins und berechtigte Junior-Admins können Instanzen starten, stoppen und neustarten.
            Der Instanz-Name kann nach der Erstellung nicht mehr geändert werden.
            Beim Erstellen kann ein Junior-Admin zugewiesen und als OP eingetragen werden.

        Technische Todos:
            [ ] Ein Service-Modul im Backend schreiben, das Docker-Befehle (docker run, stop, start, logs) kapselt.
            [ ] REST-Endpunkte (GET, POST, DELETE für /api/instances und POST für /api/instances/:id/start etc.) erstellen und mit der RBAC-Middleware schützen.
            [ ] Die POST-Logik zum Erstellen einer Instanz implementieren, inkl. Zuweisung von Junior-Admins und Eintrag in die ops.json.
            [ ] Die PUT/PATCH-Logik zum Bearbeiten einer Instanz so implementieren, dass der Name ignoriert wird.

    Task 2.2: UI für Instanz-Verwaltung & Öffentliche Statusseite

        Kontext: Schaffung der visuellen Schnittstelle für die Instanzverwaltung und der öffentlichen "Schaufenster"-Seite des Projekts (PRD 2.1 & 2.2).

        Akzeptanzkriterien:
            Das Admin-Dashboard zeigt alle Instanzen an.
            Das Junior-Admin-Dashboard zeigt nur die zugewiesenen Instanzen an.
            Die öffentliche Startseite (/) zeigt eine Liste aller Server mit ihrem Live-Status an.
            Die Startseite hat einen (vorerst Platzhalter-) Download-Button für den Launcher.

        Technische Todos:
            [ ] Dashboard-Komponente im Frontend erstellen, die je nach Benutzerrolle unterschiedliche Daten von /api/instances anzeigt.
            [ ] Formular zum Erstellen einer neuen Instanz entwickeln (nur für Admins).
            [ ] Einen nicht geschützten API-Endpunkt GET /api/public/servers im Backend erstellen.
            [ ] Eine Startseiten-Komponente für nicht eingeloggte Benutzer im Frontend erstellen.

    Task 2.3: Implementierung der Live-Konsole & Erweiterten Konfiguration

        Kontext: Ermöglicht Admins und Junior-Admins die Live-Interaktion mit ihren Servern und stellt Admins Werkzeuge zur Effizienzsteigerung zur Verfügung (PRD 2.3.2).

        Akzeptanzkriterien:
            Admins und Junior-Admins können die Live-Konsole ihrer Server sehen und RCON-Befehle senden.
            Admins können Einstellungs-Templates und Geteilte Benutzergruppen verwalten.
            Der Whitelist-Anfragen-Workflow ist voll funktionsfähig.

        Technische Todos:
            [ ] WebSocket-Server und RCON-Client im Backend implementieren (mit Berechtigungsprüfung).
            [ ] Konsolen-UI im Frontend erstellen.
            [ ] APIs und UIs für Einstellungs-Templates und Geteilte Gruppen erstellen (Admin-Feature).
            [ ] Den Log-File-Watcher, die APIs und die UI für den Whitelist-Anfragen-Workflow implementieren.

Phase 3: Netzwerk-Integration & Deployment (ca. 3-5 Tage)

    Task 3.1: Netzwerk-Integration (DNS & Add-ons)

        Kontext: Automatisierung der Netzwerkkonfiguration und Implementierung der Add-on-Verwaltung, um Server einfach erreichbar und funktional zu machen (PRD 2.4).

        Akzeptanzkriterien:
            DNS-Einträge werden bei Start/Stop einer Instanz automatisch aktualisiert.
            Add-ons (SVC, Geyser) können bei der Instanzerstellung konfiguriert werden und funktionieren wie erwartet.

        Technische Todos:
            [ ] Funktion zur Generierung der Unbound-Zonen-Konfiguration für mc.minecraft-kids.de schreiben.
            [ ] Backend-Logik für Add-on-Konfiguration (Ports, Mods, etc.) implementieren.
            [ ] UI-Optionen im Instanz-Erstellungsformular hinzufügen (nur für Admins).

    Task 3.2: Deployment von Meilenstein 1

        Kontext: Vorbereitung der Anwendung für den Live-Betrieb auf einem Server.

        Akzeptanzkriterien:
            Das gesamte System ist über Docker-Compose auf einem Server deploybar.
            Die Web-Anwendung ist über die Domain minecraft-kids.de erreichbar.

        Technische Todos:

            [ ] Docker-Images für Backend und Frontend für die Produktion erstellen.
            [ ] Eine docker-compose.prod.yml und eine Nginx-Konfiguration (als Reverse-Proxy) für das Deployment erstellen.
            [ ] Eine kurze Admin-Anleitung für die Bedienung des Tools schreiben.

Meilenstein 2: Custom Client Launcher (Spieler-Anwendung)

Ziel: Eine eigenständige, ausführbare .jar-Datei, die den Spielern den Zugang zu den Servern radikal vereinfacht. Dieser Meilenstein beginnt nach der erfolgreichen Fertigstellung und dem Deployment von Meilenstein 1.

Phase 4: Launcher-Entwicklung (ca. 7-10 Tage)

    Task 4.1: Launcher-Grundgerüst & UI (Java/JavaFX)

        Kontext: Erstellung des Grundgerüsts für die Client-Anwendung gemäß PRD 2.5.

        Akzeptanzkriterien:
            Ein Maven-Projekt ist im Ordner /launcher angelegt.
            Das Projekt kann zu einer einzelnen, ausführbaren "Fat JAR" gebaut werden.
            Die Anwendung startet und zeigt eine einfache UI mit einer (noch leeren) Server-Liste und einem "Spielen"-Button.

        Technische Todos:

            [ ] Separates Maven-Projekt im Ordner /launcher aufsetzen.
            [ ] JavaFX-Abhängigkeiten und das maven-shade-plugin konfigurieren.
            [ ] Den JavaFX-Launcher-Workaround (separate Main-Klasse) implementieren, um Paketierungsprobleme zu vermeiden.
            [ ] Eine einfache UI mit FXML oder programmatisch erstellen.

    Task 4.2: Implementierung der Synchronisations- und Minecraft-Logik

        Kontext: Implementierung der Kernfunktionen des Launchers: die automatische Synchronisation des Clients mit dem Server-Manifest (PRD 2.5.2) und die Nachbildung der Prozesse des offiziellen Launchers.

        Akzeptanzkriterien:

            Der Launcher kann eine server-pack.json von einer URL herunterladen und parsen.
            Der Launcher kann den lokalen mods-Ordner mit dem Manifest synchronisieren.
            Der Launcher kann alle benötigten Minecraft-Assets und Bibliotheken von Mojangs Servern herunterladen.
            Der Launcher kann den Fabric-Installer automatisiert ausführen.

        Technische Todos:

            [ ] Eine Klasse zum Herunterladen und Parsen der server-pack.json implementieren.
            [ ] Eine Funktion zum Vergleichen und Synchronisieren des mods-Ordners schreiben (inkl. SHA1-Prüfung).
            [ ] Die Mojang-Asset-Download-Pipeline implementieren (version_manifest.json etc.).
            [ ] Die Automatisierung des Fabric-Installers über dessen CLI implementieren.

    Task 4.3: Implementierung des Authentifizierungs- & Spielstart-Prozesses

        Kontext: Der letzte Schritt, bei dem sich der Spieler anmeldet und alle gesammelten Informationen zu einem gültigen Java-Befehl zusammengefügt werden, um das Spiel zu starten (PRD 2.5.2).

        Akzeptanzkriterien:

            Der Benutzer kann sich über den Microsoft OAuth 2.0 Flow anmelden.
            Der Launcher kann den korrekten Java-Befehl mit allen Argumenten und dem richtigen Klassenpfad zusammenbauen.
            Das Spiel startet erfolgreich über den "Spielen"-Button.

        Technische Todos:

            [ ] Den Microsoft OAuth 2.0 Authentifizierungs-Flow und den Abruf des Spielerprofils (UUID, Name) implementieren.
            [ ] Funktion zum dynamischen Erstellen des Java-Klassenpfads und Ersetzen der Start-Argumente schreiben.
            [ ] Den finalen Startbefehl mit ProcessBuilder zusammenbauen und ausführen, inklusive Logging der Konsolenausgabe.

Phase 5: Finale Integration & Abschluss (ca. 1-2 Tage)

    Task 5.1: Finale Integration & Dokumentation

        Kontext: Sicherstellen, dass der fertige Launcher für die Spieler zum Download bereitsteht und die Dokumentation vollständig ist.

        Akzeptanzkriterien:

            Die fertige .jar-Datei ist über die öffentliche Webseite herunterladbar.
            Eine einfache Anleitung für Spieler und Eltern ist verfügbar.

        Technische Todos:

            [ ] Backend: Einen Endpunkt zum Bereitstellen der server-pack.json-Manifeste erstellen.
            [ ] Backend/Deployment: Die finale Launcher-.jar-Datei auf dem Webserver zum Download bereitstellen.
            [ ] Frontend: Den Download-Button auf der öffentlichen Seite mit dem finalen Link aktualisieren.
            [ ] Eine ultra-einfache Anleitung für Spieler/Eltern schreiben.

