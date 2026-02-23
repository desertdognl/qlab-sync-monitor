# QLab Sync Monitor

Small webpage app to compare Bitfocus Companion variables across multiple QLab connections.

## Run

```bash
npm run start
```

Then open:

- http://127.0.0.1:5173

## Desktop installers

- Install dependencies:

```bash
npm install
```

- Build macOS installer (`.dmg`):

```bash
npm run dist:mac
```

- Build Windows installer (`.exe` NSIS):

```bash
npm run dist:win
```

- Output files are written to `dist/`.

## App icon

- macOS installer/app icon: `build/icon.icns`
- Windows installer/app icon: `build/icon.ico`
- Source artwork: `build/icon.png`
- Replace these files with your own icon files (same names) to change branding.

## Notes

- This app reads Companion module variables via:
  - `/api/variable/:label/:name/value`
- Ensure Companion HTTP API is enabled.
- Configure labels in app settings:
  - Label 1: required
  - Label 2: required
  - Label 3: optional
