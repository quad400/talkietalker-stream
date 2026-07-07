import express from 'express';
import { createTalkieTalkerStreamHandlers } from '../handlers/index.js';
export function talkieTalkerStreamRouter(options = {}) {
    const handlers = createTalkieTalkerStreamHandlers(options);
    const router = express.Router();
    router.post('/token', async (req, res) => {
        try {
            const result = await handlers.handleToken(req.body, {
                publishKey: req.header('X-TalkieTalker-Stream-Publish-Key'),
            });
            res.json(result);
        }
        catch (err) {
            const message = err instanceof Error ? err.message : 'request failed';
            const status = message === 'unauthorized' ? 401 : 400;
            res.status(status).json({ error: message });
        }
    });
    router.post('/webhooks', express.raw({ type: 'application/json' }), async (req, res) => {
        try {
            const rawBody = req.body;
            const signature = req.header('X-TalkieTalker-Stream-Signature') ?? '';
            const result = await handlers.handleWebhook(rawBody, signature);
            res.json(result);
        }
        catch (err) {
            const message = err instanceof Error ? err.message : 'request failed';
            res.status(400).json({ error: message });
        }
    });
    return router;
}
