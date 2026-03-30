 # אייקון האפליקציה

יש להניח כאן קובץ `icon.ico` לפני בנייה.

## דרישות
- פורמט: `.ico`
- גדלים מומלצים בתוך הקובץ: 16x16, 32x32, 48x48, 256x256
- שם קובץ: `icon.ico` (חובה)

## יצירת ico בחינם
- https://www.icoconverter.com — העלה PNG, קבל ICO
- https://convertico.com

## אם אין אייקון
electron-builder ישתמש באייקון ברירת המחדל של Electron (לא יעצור את הבנייה).
כדי לבנות בלי אייקון, שנה ב-package.json:
  "win": { "icon": false }
