import { T as TalkieTalkerStreamLabels } from './labels-D_vdARkH.js';

type TalkieTalkerStreamTheme = {
    primaryColor?: string;
    borderRadius?: string;
    backgroundColor?: string;
    textColor?: string;
    fontFamily?: string;
    logoUrl?: string;
    showBranding?: boolean;
    appName?: string;
};
type TalkieTalkerStreamConfig = {
    wsUrl?: string;
    getAccessToken?: () => Promise<string | null>;
    locale?: string;
    theme?: TalkieTalkerStreamTheme;
    labels?: TalkieTalkerStreamLabels;
    customCssUrl?: string;
};
declare function setTalkieTalkerStreamConfig(next: TalkieTalkerStreamConfig): void;
declare function getTalkieTalkerStreamConfig(): TalkieTalkerStreamConfig;
declare function getWsBaseUrl(explicit?: string): string;
declare function themeToCssVars(theme?: TalkieTalkerStreamTheme, preset?: "dark" | "light"): Record<string, string>;
/** Injects a remote stylesheet. Caller should run the returned cleanup on unmount. */
declare function applyCustomCss(url: string, doc?: Document): () => void;

export { type TalkieTalkerStreamConfig as T, type TalkieTalkerStreamTheme as a, getWsBaseUrl as b, applyCustomCss as c, getTalkieTalkerStreamConfig as g, setTalkieTalkerStreamConfig as s, themeToCssVars as t };
