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
