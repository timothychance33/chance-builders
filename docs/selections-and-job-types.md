# Selections and job types

This is the shape Chance Builders reads and writes on `public.projects.data` (jsonb). The row key is `projects.id`. The app loads a project as `{ id, ...data }` and saves it back with `saveProject`, which upserts the whole `data` object. Do not replace `data` with a partial object. Load the row, change `selections` or `type`, and write the full `data` document back so `phases` (tasks, `lineItems`, `payments`) stay intact.

## Job type `rental_rehab`

| Field | Value |
| --- | --- |
| `data.type` | `rental_rehab` |
| Label | Residential Rehab / Rental |
| Short label | Rental |

Other stored `type` values: `custom`, `spec`, `flip`, `commercial`, `commercial_rehab`.

`rental_rehab` is residential. It uses the same six-draw checklist template as `custom`, `spec`, and `flip` (`DRAW_PHASES` in `src/App.jsx`: Draw 1 Foundation through Draw 6 Closeout). It does **not** use the flip profit view. That view stays `type === "flip"` only (purchase price, hold costs, ARV, projected profit).

Residential types are every type except `commercial` and `commercial_rehab`. Filters, badges, draw templates, and Finishes & Products follow that rule.

### Creating vs switching

- A **new** job created as `rental_rehab` is seeded with the residential six-draw template. Tasks start incomplete, with empty `lineItems` and `payments`.
- **Changing** an existing job to `rental_rehab` does not reseed when the job already has any task. Existing `phases`, tasks, `lineItems`, and `payments` are kept as-is (same arrays). Example: 1001 Palmetto (`id` `pm0cwjy`) already has money on the task whose `id` is `hardware`. Switching that job to `rental_rehab` must leave that task, its line items, and its payments in place.
- If a job has no tasks, switching type fills `phases` from the template for the new type.

## `data.selections`

`data.selections` is an array. If the key is missing, null, or not an array, the app treats it as `[]`.

The array can hold two kinds of rows:

1. **Finishes & Products** rows (this document). The residential Finishes & Products screen reads and writes these.
2. **Legacy client-portal A/B rows** (`title`, `optionA`, `optionB`, and usually `description`, `imageA`, `imageB`, `chosen`, `chosenAt`). The app leaves those rows alone when it saves products. Do not delete them when you add product rows.

A product row is an object with string `item` and without `title`, `optionA`, or `optionB`.

### Product row

```json
{
  "id": "k3m9x2p",
  "item": "Vanity faucet",
  "room": "Bath",
  "brand": "Delta",
  "model": "2592-MPU-DST",
  "color": "Chrome",
  "vendor": "Ferguson",
  "link": "https://example.com/faucet",
  "notes": "Owner wants the high-arc spout",
  "photo": {
    "id": "p8s2n1q",
    "path": "pm0cwjy/selections/k3m9x2p/faucet_018f0b3e-7c2a-4e1d-9a55-0c1e6a2b9d10.jpg",
    "name": "faucet.jpg",
    "mime": "image/jpeg"
  },
  "createdAt": "2026-09-28T15:04:00.000Z",
  "updatedAt": "2026-09-28T15:04:00.000Z"
}
```

| Field | Rule |
| --- | --- |
| `id` | Required string. The app generates it with `Math.random().toString(36).slice(2, 9)` — 7 characters, `[0-9a-z]`. Any unique string matching `^[0-9a-z]{7}$` is safe. Do not put `/` or other path characters in `id` (it is used in the storage path). |
| `item` | Required non-empty string. The only required text field. |
| `room` | Optional string. Empty string means unassigned. The screen groups by trimmed `room` and sorts rooms A–Z, with a blank room last. |
| `brand`, `model`, `color`, `vendor`, `link`, `notes` | Optional strings. The app stores `""` when they are blank. Missing keys are shown as blank. |
| `photo` | Optional. `null` or omit the key when there is no photo. When present, **only** `{ "id", "path", "name", "mime" }`. Never store a signed URL or a `data:` URL. |
| `createdAt`, `updatedAt` | ISO 8601 strings (`new Date().toISOString()`). Set both on create. On edit, keep `createdAt` and refresh `updatedAt`. |

`link` may be stored with or without a scheme. The app opens `http://` and `https://` links as-is and prefixes `https://` otherwise. Do not store `javascript:` links.

### Photo object

Photos use the private Storage bucket `job-receipts` (same bucket as payment receipts). The in-app upload path is:

```text
{projectId}/selections/{selectionId}/{safeFilename}_{uniqueId}.ext
```

`safeFilename` strips path separators and characters outside `[A-Za-z0-9._-]`. `upsert` is false. The object stored on the row is the return value `{ id, path, name, mime }` from that upload — the same four fields as `payment.attachments[]`.

`photo.id` is its own 7-character id, not the selection id. `photo.path` is the storage object path above. `photo.name` is the original file name. `photo.mime` is an image MIME type such as `image/jpeg`, `image/png`, `image/webp`, `image/heic`, or `image/heif`.

To attach a photo without the app UI, upload the file to `job-receipts` at that path and set `photo` to those four fields. To leave a row without a picture, set `"photo": null`.

### Writing rows directly

1. `select data from projects where id = '<project id>'`.
2. If `data.selections` is missing, start from `[]`.
3. Append or update product rows. Match updates on `id`. Preserve any object that has `title` or `optionA` (client-portal rows).
4. Upsert the **full** `data` object, including `phases` and payments, not a blob that only contains `selections`.

The Finishes & Products screen is shown for residential jobs (`custom`, `spec`, `flip`, `rental_rehab`, and any other non-commercial type). Commercial jobs do not show it, but product rows already stored on those jobs are left in `data.selections`.
