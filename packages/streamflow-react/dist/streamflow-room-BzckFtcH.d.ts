import * as React from 'react';
import { S as StreamFlowLabels } from './labels-Dw0KjP8J.js';
import { l as SignalingParticipant } from './types-B0jEi-Tw.js';

type Participant = {
    name: string;
    userId?: string;
    role?: string;
};
type ConnectionInfo = {
    token: string;
    wsUrl: string;
    expiresAt: string;
};
type StreamFlowClientOptions = {
    publishKey?: string;
    tokenPath?: string;
    initialToken?: string;
    initialWsUrl?: string;
    fetchImpl?: typeof fetch;
};
declare class ConfigurationError extends Error {
    constructor(message: string);
}
declare class StreamFlowClient {
    private readonly publishKey;
    private readonly tokenPath;
    private readonly fetchImpl;
    private readonly cache;
    private initialToken?;
    private initialWsUrl?;
    private static instance;
    constructor(options?: StreamFlowClientOptions);
    static create(options?: StreamFlowClientOptions): StreamFlowClient;
    getPublishKey(): string;
    invalidate(roomId?: string, participant?: Participant): void;
    getConnection(roomId: string, participant: Participant): Promise<ConnectionInfo>;
}

type StreamFlowRoomFeatures = {
    chat?: boolean;
    screenShare?: boolean;
    waitingRoom?: boolean;
};
type StreamFlowRoomProps = {
    roomId: string;
    participant: Participant;
    hostUserId?: string;
    theme?: "dark" | "light";
    features?: StreamFlowRoomFeatures;
    labels?: Partial<StreamFlowLabels>;
    locale?: string;
    showBranding?: boolean;
    logoUrl?: string;
    customCssUrl?: string;
    prejoin?: boolean;
    headless?: boolean;
    onLeave?: () => void;
    onJoined?: (participantId: string | null) => void;
    onError?: (message: string) => void;
    renderParticipant?: (participant: SignalingParticipant) => React.ReactNode;
    className?: string;
};
declare function StreamFlowRoom({ roomId, participant, hostUserId, theme, features: featuresProp, labels: labelOverrides, locale: localeProp, showBranding: showBrandingProp, logoUrl: logoUrlProp, customCssUrl: customCssUrlProp, prejoin, headless, onLeave, onJoined, onError, renderParticipant, className, }: StreamFlowRoomProps): React.JSX.Element;

export { ConfigurationError as C, type Participant as P, StreamFlowRoom as S, type StreamFlowRoomFeatures as a, type StreamFlowRoomProps as b, StreamFlowClient as c, type StreamFlowClientOptions as d, type ConnectionInfo as e };
