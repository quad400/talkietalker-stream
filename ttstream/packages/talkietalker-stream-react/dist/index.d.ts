import * as React from 'react';
import { c as TalkieTalkerStreamClient, d as TalkieTalkerStreamClientOptions } from './talkietalker-room-4GR3RvRt.js';
export { C as ConfigurationError, e as ConnectionInfo, P as Participant, T as TalkieTalkerRoom, a as TalkieTalkerRoomFeatures, b as TalkieTalkerRoomProps } from './talkietalker-room-4GR3RvRt.js';
import { a as TalkieTalkerStreamTheme } from './config-BOcrwDyR.js';
export { c as applyCustomCss, t as themeToCssVars } from './config-BOcrwDyR.js';
import { T as TalkieTalkerStreamLabels } from './labels-D_vdARkH.js';
export { r as resolveLabels } from './labels-D_vdARkH.js';
import './types-B0jEi-Tw.js';

type TalkieTalkerStreamProps = {
    children: React.ReactNode;
    client?: TalkieTalkerStreamClient;
    clientOptions?: TalkieTalkerStreamClientOptions;
    getAccessToken?: () => Promise<string | null>;
    wsUrl?: string;
    theme?: TalkieTalkerStreamTheme;
    locale?: string;
    labels?: Partial<TalkieTalkerStreamLabels>;
    customCssUrl?: string;
};
declare function TalkieTalkerStream({ children, client, clientOptions, getAccessToken, wsUrl, theme, locale, labels: labelOverrides, customCssUrl, }: TalkieTalkerStreamProps): React.JSX.Element;
declare function useTalkieTalkerStreamClient(): TalkieTalkerStreamClient;
/** @deprecated Use `TalkieTalkerStream` instead. */
declare const TalkieTalkerStreamProvider: typeof TalkieTalkerStream;

type EmbedBranding = {
    app_name?: string;
    logo_url?: string;
    primary_color?: string;
    background_color?: string;
    font_family?: string;
    show_talkietalker_stream_badge?: boolean;
    custom_css_url?: string | null;
};
type EmbedFeatures = {
    chat?: boolean;
    screen_share?: boolean;
    recording?: boolean;
    waiting_room?: boolean;
    breakouts?: boolean;
    reactions?: boolean;
};
type EmbedClaimsPayload = {
    branding?: EmbedBranding;
    features?: EmbedFeatures;
};
declare function parseEmbedClaims(token: string): EmbedClaimsPayload;
declare function parseEmbedExpiryMs(token: string): number | null;
declare function brandingToTheme(branding?: EmbedBranding): {
    primaryColor: string | undefined;
    backgroundColor: string | undefined;
    fontFamily: string | undefined;
    logoUrl: string | undefined;
    showBranding: boolean;
    appName: string | undefined;
} | undefined;
declare function embedFeaturesToRoomFeatures(features?: EmbedFeatures): {
    chat: boolean | undefined;
    screenShare: boolean | undefined;
    waitingRoom: boolean | undefined;
} | undefined;

declare function resolveWsUrlFromPublishKey(publishKey: string): string;

type PaymentRequiredInfo = {
    streamId: string;
    message?: string;
};
type TalkieTalkerPlayerProps = {
    streamId: string;
    token?: string;
    wsUrl?: string;
    theme?: "dark" | "light";
    className?: string;
    onPaymentRequired?: (info: PaymentRequiredInfo) => void;
};
declare function TalkieTalkerPlayer({ streamId, token, wsUrl, theme, className, onPaymentRequired, }: TalkieTalkerPlayerProps): React.JSX.Element;

type EmbedBridgeEvent = {
    type: "talkietalker-stream:joined";
    payload: {
        roomId?: string;
        streamId?: string;
        participantId?: string;
    };
} | {
    type: "talkietalker-stream:left";
    payload: {
        reason?: string;
    };
} | {
    type: "talkietalker-stream:error";
    payload: {
        code?: string;
        message: string;
    };
};
declare function postEmbedEvent(event: EmbedBridgeEvent, targetOrigin?: string): void;
declare function isEmbedBridgeEvent(data: unknown): data is EmbedBridgeEvent;

export { type EmbedBranding, type EmbedBridgeEvent, type EmbedFeatures, type PaymentRequiredInfo, TalkieTalkerPlayer, type TalkieTalkerPlayerProps, TalkieTalkerStream, TalkieTalkerStreamClient, TalkieTalkerStreamClientOptions, TalkieTalkerStreamLabels, type TalkieTalkerStreamProps, TalkieTalkerStreamProvider, TalkieTalkerStreamTheme, brandingToTheme, embedFeaturesToRoomFeatures, isEmbedBridgeEvent, parseEmbedClaims, parseEmbedExpiryMs, postEmbedEvent, resolveWsUrlFromPublishKey, useTalkieTalkerStreamClient };
