import { describe, expect, it } from "vitest"

import { findStageRecordingTransceiver, stageRecordingOutboundActive } from "./media-device-manager"

describe("findStageRecordingTransceiver", () => {
  it("returns the second video transceiver when three transceivers exist", () => {
    const transceivers = [
      { mid: "0", sender: { track: { kind: "audio" } }, receiver: {} },
      { mid: "1", sender: { track: { kind: "video" } }, receiver: {} },
      { mid: "2", sender: { track: null }, receiver: {} },
    ] as unknown as RTCRtpTransceiver[]

    const pc = {
      getTransceivers: () => transceivers,
    } as RTCPeerConnection

    expect(findStageRecordingTransceiver(pc)).toBe(transceivers[2])
  })

  it("returns undefined when only one video lane exists", () => {
    const transceivers = [
      { mid: "0", sender: { track: { kind: "audio" } }, receiver: {} },
      { mid: "1", sender: { track: { kind: "video" } }, receiver: {} },
    ] as unknown as RTCRtpTransceiver[]

    const pc = {
      getTransceivers: () => transceivers,
    } as RTCPeerConnection

    expect(findStageRecordingTransceiver(pc)).toBeUndefined()
  })
})

describe("stageRecordingOutboundActive", () => {
  it("returns true when outbound video bytes were sent", () => {
    const stats = new Map<string, object>([
      [
        "outbound-1",
        {
          type: "outbound-rtp",
          kind: "video",
          bytesSent: 128,
        },
      ],
    ]) as unknown as RTCStatsReport

    expect(stageRecordingOutboundActive(stats)).toBe(true)
  })

  it("returns false when track id tagging would not match pc stats", () => {
    const stats = new Map<string, object>([
      [
        "outbound-1",
        {
          type: "outbound-rtp",
          kind: "video",
          trackId: "browser-track-id",
          bytesSent: 0,
          framesEncoded: 0,
        },
      ],
    ]) as unknown as RTCStatsReport

    expect(stageRecordingOutboundActive(stats)).toBe(false)
  })
})
