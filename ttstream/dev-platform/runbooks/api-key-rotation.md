# API Key Rotation Runbook

## Routine rotation

1. **Create a new key** via dashboard JWT:
   ```bash
   curl -s -X POST "$API/api/v1/projects/$PROJECT_ID/api-keys" \
     -H "Authorization: Bearer $JWT" \
     -H 'Content-Type: application/json' \
     -d '{"name":"CI rotated","scopes":["streams:write","streams:read"]}'
   ```
2. **Store the `secret`** from the 201 response in your secrets manager (shown once only).
3. **Deploy** the new secret to all consumers (CI, staging, production workers).
4. **Verify** a test request succeeds with the new key:
   ```bash
   curl -s -X POST "$API/api/v1/streams" \
     -H "Authorization: Bearer $NEW_SK" \
     -H 'Content-Type: application/json' \
     -d '{"title":"rotation test","mode":"room","visibility":"private"}'
   ```
5. **Revoke the old key**:
   ```bash
   curl -s -X DELETE "$API/api/v1/projects/$PROJECT_ID/api-keys/$OLD_KEY_ID" \
     -H "Authorization: Bearer $JWT"
   ```

## Compromise response

If a key may have been exposed (committed to git, logged, shared in chat):

1. **Revoke immediately** — `DELETE /api/v1/projects/{id}/api-keys/{key_id}`.
2. **Audit** — check `audit_logs` for `api_key.created` / usage patterns on the project.
3. **Issue replacement** — create a new key with minimal scopes required.
4. **Rotate downstream** — update all env vars and redeploy; do not reuse the leaked secret.
5. **Review origins** — confirm `allowed_origins` on the project matches expected embed domains.

## Limits

- Max **25 active keys** per project.
- Max **10 key creations per hour** per account owner.

## Storage rules

- Keys are stored as **bcrypt hashes** in the database; only a masked prefix is retained for display.
- Never log `Authorization` headers or full `sk_*` values.
- Audit log entries record masked prefixes only.
