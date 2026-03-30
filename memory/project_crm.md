---
name: CRM project
description: Hebrew RTL desktop CRM app built with Electron + React + TypeScript + SQLite + Tailwind
type: project
---

Full MVP desktop CRM built and running at C:/projects/crm.

**Stack:** Electron 28, React 18, TypeScript, electron-vite 2, Tailwind CSS 3, better-sqlite3, node-telegram-bot-api, react-router-dom 6

**DB:** SQLite at %APPDATA%/crm/crm.db (auto-created on first run with Hebrew seed data)

**Why:** Small company CRM, local-first, Hebrew RTL UI, no cloud.

**How to apply:** When working on this project, all 59 source files are in C:/projects/crm/src/.
- Main process: src/main/ (DB, IPC, Telegram bot)
- Preload bridge: src/preload/index.ts (contextBridge exposing window.api)
- Renderer: src/renderer/src/ (React app)
- Types + Window.api interface: src/renderer/src/types/index.ts

**Native module setup:** better-sqlite3 requires `npx electron-rebuild -f -w better-sqlite3` after npm install (handles Electron ABI mismatch). Use `npm install --ignore-scripts` first, then rebuild. Electron binary: `node node_modules/electron/install.js`.

**Run:** `npm run dev` (after npm install + electron-rebuild)
**Build:** `npm run build`
