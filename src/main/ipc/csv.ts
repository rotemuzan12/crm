import { ipcMain, dialog, BrowserWindow } from 'electron'
import Database from 'better-sqlite3'
import * as fs from 'node:fs'

// ── CSV helpers ────────────────────────────────────────────────────────────

function escapeField(value: unknown): string {
  if (value === null || value === undefined) return ''
  const str = String(value)
  if (str.includes(',') || str.includes('"') || str.includes('\n')) {
    return `"${str.replace(/"/g, '""')}"`
  }
  return str
}

function rowToCsv(row: Record<string, unknown>): string {
  return Object.values(row).map(escapeField).join(',')
}

function buildCsv(rows: Record<string, unknown>[]): string {
  if (rows.length === 0) return ''
  const header = Object.keys(rows[0]).join(',')
  const dataRows = rows.map(rowToCsv)
  return [header, ...dataRows].join('\n')
}

/**
 * Very minimal CSV parser that handles quoted fields.
 * Returns an array of string arrays (rows of fields).
 */
function parseCsv(text: string): string[][] {
  const lines = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n').split('\n')
  const result: string[][] = []

  for (const line of lines) {
    if (line.trim() === '') continue
    const fields: string[] = []
    let current = ''
    let inQuotes = false

    for (let i = 0; i < line.length; i++) {
      const ch = line[i]
      if (inQuotes) {
        if (ch === '"') {
          if (line[i + 1] === '"') {
            current += '"'
            i++
          } else {
            inQuotes = false
          }
        } else {
          current += ch
        }
      } else {
        if (ch === '"') {
          inQuotes = true
        } else if (ch === ',') {
          fields.push(current)
          current = ''
        } else {
          current += ch
        }
      }
    }
    fields.push(current)
    result.push(fields)
  }

  return result
}

async function getSaveFilePath(
  win: BrowserWindow | null,
  defaultName: string
): Promise<string | undefined> {
  const { canceled, filePath } = await dialog.showSaveDialog(win ?? undefined!, {
    defaultPath: defaultName,
    filters: [{ name: 'CSV Files', extensions: ['csv'] }]
  })
  if (canceled || !filePath) return undefined
  return filePath
}

// ── Handler registration ───────────────────────────────────────────────────

