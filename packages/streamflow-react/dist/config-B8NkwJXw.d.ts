import { S as StreamFlowLabels } from './labels-Dw0KjP8J.js';

type StreamFlowTheme = {
    primaryColor?: string;
    borderRadius?: string;
    backgroundColor?: string;
    textColor?: string;
    fontFamily?: string;
    logoUrl?: string;
    showBranding?: boolean;
    appName?: string;
};
type StreamFlowConfig = {
    wsUrl?: string;
    getAccessToken?: () => Promise<string | null>;
    locale?: string;
    theme?: StreamFlowTheme;
    labels?: StreamFlowLabels;
    customCssUrl?: string;
};
declare function setStreamFlowConfig(next: StreamFlowConfig): void;
declare function getStreamFlowConfig(): StreamFlowConfig;
declare function getWsBaseUrl(explicit?: string): string;
declare function themeToCssVars(theme?: StreamFlowTheme, preset?: "dark" | "light"): Record<string, string>;
/** Injects a remote stylesheet. Caller should run the returned cleanup on unmount. */
declare function applyCustomCss(url: string, doc?: Document): () => void;

export { type StreamFlowConfig as S, type StreamFlowTheme as a, getWsBaseUrl as b, applyCustomCss as c, getStreamFlowConfig as g, setStreamFlowConfig as s, themeToCssVars as t };
