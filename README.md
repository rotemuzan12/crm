# CRM — ניהול לקוחות שולחני

מערכת ניהול לקוחות (CRM) מקומית לחברות קטנות. אפליקציית שולחן עבודה, ללא ענן, עם ממשק עברי מלא.

## טכנולוגיות

| שכבה | טכנולוגיה |
|------|-----------|
| אפליקציית שולחן עבודה | Electron 28 |
| ממשק משתמש | React 18 + TypeScript |
| כלי בנייה | electron-vite 2 |
| עיצוב | Tailwind CSS 3 |
| מסד נתונים | SQLite (better-sqlite3) |
| בוט Telegram | node-telegram-bot-api (polling) |

## מבנה הפרויקט

```
src/
  main/               # תהליך ראשי: DB, IPC, Telegram
    db/               # migrations, seed, queries
    ipc/              # IPC handlers לכל ישות
    telegram/         # בוט Telegram
  preload/            # גשר מאובטח main ↔ renderer
  renderer/           # אפליקציית React
    src/
      components/     # layout + ui רכיבים משותפים
      pages/          # דפי האפליקציה
      hooks/          # custom hooks עם window.api
      types/          # TypeScript types + תוויות עברית
```

## התקנה

```bash
npm install
npm run dev
```

## בנייה לפרסום

```bash
npm run build
```

קובץ ההפצה ייוצר בתיקיית `out/`.

## מסד הנתונים

קובץ SQLite נשמר אוטומטית ב:
- **Windows:** `%APPDATA%\crm\crm.db`
- **macOS:** `~/Library/Application Support/crm/crm.db`

בהפעלה ראשונה נוצר ה-schema וממולאים נתוני דמו.

## בוט Telegram

1. צור בוט חדש דרך @BotFather → קבל token
2. פתח **הגדרות → Telegram** באפליקציה
3. הכנס את ה-token ואת מזהי המשתמשים המאושרים (מופרדים בפסיק)
4. לחץ **הפעל בוט**

הבוט פועל בpolling — המחשב חייב להיות דלוק.

### פקודות הבוט

| פקודה | תיאור |
|-------|-------|
| `/today` | משימות להיום |
| `/deals` | עסקאות פעילות |
| `/client <name>` | פרטי לקוח לפי שם |
| `/add_note <client> <text>` | הוסף הערה ללקוח |
| `/create_task <client> <task>` | צור משימה |
| `/pipeline` | סיכום צינור עסקאות |

## גיבוי ושחזור

**הגדרות → גיבוי ושחזור** — העתקת קובץ SQLite מלא.
