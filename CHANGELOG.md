# Changelog

All notable changes to this project are documented in this file.

## [0.2.2] - 2026-02-23
### Added
- Added startup app-version check:
    - Shows `updated version available` next to bottom-right version when a newer version exists and links to repository.

### Release
- [x] Built fresh macOS installer: `dist/QLab Sync Monitor-0.2.2-arm64.dmg`
- [x] Built fresh Windows installer: `dist/QLab Sync Monitor Setup 0.2.2.exe`
- [x] Cleaned `dist/` so installer files remain only

## [0.2.1] - 2026-02-23
### Changed
- Replaced generic Electron app icon with a custom QLab Sync Monitor icon.
- Configured `electron-builder` to use platform-specific icons:
  - macOS: `build/icon.icns`
  - Windows: `build/icon.ico`

## [0.2.0] - 2026-02-21
### Added
- Added desktop app packaging with Electron.
- Added installer build support with `electron-builder`:
  - macOS installer (`.dmg`)
  - Windows installer (`.exe` NSIS)

### Changed
- Added npm scripts for desktop run/build:
  - `desktop`
  - `dist`
  - `dist:mac`
  - `dist:win`
- Added `.gitignore` rules so `.github` and built app artifacts are excluded from git sync.

## [0.1.10] - 2026-02-21
### Changed
- Updated the settings `Save` button to full width.
- Added a small top margin above the settings `Save` button for cleaner spacing.

## [0.1.9] - 2026-02-21
### Changed
- Made the settings `Save` button visually stronger to stand out more.
- Added DesertDog logo directly below the Save button in settings (70% width).
- Added Buy Me a Coffee logo/link below the DesertDog logo in settings (50% width).

## [0.1.8] - 2026-02-21
### Changed
- Added inline warning text under `Poll interval (ms)` that appears live while editing when the value is anything other than `1000`.
- Warning text hides automatically again when the value returns to `1000`.

## [0.1.7] - 2026-02-21
### Changed
- Added live poll interval warning styling in settings: when `Poll interval (ms)` is anything other than `1000`, the field font color turns red immediately while editing.

## [0.1.6] - 2026-02-21
### Changed
- Added variable ordering controls in settings using compact up/down arrows.
- Persisted custom variable order in local settings.
- Applied configured variable order to the main page status button order.

## [0.1.5] - 2026-02-21
### Changed
- Added `n_name` as a selectable comparable variable (`$(<label>:n_name)`), displayed as `Playhead` in settings and button title prefix (`Playhead:`).
- Updated compact status notification text color to match active button state colors:
  - `In sync` → green
  - `Out of sync` → orange
  - `Connection lost` → red

## [0.1.4] - 2026-02-21
### Changed
- Moved the `Settings` button next to the compact status header.
- Shortened header state text to compact labels (`In sync`, `Out of sync`, `Connection lost`).
- Added a confirmation warning when poll interval is changed by the user, including guidance that `1000ms` is highly recommended and other values may lead to unexpected behaviour.

## [0.1.3] - 2026-02-21
### Changed
- Removed variable names from the button small text line, leaving only per-connection values.
- Updated button title format to include fixed prefixes before the primary value:
  - `Time elapsed:`
  - `Cue name:`
  - `Time left:`
- Kept title value source as connection label 1.

## [0.1.2] - 2026-02-21
### Changed
- Updated button layout to show a compact connection-label badge row on each status button.
- Updated button title behavior to always use the value from connection label 1.
- Updated secondary small text to show values from all configured connections.
- Updated Copilot instructions for the refined button content requirements.

## [0.1.1] - 2026-02-21
### Changed
- Updated status buttons to show the live variable value in the button title for `e_time`, `r_name`, and `r_left`.
- Kept per-connection values visible in the secondary line for quick comparison.
- Updated settings UI from comma-separated labels to explicit fields:
  - Label 1 (required)
  - Label 2 (required)
  - Label 3 (optional)
- Updated Copilot instructions to reflect the optional third connection label.

## [0.1.0] - 2026-02-21
### Added
- Initial compact web app scaffold for QLab sync monitoring.
- Settings panel for Companion URL, poll interval, e_time tolerance, connection labels, and variable selection.
- Variable comparison support for `e_time`, `r_name`, and `r_left` across 2+ labels.
- Status button UI with sync states:
  - Green: in sync
  - Orange: out of sync
  - Red: connection lost
- Local settings persistence using browser localStorage.
- Initial project documentation in `README.md`.
- Initial Copilot project instructions in `.github/copilot-instructions.md`.
