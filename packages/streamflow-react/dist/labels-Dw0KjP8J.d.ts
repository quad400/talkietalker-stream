type StreamFlowLabels = {
    joinButton: string;
    waitingRoomTitle: string;
    muteButton: string;
    unmuteButton: string;
    startVideoButton: string;
    stopVideoButton: string;
    shareScreenButton: string;
    stopShareButton: string;
    leaveButton: string;
    connecting: string;
    poweredBy: string;
    displayNamePlaceholder: string;
    prejoinTitle: string;
};
declare function resolveLabels(locale?: string, overrides?: Partial<StreamFlowLabels>): StreamFlowLabels;

export { type StreamFlowLabels as S, resolveLabels as r };
