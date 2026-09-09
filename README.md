# Code Origin.ai Employee Attendance

A focused, responsive employee attendance workspace for Code Origin.ai Private Limited. It includes the full company roster, HR-only editing, date-based local persistence, initials-based photo placeholders, photo replacement, summary counts, filters, mobile cards, and an optional Google Sheets upsert endpoint.

## Run locally

```bash
npm install
npm run dev
```

The app works offline with `localStorage` while the Google Sheet is not configured. Attendance is stored per date under a namespaced key, so a refresh does not lose saved data. The app uses `Asia/Kolkata` for today and display formatting.

The HR demo screen uses the supplied HR identity, **Gagana Priya N**. Because no production password was provided, the prototype's demo button fills `Origin@2026!`; replace the demo flow with the server-side auth endpoint before production. Do not use this demo password in a deployed environment.

## Google Sheets sync

The frontend posts saved attendance to `/api/attendance`. The serverless handler in `api/attendance.ts` is deliberately the only place that reads Google credentials. Configure these server-side environment variables:

```text
GOOGLE_SHEETS_SPREADSHEET_ID=your-spreadsheet-id
GOOGLE_SERVICE_ACCOUNT_EMAIL=service-account@project.iam.gserviceaccount.com
GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\\n..."
GOOGLE_SHEETS_TAB=Attendance
```

Share the target sheet with the service-account email. The endpoint maintains the requested columns and uses `Date + Employee Name` as its upsert key, updating the matching row rather than creating duplicates.

For production HR authentication, create a scrypt hash and set `HR_EMAIL`, `HR_PASSWORD_SALT`, and `HR_PASSWORD_HASH` on the server. The browser should receive only a short-lived session from `/api/auth`; never put service-account or production password material in frontend code.
