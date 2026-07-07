import type { ServerConfig } from '../config/server.js';
/** Fetch project_id from the SDK config endpoint for a given key. */
export declare function readSdkConfig(config: ServerConfig, key: string): Promise<string>;
/** Resolve and cache the project ID for the configured secret key. */
export declare function resolveProjectId(config: ServerConfig): Promise<string>;
/**
 * Ensure the publish key belongs to the same project as the secret key.
 * Called on every embed token request from the browser.
 */
export declare function validatePublishKey(config: ServerConfig, publishKey: string): Promise<void>;
