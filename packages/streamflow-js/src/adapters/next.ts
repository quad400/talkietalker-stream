import { createStreamFlowHandlers, type HandlerOptions } from '../handlers/index.js'

const TOKEN_SEGMENT = 'token'
const WEBHOOK_SEGMENT = 'webhooks'

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  })
}

function errorResponse(message: string, status = 400): Response {
  return jsonResponse({ error: message }, status)
}

export function streamflowHandlers(options: HandlerOptions = {}) {
  const handlers = createStreamFlowHandlers(options)

  async function POST(req: Request): Promise<Response> {
    const url = new URL(req.url)
    const segments = url.pathname.split('/').filter(Boolean)
    const route = segments[segments.length - 1]

    try {
      if (route === TOKEN_SEGMENT) {
        const body = (await req.json()) as Record<string, unknown>
        const result = await handlers.handleToken(
          {
            roomId: typeof body.roomId === 'string' ? body.roomId : undefined,
            participantName:
              typeof body.participantName === 'string' ? body.participantName : undefined,
            participant:
              typeof body.participant === 'object' && body.participant !== null
                ? {
                    name: String((body.participant as { name?: string }).name ?? ''),
                    userId: (body.participant as { userId?: string }).userId,
                    role: (body.participant as { role?: string }).role,
                  }
                : undefined,
          },
          { publishKey: req.headers.get('X-StreamFlow-Publish-Key') },
        )
        return jsonResponse(result)
      }

      if (route === WEBHOOK_SEGMENT) {
        const rawBody = await req.text()
        const signature = req.headers.get('X-StreamFlow-Signature') ?? ''
        const result = await handlers.handleWebhook(rawBody, signature)
        return jsonResponse(result)
      }

      return errorResponse('not found', 404)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'request failed'
      const status = message === 'unauthorized' ? 401 : 400
      return errorResponse(message, status)
    }
  }

  return { POST }
}
