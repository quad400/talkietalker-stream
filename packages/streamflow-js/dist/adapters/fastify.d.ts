import type { FastifyInstance, FastifyPluginOptions } from 'fastify';
import { type HandlerOptions } from '../handlers/index.js';
export type FastifyPluginConfig = HandlerOptions & {
    prefix?: string;
};
export declare function streamflowPlugin(app: FastifyInstance, options?: FastifyPluginConfig): Promise<void>;
export type { FastifyPluginOptions };
