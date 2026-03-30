import Database from 'better-sqlite3'

export function seedDatabase(db: Database.Database): void {
  const alreadySeeded = db.prepare('SELECT value FROM settings WHERE key = ?').get('seeded')
  if (alreadySeeded) return

  // ── Clients ──────────────────────────────────────────────────────────────
  const insertClient = db.prepare(`
    INSERT INTO clients (name, company, email, phone, website, address, status, notes)
    VALUES (@name, @company, @email, @phone, @website, @address, @status, @notes)
  `)

  const c1 = insertClient.run({
    name: 'דוד לוי',
    company: 'לוי טכנולוגיות בע"מ',
    email: 'david@levy-tech.co.il',
    phone: '052-3456789',
    website: 'https://levy-tech.co.il',
    address: 'רחוב הרצל 45, תל אביב',
    status: 'active',
    notes: 'לקוח ותיק ומשלם בזמן. מתעניין בפתרונות ענן.'
  })

  const c2 = insertClient.run({
    name: 'מיכל כהן',
    company: 'כהן שיווק דיגיטלי',
    email: 'michal@cohen-digital.co.il',
    phone: '054-7891234',
    website: 'https://cohen-digital.co.il',
    address: 'שדרות בן גוריון 12, חיפה',
    status: 'active',
    notes: 'מחפשת פתרון CRM מותאם לצוות שלה.'
  })

  const c3 = insertClient.run({
    name: 'יוסף אברהם',
    company: 'אברהם ייבוא ויצוא',
    email: 'yosef@abraham-trade.co.il',
    phone: '050-1122334',
    website: null,
    address: 'רחוב ויצמן 8, ראשון לציון',
    status: 'active',
    notes: 'עוסק בייבוא מוצרי אלקטרוניקה מסין.'
  })

  const c4 = insertClient.run({
    name: 'שרה גולדברג',
    company: 'גולדברג ייעוץ עסקי',
    email: 'sara@goldberg-consulting.co.il',
    phone: '053-9988776',
    website: 'https://goldberg-consulting.co.il',
    address: 'רחוב יפו 33, ירושלים',
    status: 'lead',
    notes: 'ליד חדש שהגיע מהמלצה. יש לקדם ישיבת היכרות.'
  })

  const c5 = insertClient.run({
    name: 'אמיר בן דוד',
    company: 'בן דוד נדל"ן',
    email: 'amir@bendavid-realty.co.il',
    phone: '058-4455667',
    website: 'https://bendavid-realty.co.il',
    address: 'שדרות רוטשילד 100, תל אביב',
    status: 'inactive',
    notes: 'לקוח לשעבר שהפסיק פעילות. ייתכן שיחזור בעתיד.'
  })

  const clientIds = [
    c1.lastInsertRowid as number,
    c2.lastInsertRowid as number,
    c3.lastInsertRowid as number,
    c4.lastInsertRowid as number,
    c5.lastInsertRowid as number
  ]

  // ── Contacts ─────────────────────────────────────────────────────────────
  const insertContact = db.prepare(`
    INSERT INTO contacts (client_id, name, role, email, phone)
    VALUES (@client_id, @name, @role, @email, @phone)
  `)

  // Client 1 contacts
  insertContact.run({ client_id: clientIds[0], name: 'רוני לוי', role: 'מנכ"ל', email: 'roni@levy-tech.co.il', phone: '052-3456790' })
  insertContact.run({ client_id: clientIds[0], name: 'תמר שפירא', role: 'מנהלת פיתוח', email: 'tamar@levy-tech.co.il', phone: '052-3456791' })
  insertContact.run({ client_id: clientIds[0], name: 'גל מזרחי', role: 'ראש צוות טכנולוגיה', email: 'gal@levy-tech.co.il', phone: '052-3456792' })

  // Client 2 contacts
  insertContact.run({ client_id: clientIds[1], name: 'נועה ברק', role: 'מנהלת שיווק', email: 'noa@cohen-digital.co.il', phone: '054-7891235' })
  insertContact.run({ client_id: clientIds[1], name: 'אורן פרידמן', role: 'מנהל תוכן', email: 'oren@cohen-digital.co.il', phone: '054-7891236' })

  // Client 3 contacts
  insertContact.run({ client_id: clientIds[2], name: 'חיים אברהם', role: 'שותף', email: 'haim@abraham-trade.co.il', phone: '050-1122335' })
  insertContact.run({ client_id: clientIds[2], name: 'ליאת סבן', role: 'מנהלת לוגיסטיקה', email: 'liat@abraham-trade.co.il', phone: '050-1122336' })

  // Client 4 contacts
  insertContact.run({ client_id: clientIds[3], name: 'שרה גולדברג', role: 'יועצת ראשית', email: 'sara@goldberg-consulting.co.il', phone: '053-9988776' })
  insertContact.run({ client_id: clientIds[3], name: 'דנה רוזנברג', role: 'עוזרת אישית', email: 'dana@goldberg-consulting.co.il', phone: '053-9988777' })

  // Client 5 contacts
  insertContact.run({ client_id: clientIds[4], name: 'אמיר בן דוד', role: 'בעלים', email: 'amir@bendavid-realty.co.il', phone: '058-4455667' })
  insertContact.run({ client_id: clientIds[4], name: 'ינון כץ', role: 'סוכן נדל"ן', email: 'yinon@bendavid-realty.co.il', phone: '058-4455668' })

  // ── Deals ─────────────────────────────────────────────────────────────────
  const insertDeal = db.prepare(`
    INSERT INTO deals (client_id, title, amount, currency, stage, expected_close_date, notes)
    VALUES (@client_id, @title, @amount, @currency, @stage, @expected_close_date, @notes)
  `)

  const d1 = insertDeal.run({
    client_id: clientIds[0],
    title: 'פרויקט מערכת ענן - לוי טכנולוגיות',
    amount: 250000,
    currency: 'ILS',
    stage: 'proposal',
    expected_close_date: '2026-04-15',
    notes: 'הצעת מחיר נשלחה. ממתין לאישור.'
  })

  const d2 = insertDeal.run({
    client_id: clientIds[0],
    title: 'תחזוקה שנתית - לוי טכנולוגיות',
    amount: 85000,
    currency: 'ILS',
    stage: 'closed_won',
    expected_close_date: '2026-02-01',
    notes: 'חוזה נחתם בהצלחה.'
  })

  const d3 = insertDeal.run({
    client_id: clientIds[1],
    title: 'קמפיין שיווק דיגיטלי Q2',
    amount: 120000,
    currency: 'ILS',
    stage: 'negotiation',
    expected_close_date: '2026-04-01',
    notes: 'מנהלים משא ומתן על היקף הפרויקט.'
  })

  const d4 = insertDeal.run({
    client_id: clientIds[1],
    title: 'בניית אתר אינטרנט חדש',
    amount: 45000,
    currency: 'ILS',
    stage: 'qualified',
    expected_close_date: '2026-05-01',
    notes: 'הלקוחה מעוניינת. צריך לשלוח הצעת מחיר.'
  })

  const d5 = insertDeal.run({
    client_id: clientIds[2],
    title: 'ייבוא מכשירי אלקטרוניקה - מארס 2026',
    amount: 500000,
    currency: 'ILS',
    stage: 'closed_won',
    expected_close_date: '2026-03-01',
    notes: 'העסקה הושלמה. המוצרים הגיעו למחסן.'
  })

  const d6 = insertDeal.run({
    client_id: clientIds[2],
    title: 'יבוא ציוד רפואי',
    amount: 320000,
    currency: 'ILS',
    stage: 'lead',
    expected_close_date: '2026-06-30',
    notes: 'ליד ראשוני. צריך בדיקת רגולציה.'
  })

  const d7 = insertDeal.run({
    client_id: clientIds[3],
    title: 'ייעוץ אסטרטגי לשנת 2026',
    amount: 180000,
    currency: 'ILS',
    stage: 'qualified',
    expected_close_date: '2026-04-20',
    notes: 'פגישה ראשונית התקיימה בהצלחה.'
  })

  const d8 = insertDeal.run({
    client_id: clientIds[4],
    title: 'שיווק פרויקט דיור חדש',
    amount: 30000,
    currency: 'ILS',
    stage: 'closed_lost',
    expected_close_date: '2026-01-15',
    notes: 'הלקוח בחר בספק אחר.'
  })

  const dealIds = [
    d1.lastInsertRowid as number,
    d2.lastInsertRowid as number,
    d3.lastInsertRowid as number,
    d4.lastInsertRowid as number,
    d5.lastInsertRowid as number,
    d6.lastInsertRowid as number,
    d7.lastInsertRowid as number,
    d8.lastInsertRowid as number
  ]

  // ── Tasks ─────────────────────────────────────────────────────────────────
  const insertTask = db.prepare(`
    INSERT INTO tasks (client_id, deal_id, title, description, due_date, completed, priority)
    VALUES (@client_id, @deal_id, @title, @description, @due_date, @completed, @priority)
  `)

  insertTask.run({ client_id: clientIds[0], deal_id: dealIds[0], title: 'שליחת הצעת מחיר מעודכנת', description: 'לעדכן את ההצעה לפי הערות הלקוח', due_date: '2026-03-25', completed: 0, priority: 'high' })
  insertTask.run({ client_id: clientIds[0], deal_id: null, title: 'שיחת מעקב עם דוד לוי', description: 'לבדוק שביעות רצון לאחר ההתקנה האחרונה', due_date: '2026-03-26', completed: 0, priority: 'medium' })
  insertTask.run({ client_id: clientIds[1], deal_id: dealIds[2], title: 'הכנת מצגת לפגישת מו"מ', description: 'להכין מצגת עם ניתוח ROI לקמפיין', due_date: '2026-03-27', completed: 0, priority: 'high' })
  insertTask.run({ client_id: clientIds[1], deal_id: dealIds[3], title: 'איסוף דרישות לאתר', description: 'לשלוח שאלון דרישות למיכל כהן', due_date: '2026-03-28', completed: 0, priority: 'medium' })
  insertTask.run({ client_id: clientIds[2], deal_id: dealIds[5], title: 'בדיקת רגולציה ייבוא ציוד רפואי', description: 'לפנות למשרד הבריאות לבירור הדרישות', due_date: '2026-04-01', completed: 0, priority: 'high' })
  insertTask.run({ client_id: clientIds[2], deal_id: null, title: 'תיאום פגישה עם יוסף אברהם', description: 'לקבוע פגישת רבעון', due_date: '2026-03-30', completed: 0, priority: 'low' })
  insertTask.run({ client_id: clientIds[3], deal_id: dealIds[6], title: 'שליחת הסכם ייעוץ לחתימה', description: 'להכין את ההסכם ולשלוח בדואל לשרה גולדברג', due_date: '2026-03-26', completed: 0, priority: 'high' })
  insertTask.run({ client_id: clientIds[3], deal_id: null, title: 'פגישת היכרות עם גולדברג ייעוץ', description: 'פגישה ראשונית להכרת הצרכים', due_date: '2026-03-25', completed: 1, priority: 'medium' })
  insertTask.run({ client_id: clientIds[0], deal_id: null, title: 'עדכון נתוני לקוח במערכת', description: 'לעדכן כתובת וטלפון של לוי טכנולוגיות', due_date: '2026-03-20', completed: 0, priority: 'low' })
  insertTask.run({ client_id: clientIds[1], deal_id: null, title: 'שליחת חשבונית לכהן שיווק', description: 'לשלוח חשבונית עבור עבודות ינואר', due_date: '2026-03-18', completed: 0, priority: 'medium' })
  insertTask.run({ client_id: clientIds[4], deal_id: null, title: 'ניסיון יצירת קשר מחדש עם בן דוד', description: 'לשלוח מייל ולנסות לחדש את הקשר העסקי', due_date: '2026-04-10', completed: 0, priority: 'low' })
  insertTask.run({ client_id: null, deal_id: null, title: 'עדכון מערכת CRM לגרסה חדשה', description: 'לבצע גיבוי ועדכון לגרסה 2.0', due_date: '2026-04-05', completed: 0, priority: 'medium' })

  // ── Notes ─────────────────────────────────────────────────────────────────
  const insertNote = db.prepare(`
    INSERT INTO notes (client_id, deal_id, content, type)
    VALUES (@client_id, @deal_id, @content, @type)
  `)

  insertNote.run({ client_id: clientIds[0], deal_id: dealIds[0], content: 'שיחה עם רוני לוי - מעוניין בפרויקט הענן אבל רוצה להוריד מחיר ב-10%. נדון בפגישה הבאה.', type: 'call' })
  insertNote.run({ client_id: clientIds[0], deal_id: null, content: 'פגישה בתל אביב - דוד הביע שביעות רצון רבה מהשירות. ביקש להרחיב את ההסכם.', type: 'meeting' })
  insertNote.run({ client_id: clientIds[0], deal_id: dealIds[1], content: 'חוזה תחזוקה שנתית נחתם. העתק נשלח לדוא"ל. תחילת השירות ב-01/02/2026.', type: 'note' })
  insertNote.run({ client_id: clientIds[1], deal_id: dealIds[2], content: 'שיחה עם מיכל - מעוניינת בקמפיין רחב יותר מהתוכנית המקורית. שולחים הצעה מעודכנת.', type: 'call' })
  insertNote.run({ client_id: clientIds[1], deal_id: null, content: 'מייל מהלקוחה - שאלות לגבי בניית האתר החדש. יש לחזור אליה עד מחר.', type: 'email' })
  insertNote.run({ client_id: clientIds[1], deal_id: dealIds[3], content: 'פגישת kickoff לפרויקט האתר - הוגדרו יעדים, לו"ז ואבני דרך. צוות המפתחים שובץ.', type: 'meeting' })
  insertNote.run({ client_id: clientIds[2], deal_id: dealIds[4], content: 'המשלוח הגיע בזמן. 450 יחידות של מוצרי אלקטרוניקה עברו בדיקת איכות. הכל תקין.', type: 'note' })
  insertNote.run({ client_id: clientIds[2], deal_id: dealIds[5], content: 'שיחה עם יוסף - מעוניין לייבא ציוד רפואי. צריך לבדוק רישיונות ייבוא ואישורי משרד הבריאות.', type: 'call' })
  insertNote.run({ client_id: clientIds[2], deal_id: null, content: 'מייל לחיים אברהם עם סיכום הפגישה ורשימת הצעדים הבאים לפרויקט הייבוא החדש.', type: 'email' })
  insertNote.run({ client_id: clientIds[3], deal_id: dealIds[6], content: 'פגישת היכרות עם שרה גולדברג - הציגה את הצרכים העסקיים שלה. מחפשת ייעוץ לצמיחה ב-2026.', type: 'meeting' })
  insertNote.run({ client_id: clientIds[3], deal_id: null, content: 'שרה שלחה מסמך עם פירוט האתגרים העסקיים. נקרא ונכין הצעה מותאמת.', type: 'email' })
  insertNote.run({ client_id: clientIds[4], deal_id: dealIds[7], content: 'אמיר הודיע שבחרו בספק אחר. יצרתי קשר לשאול מה היה הגורם המכריע. אמר שמחיר.', type: 'call' })
  insertNote.run({ client_id: clientIds[4], deal_id: null, content: 'שמרנו על קשר ידידותי. אמיר אמר שייתכן שיחזור בפרויקטים עתידיים. לסמן למעקב.', type: 'note' })
  insertNote.run({ client_id: clientIds[0], deal_id: dealIds[0], content: 'נשלחה הצעת מחיר מעודכנת עם הנחה של 8%. ממתין לתגובה תוך 3 ימי עסקים.', type: 'email' })
  insertNote.run({ client_id: clientIds[1], deal_id: dealIds[2], content: 'פגישת מו"מ - הגענו להסכמה על היקף הקמפיין. נותר לסגור פרטי תשלום ולוח זמנים.', type: 'meeting' })

  // ── Seed marker ───────────────────────────────────────────────────────────
  db.prepare('INSERT INTO settings (key, value) VALUES (?, ?)').run('seeded', '1')
}
