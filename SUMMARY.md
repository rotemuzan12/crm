# סיכום פרויקט CRM

## מה נבנה

אפליקציית שולחן עבודה מלאה לניהול לקוחות — 59 קבצי TypeScript/TSX, מסד נתונים SQLite מקומי, ממשק עברי RTL מלא, ובוט Telegram מובנה.

---

## טכנולוגיות

| שכבה | טכנולוגיה |
|------|-----------|
| אפליקציית שולחן עבודה | Electron 28 |
| ממשק משתמש | React 18 + TypeScript |
| כלי בנייה | electron-vite 2 |
| עיצוב | Tailwind CSS 3 + Rubik font |
| מסד נתונים | SQLite (better-sqlite3) |
| בוט | Telegram Bot API (polling) |
| ניתוב | react-router-dom 6 |

---

## מבנה הפרויקט

```
src/
  main/
    db/               # migrations + seed (נתוני דמו בעברית) + 7 query modules
    ipc/              # 11 handler modules
    telegram/         # bot.ts — 7 פקודות, polling, allowlist
  preload/            # contextBridge — window.api typed bridge
  renderer/src/
    types/            # TypeScript types + תוויות עברית + Window.api interface
    components/       # Layout, Sidebar, TopBar + 9 UI components
    hooks/            # 6 custom hooks
    pages/            # 6 דפים ראשיים + sub-components
```

---

## הפעלה

### פעם ראשונה (התקנה)

```bash
npm install --ignore-scripts
node node_modules/electron/install.js
npx electron-rebuild -f -w better-sqlite3
```

> **הערה:** `better-sqlite3` דורש קמפול לABI של Electron.
> `electron-rebuild` מוריד prebuilt binary — אין צורך ב-Visual Studio.

### הרצה בפיתוח

```bash
npm run dev
```

### בנייה לפרסום

```bash
npm run build
```

קבץ הפצה יופיע בתיקיית `out/`.

---

## פיצ'רים מובנים

### לוח בקרה (Dashboard)
- 5 כרטיסי סטטיסטיקה: לקוחות, עסקאות פעילות, שווי עסקאות, משימות ממתינות, משימות באיחור
- גרף צינור עסקאות לפי שלב (CSS bars)
- רשימת משימות קרובות עם checkbox ישיר
- פעילות אחרונה (timeline של הערות)

### לקוחות
- רשימה עם חיפוש וסינון לפי סטטוס
- דף פרטים עם 5 טאבים:
  - פרטים, אנשי קשר, עסקאות, משימות, פעילות
- הוספת הערות inline בטאב הפעילות
- CRUD מלא (יצירה / עריכה / מחיקה)

### אנשי קשר
- רשימה עם חיפוש וסינון לפי לקוח
- קישור ללקוח עם ניווט ישיר
- CRUD מלא

### עסקאות
- **לוח Kanban** — 6 עמודות שלבים עם כרטיסים
- **תצוגת טבלה** — עם מיון וסינון
- toggle בין הצגות
- CRUD מלא + סכום וסטטוס לכל עסקה

### משימות
- טאבים: פתוחות / הושלמו / הכול
- Checkbox לסימון השלמה ישיר מהרשימה
- סינון לפי עדיפות (נמוכה / בינונית / גבוהה)
- הדגשת משימות באיחור באדום
- CRUD מלא

### הגדרות
- **Telegram Bot** — הגדרת token + user IDs מאושרים, הפעלה/עצירה, מצב פעיל
- **CSV** — ייצוא לקוחות / עסקאות / משימות + ייבוא לקוחות מ-CSV
- **גיבוי ושחזור** — העתקת קובץ SQLite מלא

### חיפוש גלובלי
- חיפוש בTop Bar על פני כל הישויות (לקוחות, אנשי קשר, עסקאות, משימות)
- dropdown עם תוצאות + ניווט ישיר

---

## בוט Telegram

הבוט פועל ב-polling מאותו מחשב. המחשב חייב להיות דלוק.

### הגדרה
1. צור בוט דרך @BotFather → קבל token
2. פתח **הגדרות → Telegram** באפליקציה
3. הכנס token + מזהי משתמשים מאושרים (מופרדים בפסיק)
4. לחץ **הפעל בוט**

### פקודות

| פקודה | תיאור |
|-------|-------|
| `/today` | משימות להיום (לפי עדיפות) |
| `/deals` | עסקאות פעילות עם שלב וסכום |
| `/client <שם>` | פרטי לקוח + ספירת עסקאות ומשימות |
| `/add_note <לקוח> <טקסט>` | הוספת הערה ללקוח |
| `/create_task <לקוח> <משימה>` | יצירת משימה עבור לקוח |
| `/pipeline` | סיכום צינור עסקאות לפי שלב + סה"כ |

---

## מסד הנתונים

קובץ SQLite נשמר אוטומטית ב:
- **Windows:** `%APPDATA%\crm\crm.db`
- **macOS:** `~/Library/Application Support/crm/crm.db`

### טבלאות

| טבלה | תיאור |
|------|-------|
| `clients` | לקוחות — שם, חברה, אימייל, טלפון, סטטוס |
| `contacts` | אנשי קשר — מקושרים ללקוח |
| `deals` | עסקאות — שלב, סכום, תאריך סגירה |
| `tasks` | משימות — עדיפות, תאריך יעד, מצב השלמה |
| `notes` | הערות / פעילות — מקושרות ללקוח או עסקה |
| `settings` | הגדרות מערכת (token Telegram, וכו') |

בהפעלה ראשונה נוצר ה-schema ומוכנסים נתוני דמו (5 לקוחות ישראליים, 11 אנשי קשר, 8 עסקאות, 12 משימות, 15 הערות).

---

## ארכיטקטורה

```
┌─────────────────────────────────────────┐
│           Electron Main Process         │
│  SQLite DB ←→ Query modules            │
│  IPC Handlers (ipcMain.handle)          │
│  Telegram Bot (polling)                 │
└────────────────┬────────────────────────┘
                 │ contextBridge (window.api)
┌────────────────▼────────────────────────┐
│           React Renderer                │
│  Hooks → window.api → IPC              │
│  Pages → Components → UI               │
└─────────────────────────────────────────┘
```

כל תקשורת בין renderer ל-main עוברת דרך IPC מאובטח — אין גישה ישירה ל-Node.js מהrenderer.