export function registerCsvHandlers(db: Database.Database): void {
  // Export Clients
  ipcMain.handle('csv:exportClients', async (): Promise<{ success: boolean; path?: string; error?: string }> => {
    try {
      const rows = db
        .prepare('SELECT id, name, company, email, phone, website, address, status, notes, created_at, updated_at FROM clients ORDER BY name ASC')
        .all() as Record<string, unknown>[]

      const csv = buildCsv(rows)
      const win = BrowserWindow.getFocusedWindow()
      const filePath = await getSaveFilePath(win, 'clients.csv')
      if (!filePath) return { success: false, error: 'ביטול על ידי המשתמש' }

      fs.writeFileSync(filePath, '\uFEFF' + csv, 'utf8') // BOM for Excel Hebrew support
      return { success: true, path: filePath }
    } catch (err) {
      return { success: false, error: String(err) }
    }
  })

  // Export Deals
  ipcMain.handle('csv:exportDeals', async (): Promise<{ success: boolean; path?: string; error?: string }> => {
    try {
      const rows = db
        .prepare(`
          SELECT d.id, d.title, cl.name AS client_name, d.amount, d.currency,
                 d.stage, d.expected_close_date, d.notes, d.created_at, d.updated_at
          FROM deals d
          LEFT JOIN clients cl ON d.client_id = cl.id
          ORDER BY d.created_at DESC
        `)
        .all() as Record<string, unknown>[]

      const csv = buildCsv(rows)
      const win = BrowserWindow.getFocusedWindow()
      const filePath = await getSaveFilePath(win, 'deals.csv')
      if (!filePath) return { success: false, error: 'ביטול על ידי המשתמש' }

      fs.writeFileSync(filePath, '\uFEFF' + csv, 'utf8')
      return { success: true, path: filePath }
    } catch (err) {
      return { success: false, error: String(err) }
    }
  })

  // Export Tasks
  ipcMain.handle('csv:exportTasks', async (): Promise<{ success: boolean; path?: string; error?: string }> => {
    try {
      const rows = db
        .prepare(`
          SELECT t.id, t.title, cl.name AS client_name, d.title AS deal_title,
                 t.description, t.due_date, t.completed, t.priority, t.created_at, t.updated_at
          FROM tasks t
          LEFT JOIN clients cl ON t.client_id = cl.id
          LEFT JOIN deals d ON t.deal_id = d.id
          ORDER BY t.due_date ASC NULLS LAST
        `)
        .all() as Record<string, unknown>[]

      const csv = buildCsv(rows)
      const win = BrowserWindow.getFocusedWindow()
      const filePath = await getSaveFilePath(win, 'tasks.csv')
      if (!filePath) return { success: false, error: 'ביטול על ידי המשתמש' }

      fs.writeFileSync(filePath, '\uFEFF' + csv, 'utf8')
      return { success: true, path: filePath }
    } catch (err) {
      return { success: false, error: String(err) }
    }
  })

  // Import Clients
  ipcMain.handle(
    'csv:importClients',
    async (): Promise<{ imported: number; errors: string[] }> => {
      const win = BrowserWindow.getFocusedWindow()
      const { canceled, filePaths } = await dialog.showOpenDialog(win ?? undefined!, {
        filters: [{ name: 'CSV Files', extensions: ['csv'] }],
        properties: ['openFile']
      })
      if (canceled || filePaths.length === 0) return { imported: 0, errors: [] }

      const raw = fs.readFileSync(filePaths[0], 'utf8').replace(/^\uFEFF/, '') // strip BOM
      const parsed = parseCsv(raw)

      if (parsed.length < 2) return { imported: 0, errors: ['הקובץ ריק או לא תקין'] }

      const headers = parsed[0].map((h) => h.trim().toLowerCase())
      const nameIdx = headers.indexOf('name')
      if (nameIdx === -1) return { imported: 0, errors: ['עמודת name לא נמצאה'] }

      const companyIdx = headers.indexOf('company')
      const emailIdx = headers.indexOf('email')
      const phoneIdx = headers.indexOf('phone')
      const websiteIdx = headers.indexOf('website')
      const addressIdx = headers.indexOf('address')
      const statusIdx = headers.indexOf('status')
      const notesIdx = headers.indexOf('notes')

      const validStatuses = new Set(['active', 'inactive', 'lead'])
      const insert = db.prepare(`
        INSERT INTO clients (name, company, email, phone, website, address, status, notes)
        VALUES (@name, @company, @email, @phone, @website, @address, @status, @notes)
      `)

      let imported = 0
      const errors: string[] = []

      const dataRows = parsed.slice(1)
      for (let i = 0; i < dataRows.length; i++) {
        const row = dataRows[i]
        const lineNum = i + 2

        try {
          const name = nameIdx !== -1 ? row[nameIdx]?.trim() : ''
          if (!name) {
            errors.push(`שורה ${lineNum}: שדה name ריק - דולג`)
            continue
          }

          const rawStatus = statusIdx !== -1 ? row[statusIdx]?.trim() : ''
          const status = validStatuses.has(rawStatus) ? rawStatus : 'active'

          insert.run({
            name,
            company: companyIdx !== -1 ? row[companyIdx]?.trim() || null : null,
            email: emailIdx !== -1 ? row[emailIdx]?.trim() || null : null,
            phone: phoneIdx !== -1 ? row[phoneIdx]?.trim() || null : null,
            website: websiteIdx !== -1 ? row[websiteIdx]?.trim() || null : null,
            address: addressIdx !== -1 ? row[addressIdx]?.trim() || null : null,
            status,
            notes: notesIdx !== -1 ? row[notesIdx]?.trim() || null : null
          })
          imported++
        } catch (err) {
          errors.push(`שורה ${lineNum}: ${String(err)}`)
        }
      }

      return { imported, errors }
    }
  )
}
