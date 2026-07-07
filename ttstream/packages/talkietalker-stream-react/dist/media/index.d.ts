declare const STAGE_RECORDING_STREAM_ID = "__talkietalker_stream_stage_recording__";
type MediaErrorCode = "not_allowed" | "not_found" | "not_readable" | "overconstrained" | "unknown";
interface MediaError {
    code: MediaErrorCode;
    message: string;
    original: unknown;
}
declare function tagStageRecordingStream(stream: MediaStream): MediaStream;
declare class MediaDeviceManager {
    private readonly stageRecordingSenders;
    private stagePlaceholderStream;
    private getStageRecordingPlaceholderTrack;
    getUserMedia(constraints?: MediaStreamConstraints): Promise<MediaStream>;
    getDisplayMedia(): Promise<MediaStream>;
    isStageRecordingSender(pc: RTCPeerConnection, sender: RTCRtpSender): boolean;
    replaceTrack(pc: RTCPeerConnection, newTrack: MediaStreamTrack): Promise<void>;
    /** Attach or swap a local track, reusing an SFU video transceiver when needed. */
    addOrReplaceTrack(pc: RTCPeerConnection, stream: MediaStream, track: MediaStreamTrack): Promise<void>;
    /** Stop local capture tracks and detach them from the peer connection. */
    releaseLocalTrack(pc: RTCPeerConnection, stream: MediaStream, kind: MediaStreamTrack["kind"], options?: {
        keepSender?: boolean;
    }): Promise<void>;
    findSenderForKind(pc: RTCPeerConnection, kind: MediaStreamTrack["kind"]): RTCRtpSender | undefined;
    muteTrack(track: MediaStreamTrack): void;
    unmuteTrack(track: MediaStreamTrack): void;
    stopStream(stream: MediaStream | null): void;
    stopTrack(track: MediaStreamTrack): void;
    ensureStageRecordingTransceiver(pc: RTCPeerConnection): Promise<RTCRtpSender>;
    publishStageRecordingTrack(pc: RTCPeerConnection, stream: MediaStream): Promise<void>;
    unpublishStageRecordingTrack(pc: RTCPeerConnection): Promise<void>;
    private waitForStageRecordingReady;
}
declare const mediaDeviceManager: MediaDeviceManager;

export { type MediaError, STAGE_RECORDING_STREAM_ID, mediaDeviceManager, tagStageRecordingStream };
