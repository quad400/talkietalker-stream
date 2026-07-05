type VideoQualityTier = "hd1080" | "hd720" | "sd480" | "sd360";
type VideoQualityMode = "adaptive-high" | "max";
interface VideoQualityProfile {
    tier: VideoQualityTier;
    label: string;
    captureConstraints: MediaTrackConstraints;
    encodingParams: {
        maxBitrate: number;
        maxFramerate: number;
        scaleResolutionDownBy: number;
    };
}
interface ScreenShareEncodingProfile {
    maxBitrate: number;
    maxFramerate: number;
    scaleResolutionDownBy: number;
    contentHint: "detail" | "text" | "motion";
}
declare const DEFAULT_VIDEO_QUALITY_TIER: VideoQualityTier;
declare const DEFAULT_VIDEO_QUALITY_MODE: VideoQualityMode;
declare const VIDEO_QUALITY_TIER_ORDER: VideoQualityTier[];
declare const VIDEO_QUALITY_PROFILES: Record<VideoQualityTier, VideoQualityProfile>;
declare const SCREEN_SHARE_ENCODING: ScreenShareEncodingProfile;
/** Shared camera capture constraints — 1080p ideal. */
declare const DEFAULT_CAMERA_VIDEO_CONSTRAINTS: MediaTrackConstraints;
declare function getVideoQualityProfile(tier: VideoQualityTier): VideoQualityProfile;
declare function getVideoQualityLabel(tier: VideoQualityTier): string;
declare function isCameraVideoTrack(track: MediaStreamTrack): boolean;
declare function isScreenShareVideoTrack(track: MediaStreamTrack): boolean;

export { DEFAULT_CAMERA_VIDEO_CONSTRAINTS as D, SCREEN_SHARE_ENCODING as S, type VideoQualityTier as V, type VideoQualityMode as a, DEFAULT_VIDEO_QUALITY_MODE as b, DEFAULT_VIDEO_QUALITY_TIER as c, type ScreenShareEncodingProfile as d, VIDEO_QUALITY_PROFILES as e, VIDEO_QUALITY_TIER_ORDER as f, type VideoQualityProfile as g, getVideoQualityLabel as h, getVideoQualityProfile as i, isCameraVideoTrack as j, isScreenShareVideoTrack as k };
