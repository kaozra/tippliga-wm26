# TippLiga WM26

React-/Firebase-Tippspiel für die Fußball-WM 2026.

## Lokale Entwicklung

```bash
npm ci
npm ci --prefix scripts
npm run dev
```

Produktions-Build und Sync-Tests:

```bash
npm run test:sync
npm run build
```

## Automatischer Ergebnis-Sync

Die offizielle FIFA-API liefert Paarungen, Termine, Live-Spielstände,
Endresultate und Elfmeterschießen. OpenLigaDB wird nur noch ergänzend für
Torereignisse verwendet. Der Sync unterstützt Gruppenphase und alle
K.-o.-Runden sowie Verlängerung und Elfmeterschießen.

- `.github/workflows/sync-results.yml` läuft während der WM-Spielfenster alle
  fünf Minuten. Er schreibt nur die zeitnah relevanten Spiele und benötigt
  keine Firestore-Lesezugriffe.
- Ein täglicher Vollabgleich korrigiert auch nachträgliche Änderungen der
  offiziellen Resultate und entfernt veraltete Elfmeterschießen-Felder.
- Die geöffnete App fragt FIFA während laufender Spiele minütlich rein lesend
  ab und dient als schneller Live-Fallback.
- `.github/workflows/sync-playerstats.yml` aktualisiert täglich die
  Torschützenliste.

Beide GitHub-Workflows benötigen das Repository-Secret
`FIREBASE_SERVICE_ACCOUNT` mit dem JSON eines Firebase-Service-Accounts. Ein
fehlendes oder ungültiges Secret lässt den Workflow bewusst fehlschlagen,
anstatt einen erfolgreichen, aber wirkungslosen Lauf vorzutäuschen.

Manueller Test ohne Firestore-Schreibzugriff:

```bash
npm run test:sync
```
