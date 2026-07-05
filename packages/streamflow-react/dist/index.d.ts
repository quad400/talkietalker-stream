import * as React from 'react';
import { c as StreamFlowClient, d as StreamFlowClientOptions } from './streamflow-room-BzckFtcH.js';
export { C as ConfigurationError, e as ConnectionInfo, P as Participant, S as StreamFlowRoom, a as StreamFlowRoomFeatures, b as StreamFlowRoomProps } from './streamflow-room-BzckFtcH.js';
import { a as StreamFlowTheme } from './config-B8NkwJXw.js';
export { c as applyCustomCss, t as themeToCssVars } from './config-B8NkwJXw.js';
import { S as StreamFlowLabels } from './labels-Dw0KjP8J.js';
export { r as resolveLabels } from './labels-Dw0KjP8J.js';
import './types-B0jEi-Tw.js';

type StreamFlowProps = {
    children: React.ReactNode;
    client?: StreamFlowClient;
    clientOptions?: StreamFlowClientOptions;
    getAccessToken?: () => Promise<string | null>;
    wsUrl?: string;
    theme?: StreamFlowTheme;
    locale?: string;
    labels?: Partial<StreamFlowLabels>;
    customCssUrl?: string;
};
declare function StreamFlow({ children, client, clientOptions, getAccessToken, wsUrl, theme, locale, labels: labelOverrides, customCssUrl, }: StreamFlowProps): React.JSX.Element;
declare function useStreamFlowClient(): StreamFlowClient;
/** @deprecated Use `StreamFlow` instead. */
declare const StreamFlowProvider: typeof StreamFlow;

type EmbedBranding = {
    app_name?: string;
    logo_url?: string;
    primary_color?: string;
    background_color?: string;
    font_family?: string;
    show_streamflow_badge?: boolean;
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
type StreamFlowPlayerProps = {
    streamId: string;
    token?: string;
    wsUrl?: string;
    theme?: "dark" | "light";
    className?: string;
    onPaymentRequired?: (info: PaymentRequiredInfo) => void;
};
declare function StreamFlowPlayer({ streamId, token, wsUrl, theme, className, onPaymentRequired, }: StreamFlowPlayerProps): React.JSX.Element;

type EmbedBridgeEvent = {
    type: "streamflow:joined";
    payload: {
        roomId?: string;
        streamId?: string;
        participantId?: string;
    };
} | {
    type: "streamflow:left";
    payload: {
        reason?: string;
    };
} | {
    type: "streamflow:error";
    payload: {
        code?: string;
        message: string;
    };
};
declare function postEmbedEvent(event: EmbedBridgeEvent, targetOrigin?: string): void;
declare function isEmbedBridgeEvent(data: unknown): data is EmbedBridgeEvent;

export { type EmbedBranding, type EmbedBridgeEvent, type EmbedFeatures, type PaymentRequiredInfo, StreamFlow, StreamFlowClient, StreamFlowClientOptions, StreamFlowLabels, StreamFlowPlayer, type StreamFlowPlayerProps, type StreamFlowProps, StreamFlowProvider, StreamFlowTheme, brandingToTheme, embedFeaturesToRoomFeatures, isEmbedBridgeEvent, parseEmbedClaims, parseEmbedExpiryMs, postEmbedEvent, resolveWsUrlFromPublishKey, useStreamFlowClient };
