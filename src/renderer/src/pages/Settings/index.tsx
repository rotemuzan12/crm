import React, { useState, useEffect } from 'react'
import Card from '@renderer/components/ui/Card'
import Button from '@renderer/components/ui/Button'
import Input from '@renderer/components/ui/Input'

interface TelegramStatus {
  running: boolean
}

export default function SettingsPage(): React.ReactElement {
  // Telegram
  const [token, setToken] = useState('')
  const [allowedUsers, setAllowedUsers] = useState('')
  const [showToken, setShowToken] = useState(false)
  const [telegramStatus, setTelegramStatus] = useState<TelegramStatus>({ running: false })
  const [telegramLoading, setTelegramLoading] = useState(false)
  const [telegramSaving, setTelegramSaving] = useState(false)
  const [telegramMsg, setTelegramMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  // CSV
  const [csvLoading, setCsvLoading] = useState<string | null>(null)
  const [importMsg, setImportMsg] = useState<string | null>(null)

  // Backup
  const [backupLoading, setBackupLoading] = useState(false)
  const [restoreLoading, setRestoreLoading] = useState(false)
  const [backupMsg, setBackupMsg] = useState<string | null>(null)

  useEffect(() => {
    loadSettings()
    checkTelegramStatus()
  }, [])

  async function loadSettings() {
    const settings = await window.api.settings.getAll()
    setToken(settings['telegram_token'] ?? '')
    setAllowedUsers(settings['telegram_allowed_users'] ?? '')
  }

  async function checkTelegramStatus() {
    const status = await window.api.telegram.status()
    setTelegramStatus(status)
  }

  async function saveTelegramSettings() {
    setTelegramSaving(true)
    try {
      await window.api.settings.set('telegram_token', token.trim())
      await window.api.settings.set('telegram_allowed_users', allowedUsers.trim())
      setTelegramMsg({ type: 'success', text: 'ההגדרות נשמרו' })
    } catch {
      setTelegramMsg({ type: 'error', text: 'שגיאה בשמירת ההגדרות' })
    } finally {
      setTelegramSaving(false)
      setTimeout(() => setTelegramMsg(null), 3000)
    }
  }

  async function handleStartBot() {
    setTelegramLoading(true)
    setTelegramMsg(null)
    try {
      await window.api.settings.set('telegram_token', token.trim())
      await window.api.settings.set('telegram_allowed_users', allowedUsers.trim())
      const result = await window.api.telegram.start()
      if (result.success) {
        setTelegramMsg({ type: 'success', text: 'הבוט הופעל בהצלחה' })
        setTelegramStatus({ running: true })
      } else {
        setTelegramMsg({ type: 'error', text: result.error ?? 'שגיאה בהפעלת הבוט' })
      }
    } catch (e: unknown) {
      setTelegramMsg({ type: 'error', text: 'שגיאה בהפעלת הבוט' })
    } finally {
      setTelegramLoading(false)
    }
  }

  async function handleStopBot() {
    setTelegramLoading(true)
    try {
      await window.api.telegram.stop()
      setTelegramStatus({ running: false })
      setTelegramMsg({ type: 'success', text: 'הבוט הופסק' })
    } finally {
      setTelegramLoading(false)
      setTimeout(() => setTelegramMsg(null), 3000)
    }
  }

  async function handleExport(type: 'clients' | 'deals' | 'tasks') {
    setCsvLoading(type)
    try {
      const result = await (type === 'clients'
        ? window.api.csv.exportClients()
        : type === 'deals'
          ? window.api.csv.exportDeals()
          : window.api.csv.exportTasks())
      if (result.success && result.path) {
        setImportMsg(`✓ הקובץ נשמר: ${result.path}`)
      }
    } catch {
      setImportMsg('שגיאה בייצוא')
    } finally {
      setCsvLoading(null)
      setTimeout(() => setImportMsg(null), 5000)
    }
  }

  async function handleImport() {
    setCsvLoading('import')
    try {
      const result = await window.api.csv.importClients()
      setImportMsg(`יובאו ${result.imported} לקוחות${result.errors.length > 0 ? ` (${result.errors.length} שגיאות)` : ''}`)
    } catch {
      setImportMsg('שגיאה בייבוא')
    } finally {
      setCsvLoading(null)
      setTimeout(() => setImportMsg(null), 5000)
    }
  }

  async function handleBackupCreate() {
    setBackupLoading(true)
    setBackupMsg(null)
    try {
      const result = await window.api.backup.create()
      if (result.success && result.path) {
        setBackupMsg(`✓ גיבוי נוצר: ${result.path}`)
      }
    } catch {
      setBackupMsg('שגיאה ביצירת גיבוי')
    } finally {
      setBackupLoading(false)
    }
  }

  async function handleBackupRestore() {
    setRestoreLoading(true)
    setBackupMsg(null)
    try {
      const result = await window.api.backup.restore()
      if (result.success) {
        setBackupMsg('✓ שחזור הצליח — האפליקציה תופעל מחדש')
      }
    } catch {
      setBackupMsg('שגיאה בשחזור')
    } finally {
      setRestoreLoading(false)
    }
  }

  return (
    <div className="p-6 max-w-2xl space-y-6">
      <h1 className="text-xl font-bold text-slate-900">הגדרות</h1>

      {/* Telegram */}
      <Card
        title="בוט Telegram"
        rightAction={
          <div className="flex items-center gap-2">
            <span className={`w-2 h-2 rounded-full ${telegramStatus.running ? 'bg-emerald-500' : 'bg-slate-300'}`} />
            <span className={`text-xs font-medium ${telegramStatus.running ? 'text-emerald-600' : 'text-slate-500'}`}>
              {telegramStatus.running ? 'פעיל' : 'לא פעיל'}
            </span>
          </div>
        }
      >
        <div className="space-y-4">
          <p className="text-sm text-slate-500">
            צור בוט דרך @BotFather בטלגרם, קבל token והדבק אותו כאן. הבוט פועל רק כשהאפליקציה פתוחה.
          </p>
          <div className="relative">
            <Input
              label="Token"
              value={token}
              onChange={(e) => setToken(e.target.value)}
              type={showToken ? 'text' : 'password'}
              placeholder="123456789:AAF..."
              dir="ltr"
            />
            <button
              type="button"
              onClick={() => setShowToken(!showToken)}
              className="absolute left-3 top-8 text-xs text-slate-500 hover:text-slate-700"
            >
              {showToken ? 'הסתר' : 'הצג'}
            </button>
          </div>
          <div>
            <Input
              label="מזהי משתמשים מאושרים (מופרדים בפסיק)"
              value={allowedUsers}
              onChange={(e) => setAllowedUsers(e.target.value)}
              placeholder="123456789, 987654321"
              dir="ltr"
            />
            <p className="text-xs text-slate-400 mt-1">
              לקבלת ה-ID שלך, שלח הודעה לבוט @userinfobot
            </p>
          </div>

          {telegramMsg && (
            <div className={`text-sm px-3 py-2 rounded-lg ${
              telegramMsg.type === 'success'
                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                : 'bg-red-50 text-red-700 border border-red-200'
            }`}>
              {telegramMsg.text}
            </div>
          )}

          <div className="flex gap-3">
            <Button
              variant="secondary"
              onClick={saveTelegramSettings}
              loading={telegramSaving}
            >
              שמור הגדרות
            </Button>
            {telegramStatus.running ? (
              <Button
                variant="danger"
                onClick={handleStopBot}
                loading={telegramLoading}
              >
                עצור בוט
              </Button>
            ) : (
              <Button
                variant="primary"
                onClick={handleStartBot}
                loading={telegramLoading}
                disabled={!token.trim()}
              >
                הפעל בוט
              </Button>
            )}
          </div>

          <div className="border-t border-slate-100 pt-4">
            <p className="text-xs font-medium text-slate-700 mb-2">פקודות זמינות:</p>
            <div className="grid grid-cols-2 gap-1 text-xs text-slate-500 font-mono">
              <span>/today</span><span>משימות להיום</span>
              <span>/deals</span><span>עסקאות פעילות</span>
              <span>/client &lt;שם&gt;</span><span>פרטי לקוח</span>
              <span>/add_note &lt;לקוח&gt; &lt;טקסט&gt;</span><span>הוסף הערה</span>
              <span>/create_task &lt;לקוח&gt; &lt;משימה&gt;</span><span>צור משימה</span>
              <span>/pipeline</span><span>סיכום צינור</span>
            </div>
          </div>
        </div>
      </Card>

      {/* CSV */}
      <Card title="ייצוא / ייבוא CSV">
        <div className="space-y-4">
          <p className="text-sm text-slate-500">
            ייצוא נתונים לקובץ CSV לפתיחה ב-Excel, או ייבוא לקוחות מקובץ CSV קיים.
          </p>
          <div className="flex flex-wrap gap-3">
            <Button
              variant="secondary"
              loading={csvLoading === 'clients'}
              onClick={() => handleExport('clients')}
            >
              ↓ ייצוא לקוחות
            </Button>
            <Button
              variant="secondary"
              loading={csvLoading === 'deals'}
              onClick={() => handleExport('deals')}
            >
              ↓ ייצוא עסקאות
            </Button>
            <Button
              variant="secondary"
              loading={csvLoading === 'tasks'}
              onClick={() => handleExport('tasks')}
            >
              ↓ ייצוא משימות
            </Button>
            <Button
              variant="secondary"
              loading={csvLoading === 'import'}
              onClick={handleImport}
            >
              ↑ ייבוא לקוחות מ-CSV
            </Button>
          </div>
          {importMsg && (
            <div className="text-sm px-3 py-2 rounded-lg bg-blue-50 text-blue-700 border border-blue-200">
              {importMsg}
            </div>
          )}
          <div className="text-xs text-slate-400 bg-slate-50 rounded p-3 border border-slate-200">
            <p className="font-medium text-slate-500 mb-1">פורמט ייבוא לקוחות:</p>
            <p className="font-mono">name,company,email,phone,website,address,status</p>
            <p className="mt-1">עמודות חובה: name. עמודה status: active / inactive / lead</p>
          </div>
        </div>
      </Card>

      {/* Backup */}
      <Card title="גיבוי ושחזור">
        <div className="space-y-4">
          <p className="text-sm text-slate-500">
            גיבוי יוצר עותק מלא של מסד הנתונים. שחזור מחליף את כל הנתונים הקיימים ומפעיל מחדש את האפליקציה.
          </p>
          <div className="flex gap-3">
            <Button
              variant="secondary"
              loading={backupLoading}
              onClick={handleBackupCreate}
            >
              ↓ צור גיבוי
            </Button>
            <Button
              variant="secondary"
              loading={restoreLoading}
              onClick={handleBackupRestore}
              className="text-amber-700 border-amber-300 hover:bg-amber-50"
            >
              ↑ שחזר מגיבוי
            </Button>
          </div>
          {backupMsg && (
            <div className="text-sm px-3 py-2 rounded-lg bg-slate-50 text-slate-700 border border-slate-200">
              {backupMsg}
            </div>
          )}
        </div>
      </Card>

      {/* Version */}
      <div className="text-xs text-slate-400 text-center pb-4">
        CRM גרסה 1.0.0 · ניהול לקוחות שולחני
      </div>
    </div>
  )
}
