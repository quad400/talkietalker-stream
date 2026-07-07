import * as React from 'react';
import { T as TalkieTalkerStreamLabels } from './labels-D_vdARkH.js';
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
type TalkieTalkerStreamClientOptions = {
    publishKey?: string;
    tokenPath?: string;
    initialToken?: string;
    initialWsUrl?: string;
    fetchImpl?: typeof fetch;
};
declare class ConfigurationError extends Error {
    constructor(message: string);
}
declare class TalkieTalkerStreamClient {
    private readonly publishKey;
    private readonly tokenPath;
    private readonly fetchImpl;
    private readonly cache;
    private initialToken?;
    private initialWsUrl?;
    private static instance;
    constructor(options?: TalkieTalkerStreamClientOptions);
    static create(options?: TalkieTalkerStreamClientOptions): TalkieTalkerStreamClient;
    getPublishKey(): string;
    invalidate(roomId?: string, participant?: Participant): void;
    getConnection(roomId: string, participant: Participant): Promise<ConnectionInfo>;
}

type TalkieTalkerRoomFeatures = {
    chat?: boolean;
    screenShare?: boolean;
    waitingRoom?: boolean;
};
type TalkieTalkerRoomProps = {
    roomId: string;
    participant: Participant;
    hostUserId?: string;
    theme?: "dark" | "light";
    features?: TalkieTalkerRoomFeatures;
    labels?: Partial<TalkieTalkerStreamLabels>;
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
declare function TalkieTalkerRoom({ roomId, participant, hostUserId, theme, features: featuresProp, labels: labelOverrides, locale: localeProp, showBranding: showBrandingProp, logoUrl: logoUrlProp, customCssUrl: customCssUrlProp, prejoin, headless, onLeave, onJoined, onError, renderParticipant, className, }: TalkieTalkerRoomProps): React.JSX.Element;

export { ConfigurationError as C, type Participant as P, TalkieTalkerRoom as T, type TalkieTalkerRoomFeatures as a, type TalkieTalkerRoomProps as b, TalkieTalkerStreamClient as c, type TalkieTalkerStreamClientOptions as d, type ConnectionInfo as e };
