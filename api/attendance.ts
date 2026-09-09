import { google } from 'googleapis'
import { EMPLOYEES } from '../src/data'

const columns = ['Date', 'Employee Name', 'Designation', 'Department', 'Attendance Status', 'Remark', 'Updated By', 'Updated Time']

type RecordPayload = { status: string; remark: string; updatedBy: string; updatedAt: string }
type RequestBody = { date: string; updatedBy: string; records: Record<string, RecordPayload> }

const getSheetsClient = () => {
  const privateKey = process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY?.replace(/\\n/g, '\n')
  const auth = new google.auth.GoogleAuth({
    credentials: {
      client_email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
      private_key: privateKey,
    },
    scopes: ['https://www.googleapis.com/auth/spreadsheets'],
  })
  return google.sheets({ version: 'v4', auth })
}

/**
 * Upserts one row per employee/date. Credentials stay server-side in deployment
 * environment variables; the browser only sends the attendance payload.
 */
export default async function handler(request: Request): Promise<Response> {
  if (request.method !== 'POST') return Response.json({ error: 'Method not allowed' }, { status: 405 })
  const spreadsheetId = process.env.GOOGLE_SHEETS_SPREADSHEET_ID
  const tab = process.env.GOOGLE_SHEETS_TAB || 'Attendance'
  if (!spreadsheetId || !process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL || !process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY) {
    return Response.json({ synced: false, reason: 'Google Sheets is not configured yet' }, { status: 200 })
  }
  try {
    const body = await request.json() as RequestBody
    const sheets = getSheetsClient()
    const range = `${tab}!A:H`
    const existing = await sheets.spreadsheets.values.get({ spreadsheetId, range })
    const rows = existing.data.values || []
    const header = rows[0] || columns
    if (!rows[0]) await sheets.spreadsheets.values.update({ spreadsheetId, range: `${tab}!A1:H1`, valueInputOption: 'RAW', requestBody: { values: [columns] } })

    const employeeRows = Object.entries(body.records).map(([employeeId, record]) => ({ employeeId, record }))
    const updates: { range: string; values: string[][] }[] = []
    const appEmployees = Object.fromEntries(EMPLOYEES.map((employee) => [employee.id, employee]))
    employeeRows.forEach(({ employeeId, record }) => {
      const employee = appEmployees[employeeId]
      if (!employee) return
      const values = [[body.date, employee.name, employee.designation, employee.department, record.status, record.remark || '', record.updatedBy, record.updatedAt]]
      const rowIndex = rows.findIndex((row, index) => index > 0 && row[0] === body.date && row[1] === employee.name)
      updates.push({ range: rowIndex > 0 ? `${tab}!A${rowIndex + 1}:H${rowIndex + 1}` : `${tab}!A${rows.length + updates.length + 1}:H${rows.length + updates.length + 1}`, values })
    })
    // Existing rows are updated in place; missing keys append exactly once.
    if (updates.length) await sheets.spreadsheets.values.batchUpdate({ spreadsheetId, requestBody: { valueInputOption: 'RAW', data: updates } })
    return Response.json({ synced: true, updated: updates.length, columns: header })
  } catch (error) {
    console.error('Google Sheets sync failed', error)
    return Response.json({ synced: false, reason: 'Google Sheets sync failed' }, { status: 502 })
  }
}
