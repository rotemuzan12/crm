# TODO — תכנית יישום

## שלב 1: פרויקט בסיסי ✅
- [x] README.md + TODO.md
- [x] package.json + tsconfig + electron-vite config
- [x] Tailwind + PostCSS
- [x] .gitignore

## שלב 2: תהליך ראשי (Main Process) ✅
- [x] SQLite schema + migrations
- [x] נתוני דמו (seed) בעברית
- [x] queries: clients, contacts, deals, tasks, notes, dashboard, search
- [x] IPC handlers לכל ישות
- [x] CSV export + import
- [x] גיבוי ושחזור (backup/restore)
- [x] settings store
- [x] Telegram bot (polling + 6 פקודות)
- [x] Electron main window

## שלב 3: Preload Bridge ✅
- [x] contextBridge עם API מלא

## שלב 4: Renderer — ליבה ✅
- [x] types + Hebrew labels
- [x] globals.css + RTL
- [x] Layout + Sidebar + TopBar
- [x] UI components: Button, Input, Select, Textarea, Modal, Table, Badge, Card, EmptyState, LoadingSpinner

## שלב 5: Renderer — Hooks ✅
- [x] useClients, useContacts, useDeals, useTasks, useNotes, useDashboard

## שלב 6: Renderer — דפים ✅
- [x] Dashboard (stats, upcoming tasks, recent activity, deals by stage)
- [x] Clients (list + filter + detail + form)
- [x] Contacts (list + filter + form, linked to clients)
- [x] Deals (board view + table view + form)
- [x] Tasks (list + filter + complete/delete + form)
- [x] Settings (Telegram config + backup/restore + CSV export/import)

## שלב 7: שיפורים עתידיים (post-MVP)
- [ ] מצב כהה (dark mode)
- [ ] תגיות (tags) ללקוחות
- [ ] קבצים מצורפים
- [ ] דוחות וגרפים
- [ ] ייבוא מ-Google Contacts
- [ ] אינטגרציית אימייל
- [ ] תזכורות (reminders) מהמערכת
