# Chance Builders — Deployment Guide

## Deploy to Vercel

### Option A — Vercel CLI  (fastest)
1. Install Node.js from nodejs.org if you don't have it
2. Open a terminal/command prompt in this folder
3. Run: `npm install`
4. Run: `npm install -g vercel`
5. Run: `vercel`
6. Follow the prompts — accept all defaults
7. When asked about environment variables, add:
   - REACT_APP_SUPABASE_URL
   - REACT_APP_SUPABASE_KEY

### Option B — Vercel Dashboard (no terminal needed)
1. Go to github.com and create a new repository called "chance-builders"
2. Upload all these files to that repo
3. Go to vercel.com → New Project → Import from GitHub
4. Select your repo
5. Under Environment Variables, add:
   - Name: REACT_APP_SUPABASE_URL  Value: https://hkvlvbalojjirzlojvfi.supabase.co
   - Name: REACT_APP_SUPABASE_KEY  Value: (your publishable key)
6. Click Deploy

### After deploy
- Vercel gives you a URL like: https://chance-builders.vercel.app
- Open it on your phone — add to home screen for app-like experience
- Data saves to Supabase automatically

## Supabase Tables Required
Run the SQL from the conversation in your Supabase SQL Editor before first use.

## Project Structure
```
ChanceBuilders/
├── public/
│   └── index.html
├── src/
│   ├── App.jsx        ← Main app
│   ├── supabase.js    ← Database connection
│   └── index.js       ← Entry point
├── .env               ← Your credentials (never commit this to GitHub)
├── package.json
└── README.md
```

## IMPORTANT — .env and GitHub
Never upload your .env file to GitHub. It contains your API keys.
Vercel handles credentials through their Environment Variables settings instead.

## Brick: upload invoice/receipt photos (`upload-job-receipt`)

Brick (ops assistant) stores invoice/receipt photos on Chance Builders payments without using the in-app picker. The official Supabase MCP has no storage upload tool; **do not** give Brick `SUPABASE_SERVICE_ROLE_KEY`. Use this Edge Function instead.

The existing in-app path is unchanged: `src/supabase.js` `uploadPaymentAttachment` → private bucket `job-receipts` → `{projectId}/{taskId}/{paymentId}/{sanitizedFilename}` (unique suffix, `upsert: false`). Attachment objects are `{ id, path, name, mime }`. **Never persist a signed URL.**

### Secret (value is not in git)

Set **`RECEIPT_UPLOAD_SECRET`** in Supabase Dashboard → Project Settings → Edge Functions → Secrets (or `supabase secrets set RECEIPT_UPLOAD_SECRET=…`).

`verify_jwt` is **false** (same as Tim’s other cron/webhook functions). Auth is header `x-upload-secret` matching that secret.

### Request

`POST https://hkvlvbalojjirzlojvfi.supabase.co/functions/v1/upload-job-receipt`

```http
POST /functions/v1/upload-job-receipt
x-upload-secret: <RECEIPT_UPLOAD_SECRET>
Content-Type: application/json
```

```json
{
  "projectId": "<projects.id>",
  "taskId": "<task.id>",
  "paymentId": "<payment.id>",
  "filename": "home-depot-receipt.jpg",
  "mime": "image/jpeg",
  "fileBase64": "<raw base64 or data:image/jpeg;base64,…>"
}
```

`mime` is optional (inferred from `filename` or a data-URL prefix). JSON + base64 is the supported body (simpler for Brick than multipart).

### Response `200`

```json
{
  "id": "abc1234",
  "path": "{projectId}/{taskId}/{paymentId}/{safeName}_{uuid}.jpg",
  "name": "home-depot-receipt.jpg",
  "mime": "image/jpeg"
}
```

That object is the only thing that belongs on `payment.attachments`.

### After upload (Brick / Nova)

1. Load the `projects` row where `id = projectId`.
2. Find `data.phases[].tasks[].payments[]` with `payment.id === paymentId`.
3. Append the response object to `payment.attachments` (create the array if missing).
4. Upsert `projects.data`. Do not store a signed URL.

### Errors

| Status | When |
|--------|------|
| `400` | Missing `projectId` / `taskId` / `paymentId`, empty file, invalid base64, or path-unsafe ids |
| `401` | Missing or wrong `x-upload-secret` |
| `405` | Method other than POST / OPTIONS |
| `413` | File over 10MB (same cap as the app) |
| `500` | `RECEIPT_UPLOAD_SECRET` not set, or storage error |

`OPTIONS` is accepted (CORS not required for Brick).

### Deploy

```bash
supabase functions deploy upload-job-receipt --no-verify-jwt
```

Or paste `supabase/functions/upload-job-receipt/index.ts` in the Dashboard and leave **Verify JWT** off. Set `RECEIPT_UPLOAD_SECRET` before Brick calls it. The function uses the platform `SUPABASE_SERVICE_ROLE_KEY` only inside the isolate.
