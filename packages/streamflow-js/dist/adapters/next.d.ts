import { type HandlerOptions } from '../handlers/index.js';
export declare function streamflowHandlers(options?: HandlerOptions): {
    POST: (req: Request) => Promise<Response>;
};
