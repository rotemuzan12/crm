import TelegramBot from 'node-telegram-bot-api'
import Database from 'better-sqlite3'

let bot: TelegramBot | null = null
let isRunning = false

// ── Stage labels in Hebrew ────────────────────────────────────────────────
const STAGE_LABELS: Record<string, string> = {
  lead: 'ליד',
  qualified: 'מוסמך',
  proposal: 'הצעה',
  negotiation: 'מו"מ',
  closed_won: 'נסגר בהצלחה',
  closed_lost: 'נסגר ללא עסקה'
}

// ── Priority labels in Hebrew ─────────────────────────────────────────────
const PRIORITY_LABELS: Record<string, string> = {
  low: 'נמוכה',
  medium: 'בינונית',
  high: 'גבוהה'
}

function formatAmount(amount: number | null, currency: string): string {
  if (amount === null || amount === undefined) return 'לא צוין'
  return new Intl.NumberFormat('he-IL', { style: 'currency', currency }).format(amount)
}

function isAuthorized(userId: number | undefined, allowedUserIds: number[]): boolean {
  if (!userId) return false
  if (allowedUserIds.length === 0) return true // if no restriction configured, allow all
  return allowedUserIds.includes(userId)
}

export function startBot(
  db: Database.Database,
  token: string,
  allowedUserIds: number[]
): void {
  if (isRunning && bot) {
    console.log('[Telegram] Bot already running.')
    return
  }

  bot = new TelegramBot(token, { polling: true })
  isRunning = true

  console.log('[Telegram] Bot started.')

  // ── /start ────────────────────────────────────────────────────────────
  bot.onText(/\/start/, (msg) => {
    const chatId = msg.chat.id
    if (!isAuthorized(msg.from?.id, allowedUserIds)) {
      bot!.sendMessage(chatId, 'אין לך הרשאה להשתמש בבוט זה.')
      return
    }
    bot!.sendMessage(
      chatId,
      'ברוכים הבאים ל-CRM! 🎉\nהקלד /help לרשימת פקודות'
    )
  })

  // ── /help ─────────────────────────────────────────────────────────────
  bot.onText(/\/help/, (msg) => {
    const chatId = msg.chat.id
    if (!isAuthorized(msg.from?.id, allowedUserIds)) {
      bot!.sendMessage(chatId, 'אין לך הרשאה להשתמש בבוט זה.')
      return
    }
    bot!.sendMessage(
      chatId,
      `רשימת פקודות זמינות:\n\n` +
        `/today - משימות להיום\n` +
        `/deals - עסקאות פעילות\n` +
        `/client <שם> - חיפוש לקוח\n` +
        `/add_note <לקוח> <טקסט> - הוספת הערה\n` +
        `/create_task <לקוח> <משימה> - יצירת משימה\n` +
        `/pipeline - סיכום משפך מכירות`
    )
  })

  // ── /today ────────────────────────────────────────────────────────────
  bot.onText(/\/today/, (msg) => {
    const chatId = msg.chat.id
    if (!isAuthorized(msg.from?.id, allowedUserIds)) {
      bot!.sendMessage(chatId, 'אין לך הרשאה להשתמש בבוט זה.')
      return
    }
    try {
      const tasks = db
        .prepare(
          `SELECT t.title, t.priority, cl.name AS client_name
           FROM tasks t
           LEFT JOIN clients cl ON t.client_id = cl.id
           WHERE t.completed = 0 AND t.due_date = date('now', 'localtime')
           ORDER BY
             CASE t.priority WHEN 'high' THEN 1 WHEN 'medium' THEN 2 ELSE 3 END`
        )
        .all() as Array<{ title: string; priority: string; client_name: string | null }>

      if (tasks.length === 0) {
        bot!.sendMessage(chatId, 'אין משימות להיום. 👍')
        return
      }

      const lines = tasks.map((t) => {
        const priority = PRIORITY_LABELS[t.priority] ?? t.priority
        const client = t.client_name ? ` (${t.client_name})` : ''
        return `• ${t.title}${client} [${priority}]`
      })

      bot!.sendMessage(chatId, `משימות להיום (${tasks.length}):\n\n${lines.join('\n')}`)
    } catch (err) {
      bot!.sendMessage(chatId, `שגיאה: ${String(err)}`)
    }
  })

  // ── /deals ────────────────────────────────────────────────────────────
  bot.onText(/\/deals/, (msg) => {
    const chatId = msg.chat.id
    if (!isAuthorized(msg.from?.id, allowedUserIds)) {
      bot!.sendMessage(chatId, 'אין לך הרשאה להשתמש בבוט זה.')
      return
    }
    try {
      const deals = db
        .prepare(
          `SELECT d.title, d.stage, d.amount, d.currency, cl.name AS client_name
           FROM deals d
           LEFT JOIN clients cl ON d.client_id = cl.id
           WHERE d.stage NOT IN ('closed_won', 'closed_lost')
           ORDER BY d.created_at DESC`
        )
        .all() as Array<{
          title: string
          stage: string
          amount: number | null
          currency: string
          client_name: string | null
        }>

      if (deals.length === 0) {
        bot!.sendMessage(chatId, 'אין עסקאות פעילות כרגע.')
        return
      }

      const lines = deals.map((d) => {
        const stage = STAGE_LABELS[d.stage] ?? d.stage
        const amount = formatAmount(d.amount, d.currency)
        const client = d.client_name ? ` | ${d.client_name}` : ''
        return `• ${d.title}${client}\n  שלב: ${stage} | סכום: ${amount}`
      })

      bot!.sendMessage(chatId, `עסקאות פעילות (${deals.length}):\n\n${lines.join('\n\n')}`)
    } catch (err) {
      bot!.sendMessage(chatId, `שגיאה: ${String(err)}`)
    }
  })

  // ── /client <name> ────────────────────────────────────────────────────
  bot.onText(/\/client (.+)/, (msg, match) => {
    const chatId = msg.chat.id
    if (!isAuthorized(msg.from?.id, allowedUserIds)) {
      bot!.sendMessage(chatId, 'אין לך הרשאה להשתמש בבוט זה.')
      return
    }
    if (!match) return

    const name = match[1].trim()
    try {
      const client = db
        .prepare('SELECT * FROM clients WHERE name LIKE ? LIMIT 1')
        .get(`%${name}%`) as
        | {
            id: number
            name: string
            company: string | null
            phone: string | null
            email: string | null
            status: string
          }
        | undefined

      if (!client) {
        bot!.sendMessage(chatId, `לא נמצא לקוח בשם "${name}".`)
        return
      }

      const activeDeals = (
        db
          .prepare(
            `SELECT COUNT(*) AS cnt FROM deals WHERE client_id = ? AND stage NOT IN ('closed_won', 'closed_lost')`
          )
          .get(client.id) as { cnt: number }
      ).cnt

      const pendingTasks = (
        db
          .prepare('SELECT COUNT(*) AS cnt FROM tasks WHERE client_id = ? AND completed = 0')
          .get(client.id) as { cnt: number }
      ).cnt

      const lines = [
        `👤 *${client.name}*`,
        client.company ? `🏢 ${client.company}` : null,
        client.phone ? `📞 ${client.phone}` : null,
        client.email ? `✉️ ${client.email}` : null,
        `📊 עסקאות פעילות: ${activeDeals}`,
        `✅ משימות ממתינות: ${pendingTasks}`
      ]
        .filter(Boolean)
        .join('\n')

      bot!.sendMessage(chatId, lines, { parse_mode: 'Markdown' })
    } catch (err) {
      bot!.sendMessage(chatId, `שגיאה: ${String(err)}`)
    }
  })

  // ── /add_note <client> <text> ─────────────────────────────────────────
  bot.onText(/\/add_note (.+)/, (msg, match) => {
    const chatId = msg.chat.id
    if (!isAuthorized(msg.from?.id, allowedUserIds)) {
      bot!.sendMessage(chatId, 'אין לך הרשאה להשתמש בבוט זה.')
      return
    }
    if (!match) return

    const parts = match[1].split(' ')
    if (parts.length < 2) {
      bot!.sendMessage(chatId, 'שימוש: /add_note <שם לקוח> <תוכן ההערה>')
      return
    }

    // First word = client search term, rest = note text
    const clientSearch = parts[0].trim()
    const noteText = parts.slice(1).join(' ').trim()

    try {
      const client = db
        .prepare('SELECT id, name FROM clients WHERE name LIKE ? LIMIT 1')
        .get(`%${clientSearch}%`) as { id: number; name: string } | undefined

      if (!client) {
        bot!.sendMessage(chatId, `לא נמצא לקוח בשם "${clientSearch}".`)
        return
      }

      db.prepare('INSERT INTO notes (client_id, content, type) VALUES (?, ?, ?)').run(
        client.id,
        noteText,
        'note'
      )

      bot!.sendMessage(
        chatId,
        `✅ ההערה נוספה בהצלחה ללקוח "${client.name}".\n\n"${noteText}"`
      )
    } catch (err) {
      bot!.sendMessage(chatId, `שגיאה: ${String(err)}`)
    }
  })

  // ── /create_task <client> <task> ──────────────────────────────────────
  bot.onText(/\/create_task (.+)/, (msg, match) => {
    const chatId = msg.chat.id
    if (!isAuthorized(msg.from?.id, allowedUserIds)) {
      bot!.sendMessage(chatId, 'אין לך הרשאה להשתמש בבוט זה.')
      return
    }
    if (!match) return

    const parts = match[1].split(' ')
    if (parts.length < 2) {
      bot!.sendMessage(chatId, 'שימוש: /create_task <שם לקוח> <כותרת המשימה>')
      return
    }

    const clientSearch = parts[0].trim()
    const taskTitle = parts.slice(1).join(' ').trim()

    try {
      const client = db
        .prepare('SELECT id, name FROM clients WHERE name LIKE ? LIMIT 1')
        .get(`%${clientSearch}%`) as { id: number; name: string } | undefined

      if (!client) {
        bot!.sendMessage(chatId, `לא נמצא לקוח בשם "${clientSearch}".`)
        return
      }

      db.prepare(
        'INSERT INTO tasks (client_id, title, priority, completed) VALUES (?, ?, ?, 0)'
      ).run(client.id, taskTitle, 'medium')

      bot!.sendMessage(
        chatId,
        `✅ המשימה נוצרה בהצלחה עבור לקוח "${client.name}".\n\n📝 "${taskTitle}"`
      )
    } catch (err) {
      bot!.sendMessage(chatId, `שגיאה: ${String(err)}`)
    }
  })

  // ── /pipeline ─────────────────────────────────────────────────────────
  bot.onText(/\/pipeline/, (msg) => {
    const chatId = msg.chat.id
    if (!isAuthorized(msg.from?.id, allowedUserIds)) {
      bot!.sendMessage(chatId, 'אין לך הרשאה להשתמש בבוט זה.')
      return
    }
    try {
      const stages = db
        .prepare(
          `SELECT stage, COUNT(*) AS count, COALESCE(SUM(amount), 0) AS total
           FROM deals
           WHERE stage NOT IN ('closed_won', 'closed_lost')
           GROUP BY stage
           ORDER BY
             CASE stage
               WHEN 'lead' THEN 1
               WHEN 'qualified' THEN 2
               WHEN 'proposal' THEN 3
               WHEN 'negotiation' THEN 4
               ELSE 5
             END`
        )
        .all() as Array<{ stage: string; count: number; total: number }>

      if (stages.length === 0) {
        bot!.sendMessage(chatId, 'אין עסקאות פעילות במשפך המכירות.')
        return
      }

      const lines = stages.map((s) => {
        const label = STAGE_LABELS[s.stage] ?? s.stage
        const total = new Intl.NumberFormat('he-IL', { style: 'currency', currency: 'ILS' }).format(
          s.total
        )
        return `• ${label}: ${s.count} עסקאות | ${total}`
      })

      const grandTotal = stages.reduce((sum, s) => sum + s.total, 0)
      const grandFormatted = new Intl.NumberFormat('he-IL', {
        style: 'currency',
        currency: 'ILS'
      }).format(grandTotal)

      bot!.sendMessage(
        chatId,
        `📊 משפך המכירות:\n\n${lines.join('\n')}\n\n💰 סה"כ: ${grandFormatted}`
      )
    } catch (err) {
      bot!.sendMessage(chatId, `שגיאה: ${String(err)}`)
    }
  })

  // ── Polling error handler ──────────────────────────────────────────────
  bot.on('polling_error', (err) => {
    console.error('[Telegram] Polling error:', err.message)
  })
}

export function stopBot(): void {
  if (bot && isRunning) {
    bot.stopPolling()
    bot = null
    isRunning = false
    console.log('[Telegram] Bot stopped.')
  }
}

export function getBotStatus(): { running: boolean } {
  return { running: isRunning }
}
