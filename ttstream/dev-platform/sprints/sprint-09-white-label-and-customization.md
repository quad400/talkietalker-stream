# Sprint 09 — White-label & Customization

**Duration:** 2 weeks  
**Goal:** Integrators can hide TalkieTalkerStream branding and match their product identity.  
**Depends on:** Sprint 05, Sprint 06  
**Blocks:** Sprint 10

---

## Objectives

1. Project-level branding config (logo, colors, fonts)
2. Remove "Powered by TalkieTalkerStream" option (paid plan)
3. Custom subdomain for embed (`meet.customer.com` via CNAME)
4. Configurable feature flags per project
5. Custom prejoin / waiting room copy

---

## Tasks

### Task 09.1 — Branding schema

**Estimate:** 3 pts

```sql
ALTER TABLE projects ADD COLUMN branding JSONB NOT NULL DEFAULT '{}';
```

```json
{
  "logo_url": "https://...",
  "primary_color": "#6366f1",
  "background_color": "#0f172a",
  "font_family": "Inter",
  "show_talkietalker_stream_badge": false,
  "custom_css_url": null
}
```

API: `PATCH /api/v1/projects/{id}` includes `branding`

---

### Task 09.2 — React SDK theming

**Estimate:** 5 pts

- [ ] `TalkieTalkerStreamProvider theme` reads branding from token or props
- [ ] CSS variables: `--sf-primary`, `--sf-bg`, `--sf-font`
- [ ] Optional `customCssUrl` injection (CSP warning in docs)
- [ ] `showBranding={false}` requires pro plan (validate server-side)

---

### Task 09.3 — iframe branding

**Estimate:** 5 pts

- [ ] `/embed/room/{id}` loads branding from project via token claims
- [ ] Favicon and page title from `branding.app_name`
- [ ] `?theme=dark` override

---

### Task 09.4 — Custom embed subdomain (stretch)

**Estimate:** 8 pts

- [ ] `embed.customer.com` CNAME → `embed.talkietalker.stream`
- [ ] TLS via Cloudflare or cert-manager
- [ ] `projects.custom_embed_domain` field
- [ ] Validate domain ownership (DNS TXT record)

Defer to post-GA if infra not ready — document as enterprise feature.

---

### Task 09.5 — Feature flags per project

**Estimate:** 5 pts

```json
{
  "features": {
    "chat": true,
    "screen_share": true,
    "recording": false,
    "waiting_room": true,
    "breakouts": false,
    "reactions": true
  }
}
```

- [ ] Enforced in signaling join_room (server) and SDK (client)
- [ ] UI toggles in developer dashboard project settings

---

### Task 09.6 — Custom copy / i18n hooks

**Estimate:** 3 pts

```tsx
<TalkieTalkerRoom
  labels={{
    joinButton: 'Enter classroom',
    waitingRoomTitle: 'Please wait for the instructor',
    muteButton: 'Silence mic',
  }}
  locale="de"
/>
```

- [ ] English default strings in package
- [ ] Document i18n extension pattern

---

## Implementation prompt

```
Sprint 09 — White-label.

1. Add branding JSONB to projects
2. Pass branding in embed JWT claims
3. TalkieTalkerRoom applies CSS variables from branding
4. show_talkietalker_stream_badge:false requires plan != free (check in embed token handler)

Branding UI in dashboard/developer/projects/[id]/settings.
Security: validate logo_url is https, no javascript: URLs.
```

---

## Acceptance criteria

- [ ] Embed shows customer logo, no TalkieTalkerStream badge on pro plan
- [ ] Feature flags disable screen share when off
- [ ] Custom labels appear on prejoin screen
- [ ] Branding preview in dashboard

**Next:** [Sprint 10 — Production hardening & launch](./sprint-10-production-hardening-and-launch.md)
