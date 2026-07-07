# SQL tenant review checklist

Use this checklist when adding or changing repository queries that touch tenant-scoped resources.

## Required

- [ ] Every `SELECT` / `UPDATE` / `DELETE` on `streams` or `recordings` filters by `project_id` for API-key callers (or joins `streams.project_id` for child tables).
- [ ] Cross-tenant access returns **404** (`ErrNotFound`), never **403** with an existence leak.
- [ ] `INSERT` into `streams` sets `project_id` from the authenticated tenant context (API key principal or resolved JWT project).
- [ ] `INSERT` into `recordings` copies `project_id` from the parent stream.
- [ ] New migrations backfill `project_id` before `NOT NULL` constraints.
- [ ] Indexes exist on `streams(project_id)` and `recordings(project_id)`.

## API key scopes

- [ ] `streams:read` — list/get streams only (not start/stop).
- [ ] `streams:write` — create/start/stop streams.
- [ ] `recordings:read` — list recordings.
- [ ] `access:grant` — comp access grants.
- [ ] `rooms:join` — mint embed tokens / join rooms via embed JWT.

## Embed / WebSocket

- [ ] `sk_` API keys rejected on `/api/v1/ws`.
- [ ] Embed JWT validates `rooms:join` scope and `projects.allowed_origins` for browser `Origin` headers.
