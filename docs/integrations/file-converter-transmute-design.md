# File Converter (Transmute) — Design

Date: 2026-09-08  
Status: approved (brainstorming)

## Goal

Add a DevToolbox tool **File Converter** that proxies Transmute’s REST API for full multi-format conversion (images, video, audio, documents, etc.), without changing the existing client-side **Image Resizer**.

## Decisions

| Topic | Choice |
| --- | --- |
| Product surface | Separate tool `file-converter` (`/tools/file-converter`) |
| Image Resizer | Unchanged (browser-only WebP / WP presets) |
| Format scope V1 | Everything Transmute exposes |
| Deployment | `TRANSMUTE_BASE_URL` + `TRANSMUTE_API_KEY`; optional Compose service for local |
| Credentials V1 | Instance API key only (per-user override later) |
| Integration style | Thin backend proxy + native DevToolbox UI (no iframe, no browser→Transmute key) |

## Architecture

```
UI (FileConverter) → DevToolbox /api/transmute/* (JWT) → Transmute API (Bearer API key)
```

1. `POST /api/transmute/files` — multipart upload → Transmute `POST /api/files`
2. `POST /api/transmute/conversions` — `{ fileId, outputFormat }` → Transmute conversions
3. `GET /api/transmute/files/:id/download` — stream converted binary
4. `GET /api/transmute/status` — health / configured flag (for UI)

Upstream field names (`id` vs `source_file_id`, sync vs job polling) must be verified against the running instance OpenAPI at `/api/docs` during implementation; the DevToolbox public API above stays stable.

Feature discovery: extend `GET /api/config` with `transmuteEnabled`, true when both `TRANSMUTE_BASE_URL` and `TRANSMUTE_API_KEY` are set (same pattern as Domain Hub / `isDomainHubEnabled`).

**V1 routing:** do not mount `/api/transmute` when disabled; expose `transmuteEnabled` on `/api/config` and hide the tool in the UI.

## Backend components

- `backend/src/lib/transmute.ts` — HTTP client (upload, convert, download, health); never logs the API key
- `backend/src/routes/transmute.ts` — Express router; `authenticateToken` on all routes
- `backend/src/lib/features.ts` — `isTransmuteEnabled()`
- `backend/src/lib/env.ts` + `.env.example` + `docker-compose.yml` — `TRANSMUTE_BASE_URL`, `TRANSMUTE_API_KEY`
- Optional Compose service `transmute` (image `ghcr.io/transmute-app/transmute`, port 3313) for local; production points to external URL

Upload: multer memory or temp disk, max **100 MB**, forward to Transmute; long timeouts for video/audio. No durable storage of conversion payloads in DevToolbox SQLite.

## Frontend components

- `src/pages/tools/FileConverter.tsx` — dropzone → select from `compatible_formats` → convert → download
- `src/hooks/useFileConverter.ts` — state machine (idle / uploading / converting / ready / error)
- Catalogue: `src/data/tools.ts`, lazy route in `App.tsx` + `ProtectedRoute`, `ToolCard.internalTools`, filter via `FeatureFlagsContext` / `useAvailableTools` when `transmuteEnabled` is false
- Disabled UX: if somehow navigated while off, show clear “Transmute non configuré” message

Reuse existing UI primitives (dropzone patterns from Image Resizer / task attachments) and `src/lib/api.ts` (`api.upload`, auth Bearer JWT).

## Security & errors

- Transmute API key never sent to the browser
- Map upstream errors to French messages: timeout, incompatible format, Transmute down, invalid config (401 from Transmute)
- Existing Express rate limit applies
- Rely on Transmute’s own cleanup policy for uploaded files

## Out of scope (V1)

- Per-user Transmute API key override
- Persistent conversion history in DevToolbox
- Fine-grained compression / resize controls (stay on Image Resizer)
- Batch ZIP export
- Embedding Transmute’s own UI

## Testing

- Backend route tests with mocked Transmute client: happy path upload→convert→download; 401 without JWT; routes absent when disabled
- Config test: `transmuteEnabled` false/true on `GET /api/config`
- Manual smoke against local Transmute (Compose): convert an image and a document

## Success criteria

- Authenticated user can convert any Transmute-supported pair through DevToolbox UI when env is set
- Image Resizer behavior unchanged
- Tool hidden and API unmounted when Transmute env is missing
