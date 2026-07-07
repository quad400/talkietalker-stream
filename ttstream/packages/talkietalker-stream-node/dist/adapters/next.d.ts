import { type HandlerOptions } from '../handlers/index.js';
export declare function talkieTalkerStreamHandlers(options?: HandlerOptions): {
    POST: (req: Request) => Promise<Response>;
};
