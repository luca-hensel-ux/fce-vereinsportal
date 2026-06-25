# FCE Vereinsportal – Release V1.4

GitHub-Pages-kompatible Produktivstruktur.

## URLs nach GitHub Pages Deployment

Mitgliedsantrag:

```text
https://<username>.github.io/fce-vereinsportal/
```

oder direkt:

```text
https://<username>.github.io/fce-vereinsportal/frontend/mitgliedsantrag/
```

Admin-Portal:

```text
https://<username>.github.io/fce-vereinsportal/frontend/admin/
```

## Enthalten

- `index.html` im Root mit Weiterleitung auf den Mitgliedsantrag
- `frontend/mitgliedsantrag`
- `frontend/admin`
- `backend` für Google Apps Script
- CSV-Export für verein.cloud
- stabile PDF-Erstellung über Google Apps Script

## GitHub Upload

Für GitHub Pages alles hochladen:

- `index.html`
- `frontend`
- optional `README.md`

**Backend nicht öffentlich hochladen**, wenn dort deine echte `SHEET_ID` eingetragen ist.

Wenn du das Backend trotzdem versionieren willst, ersetze vorher die echte Sheet-ID durch:

```js
const SHEET_ID = "HIER_DEINE_GOOGLE_SHEET_ID_EINFUEGEN";
```

## GitHub Pages aktivieren

Repository → Settings → Pages:

- Source: Deploy from branch
- Branch: `main`
- Folder: `/ (root)`

Danach ist der Mitgliedsantrag direkt über die GitHub-Pages-Hauptadresse erreichbar.


## Release V1.4.1

Kleine Frontend-Optimierung:
- iPhone-Fix für Datumsfelder
- automatische Ermittlung des Kreditinstituts aus der IBAN
- lokale BLZ-Liste + Online-Fallback; wenn keine Ermittlung möglich ist, bleibt manuelle Eingabe möglich

Für GitHub hochladen:
- `index.html`
- `README.md`
- `frontend/`

Nicht hochladen:
- `backend/`


## Release V1.4.2

Korrekturen:
- Datumsfelder auf iPhone/Safari von nativen Date-Pickern auf schmale Textfelder im Format `TT.MM.JJJJ` umgestellt.
- Eingabe wird automatisch als `TT.MM.JJJJ` formatiert.
- Vor dem Absenden wird das Datum intern wieder als `YYYY-MM-DD` an Google Apps Script übertragen.
- Kreditinstitut-Ermittlung aus deutscher IBAN verbessert:
  - lokale BLZ-Liste erweitert
  - Online-Fallback über OpenIBAN bleibt optional
  - manuelle Eingabe bleibt möglich


## Release V1.4.4

Fix:
- Datumsfelder wieder auf native `type="date"` zurückgestellt.
- Kalender-Picker ist wieder verfügbar.
- fehlerhafte `TT.MM.JJJJ`-Pattern-Validierung entfernt.
- zusätzliche CSS-Regeln gegen zu breite Date-Felder auf iPhone/Safari ergänzt.
- IBAN/Kreditinstitut-Ermittlung aus V1.4.2 bleibt erhalten.

Backend:
- unverändert.
- `PDF.gs` aus V1.4.3 bleibt aktiv.
