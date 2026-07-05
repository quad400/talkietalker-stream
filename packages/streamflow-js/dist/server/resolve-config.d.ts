export type ServerConfig = {
    secretKey: string;
    webhookSecret?: string;
    baseURL: string;
};
export type StreamFlowServerConfig = {
    secretKey?: string;
    webhookSecret?: string;
    baseURL?: string;
};
export declare function resolveServerConfig(overrides?: StreamFlowServerConfig): ServerConfig;
export declare function defineStreamFlowConfig(config: StreamFlowServerConfig): StreamFlowServerConfig;
