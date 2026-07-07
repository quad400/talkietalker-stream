import type { ServerConfig } from '../config/server.js';
import type { HandlerOptions, TokenRequestBody, TokenRequestHeaders, TokenResponse } from './types.js';
/**
 * Handle `POST /token` — validate publish key and mint an embed token for a room.
 */
export declare function handleTokenRequest(config: ServerConfig, options: HandlerOptions, body: TokenRequestBody, headers: TokenRequestHeaders): Promise<TokenResponse>;
