import type { FastifyInstance, FastifyPluginOptions, FastifyRequest, FastifyReply } from 'fastify'
import { createStreamFlowHandlers, type HandlerOptions } from '../handlers/index.js'

export type FastifyPluginConfig = HandlerOptions & {
  prefix?: string
}

export async function streamflowPlugin(
  app: FastifyInstance,
  options: FastifyPluginConfig = {},
): Promise<void> {
  const handlers = createStreamFlowHandlers(options)
  const prefix = options.prefix ?? ''

  app.post(`${prefix}/token`, async (req: FastifyRequest, reply: FastifyReply) => {
    try {
      const body = req.body as Record<string, unknown>
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
        { publishKey: req.headers['x-streamflow-publish-key'] as string | undefined },
      )
      return reply.send(result)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'request failed'
      const status = message === 'unauthorized' ? 401 : 400
      return reply.status(status).send({ error: message })
    }
  })

  app.post(`${prefix}/webhooks`, {
    config: { rawBody: true },
  }, async (req: FastifyRequest, reply: FastifyReply) => {
    try {
      const rawBody = req.body as Buffer | string
      const signature = (req.headers['x-streamflow-signature'] as string | undefined) ?? ''
      const result = await handlers.handleWebhook(rawBody, signature)
      return reply.send(result)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'request failed'
      return reply.status(400).send({ error: message })
    }
  })
}

export type { FastifyPluginOptions }
