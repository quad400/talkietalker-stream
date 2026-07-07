import { createTalkieTalkerStreamHandlers } from '../handlers/index.js';
export async function talkieTalkerStreamPlugin(app, options = {}) {
    const handlers = createTalkieTalkerStreamHandlers(options);
    const prefix = options.prefix ?? '';
    app.post(`${prefix}/token`, async (req, reply) => {
        try {
            const body = req.body;
            const result = await handlers.handleToken({
                roomId: typeof body.roomId === 'string' ? body.roomId : undefined,
                participantName: typeof body.participantName === 'string' ? body.participantName : undefined,
                participant: typeof body.participant === 'object' && body.participant !== null
                    ? {
                        name: String(body.participant.name ?? ''),
                        userId: body.participant.userId,
                        role: body.participant.role,
                    }
                    : undefined,
            }, { publishKey: req.headers['x-talkietalker-stream-publish-key'] });
            return reply.send(result);
        }
        catch (err) {
            const message = err instanceof Error ? err.message : 'request failed';
            const status = message === 'unauthorized' ? 401 : 400;
            return reply.status(status).send({ error: message });
        }
    });
    app.post(`${prefix}/webhooks`, {
        config: { rawBody: true },
    }, async (req, reply) => {
        try {
            const rawBody = req.body;
            const signature = req.headers['x-talkietalker-stream-signature'] ?? '';
            const result = await handlers.handleWebhook(rawBody, signature);
            return reply.send(result);
        }
        catch (err) {
            const message = err instanceof Error ? err.message : 'request failed';
            return reply.status(400).send({ error: message });
        }
    });
}
