export { T as TalkieTalkerRoom, a as TalkieTalkerRoomFeatures, b as TalkieTalkerRoomProps } from '../talkietalker-room-4GR3RvRt.js';
export { u as useRoomSession } from '../use-room-session-BzL2H1A-.js';
import * as React from 'react';
import React__default from 'react';
import { T as TalkieTalkerStreamLabels } from '../labels-D_vdARkH.js';
import { l as SignalingParticipant } from '../types-B0jEi-Tw.js';
import '../helpers-DN-TLYSB.js';
import '../video-quality-DOL7mOQn.js';

declare function RoomControls({ micMuted, videoOff, isScreenSharing, onToggleMic, onToggleVideo, onToggleScreenShare, onLeave, screenShareEnabled, labels, }: {
    micMuted: boolean;
    videoOff: boolean;
    isScreenSharing: boolean;
    onToggleMic: () => void;
    onToggleVideo: () => void;
    onToggleScreenShare: () => void;
    onLeave: () => void;
    screenShareEnabled?: boolean;
    labels: TalkieTalkerStreamLabels;
}): React__default.JSX.Element;

declare function RoomVideoGrid({ participants, activeSpeakerId, }: {
    participants: SignalingParticipant[];
    activeSpeakerId?: string | null;
}): React.JSX.Element;

declare function VideoTile({ participant, speaking, className, }: {
    participant: SignalingParticipant;
    speaking?: boolean;
    className?: string;
}): React.JSX.Element;

export { RoomControls, RoomVideoGrid, VideoTile };
