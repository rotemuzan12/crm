import TelegramBot from 'node-telegram-bot-api'
import Database from 'better-sqlite3'

let bot: TelegramBot | null = null
let isRunning = false

// ── Stage labels in Hebrew ────────────────────────────────────────────────
const STAGE_LABELS: Record<string, string> = {
  lead: 'ליד',
  qualified: 'רלוונטי והצעת מחיר',
  in_progress: 'בתהליך עבודה',
  completed: 'בוצע',
  paid_closed: 'שולם וסגור',
  irrelevant: 'לא רלוונטי'
}

// ── Priority labels in Hebrew ─────────────────────────────────────────────
const PRIORITY_LABELS: Record<string, string> = {
  low: 'נמוכה',
  medium: 'בינונית',
  high: 'גבוהה'
}

// ── Payment method labels in Hebrew ───────────────────────────────────────
const PAYMENT_METHOD_LABELS: Record<string, string> = {
  transfer: 'העברה בנקאית',
  cash: 'מזומן',
  check: 'צ\'ק',
  bit: 'ביט',
  paybox: 'פייבוקס',
  credit: 'אשראי',
  other: 'אחר'
}

// Marker used to represent payments with no linked client in callback data
const NO_CLIENT_KEY = '0'

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
      'ברוכים הבאים ל-UzanLab CRM! 🎉\nהקלד /help לרשימת פקודות'
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
        `/payments - תשלומים לפי לקוח\n` +
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
           WHERE d.stage NOT IN ('completed', 'paid_closed', 'irrelevant')
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
            `SELECT COUNT(*) AS cnt FROM deals WHERE client_id = ? AND stage NOT IN ('completed', 'paid_closed', 'irrelevant')`
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
           WHERE stage NOT IN ('completed', 'paid_closed', 'irrelevant')
           GROUP BY stage
           ORDER BY
             CASE stage
               WHEN 'lead' THEN 1
               WHEN 'qualified' THEN 2
               WHEN 'in_progress' THEN 3
               ELSE 4
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

  // ── /payments ─────────────────────────────────────────────────────────
  // Shows an inline keyboard of clients that have payments. Tap a client to
  // see their full payment history.
  bot.onText(/\/payments(?:\s+(.+))?/, (msg, match) => {
    const chatId = msg.chat.id
    if (!isAuthorized(msg.from?.id, allowedUserIds)) {
      bot!.sendMessage(chatId, 'אין לך הרשאה להשתמש בבוט זה.')
      return
    }

    // Optional text fallback: /payments <client name>
    const arg = match?.[1]?.trim()
    if (arg) {
      try {
        const client = db
          .prepare('SELECT id, name FROM clients WHERE name LIKE ? LIMIT 1')
          .get(`%${arg}%`) as { id: number; name: string } | undefined
        if (!client) {
          bot!.sendMessage(chatId, `לא נמצא לקוח בשם "${arg}".`)
          return
        }
        sendClientPayments(chatId, client.id, client.name)
      } catch (err) {
        bot!.sendMessage(chatId, `שגיאה: ${String(err)}`)
      }
      return
    }

    try {
      const rows = db
        .prepare(
          `SELECT
             COALESCE(p.client_id, 0) AS client_id,
             COALESCE(cl.name, 'ללא לקוח') AS client_name,
             COUNT(*) AS count,
             COALESCE(SUM(CASE WHEN p.currency = 'ILS' THEN p.amount ELSE 0 END), 0) AS total_ils
           FROM payments p
           LEFT JOIN clients cl ON p.client_id = cl.id
           GROUP BY COALESCE(p.client_id, 0), COALESCE(cl.name, 'ללא לקוח')
           ORDER BY total_ils DESC, count DESC
           LIMIT 30`
        )
        .all() as Array<{ client_id: number; client_name: string; count: number; total_ils: number }>

      if (rows.length === 0) {
        bot!.sendMessage(chatId, 'אין תשלומים רשומים במערכת.')
        return
      }

      const keyboard = rows.map((r) => {
        const totalLabel = r.total_ils > 0
          ? new Intl.NumberFormat('he-IL', { style: 'currency', currency: 'ILS', maximumFractionDigits: 0 }).format(r.total_ils)
          : ''
        const buttonText = totalLabel
          ? `${r.client_name} · ${r.count} · ${totalLabel}`
          : `${r.client_name} · ${r.count} תשלומים`
        return [{ text: buttonText, callback_data: `pay:c:${r.client_id || NO_CLIENT_KEY}` }]
      })

      bot!.sendMessage(chatId, '💰 בחר לקוח לצפייה בתשלומים:', {
        reply_markup: { inline_keyboard: keyboard }
      })
    } catch (err) {
      bot!.sendMessage(chatId, `שגיאה: ${String(err)}`)
    }
  })

  // Helper: send the full payment list for a single client to a chat
  function sendClientPayments(chatId: number, clientId: number, clientName: string): void {
    const isOrphan = clientId === 0
    const payments = db
      .prepare(
        isOrphan
          ? `SELECT p.amount, p.currency, p.payment_date, p.method, p.notes, d.title AS deal_title
             FROM payments p
             LEFT JOIN deals d ON p.deal_id = d.id
             WHERE p.client_id IS NULL
             ORDER BY p.payment_date DESC, p.created_at DESC`
          : `SELECT p.amount, p.currency, p.payment_date, p.method, p.notes, d.title AS deal_title
             FROM payments p
             LEFT JOIN deals d ON p.deal_id = d.id
             WHERE p.client_id = ?
             ORDER BY p.payment_date DESC, p.created_at DESC`
      )
      .all(...(isOrphan ? [] : [clientId])) as Array<{
        amount: number
        currency: string
        payment_date: string
        method: string
        notes: string | null
        deal_title: string | null
      }>

    if (payments.length === 0) {
      bot!.sendMessage(chatId, `אין תשלומים רשומים ל-${clientName}.`)
      return
    }

    const totalsByCurrency: Record<string, number> = {}
    for (const p of payments) {
      totalsByCurrency[p.currency] = (totalsByCurrency[p.currency] ?? 0) + p.amount
    }
    const totalsLine = Object.entries(totalsByCurrency)
      .map(([cur, total]) => new Intl.NumberFormat('he-IL', { style: 'currency', currency: cur, maximumFractionDigits: 2 }).format(total))
      .join(' · ')

    const lines = payments.map((p) => {
      const date = new Date(p.payment_date).toLocaleDateString('he-IL')
      const amount = new Intl.NumberFormat('he-IL', { style: 'currency', currency: p.currency, maximumFractionDigits: 2 }).format(p.amount)
      const method = PAYMENT_METHOD_LABELS[p.method] ?? p.method
      const deal = p.deal_title ? ` · ${p.deal_title}` : ''
      const note = p.notes ? `\n  📝 ${p.notes}` : ''
      return `• ${date} · ${amount} · ${method}${deal}${note}`
    })

    const header = `💰 תשלומים — ${clientName} (${payments.length})`
    const summary = `סה"כ: ${totalsLine}`
    bot!.sendMessage(chatId, `${header}\n${summary}\n\n${lines.join('\n')}`)
  }

  // ── Inline keyboard callbacks ─────────────────────────────────────────
  bot.on('callback_query', (query) => {
    const chatId = query.message?.chat.id
    if (!chatId) return
    if (!isAuthorized(query.from?.id, allowedUserIds)) {
      bot!.answerCallbackQuery(query.id, { text: 'אין הרשאה' })
      return
    }

    const data = query.data ?? ''
    if (data.startsWith('pay:c:')) {
      const idStr = data.slice('pay:c:'.length)
      const clientId = parseInt(idStr, 10)
      try {
        if (clientId === 0) {
          sendClientPayments(chatId, 0, 'ללא לקוח')
        } else {
          const client = db.prepare('SELECT name FROM clients WHERE id = ?').get(clientId) as
            | { name: string }
            | undefined
          if (!client) {
            bot!.answerCallbackQuery(query.id, { text: 'הלקוח לא נמצא' })
            return
          }
          sendClientPayments(chatId, clientId, client.name)
        }
        bot!.answerCallbackQuery(query.id)
      } catch (err) {
        bot!.answerCallbackQuery(query.id, { text: 'שגיאה' })
        console.error('[Telegram] callback error:', err)
      }
      return
    }

    bot!.answerCallbackQuery(query.id)
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
