import type { Request, Response, Router } from 'express'
import express from 'express'
import { createStreamFlowHandlers, type HandlerOptions } from '../handlers/index.js'

export function streamflowRouter(options: HandlerOptions = {}): Router {
  const handlers = createStreamFlowHandlers(options)
  const router = express.Router()

  router.post('/token', async (req: Request, res: Response) => {
    try {
      const result = await handlers.handleToken(req.body, {
        publishKey: req.header('X-StreamFlow-Publish-Key'),
      })
      res.json(result)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'request failed'
      const status = message === 'unauthorized' ? 401 : 400
      res.status(status).json({ error: message })
    }
  })

  router.post(
    '/webhooks',
    express.raw({ type: 'application/json' }),
    async (req: Request, res: Response) => {
      try {
        const rawBody = req.body as Buffer
        const signature = req.header('X-StreamFlow-Signature') ?? ''
        const result = await handlers.handleWebhook(rawBody, signature)
        res.json(result)
      } catch (err) {
        const message = err instanceof Error ? err.message : 'request failed'
        res.status(400).json({ error: message })
      }
    },
  )

  return router
}
