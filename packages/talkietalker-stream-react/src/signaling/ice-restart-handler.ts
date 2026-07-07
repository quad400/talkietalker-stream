import { signalingLog, signalingWarn } from "./helpers"

const MAX_RETRIES = 4
const INITIAL_DELAY_MS = 400
const MAX_DELAY_MS = 4_000

export class IceRestartHandler {
  private retryCount = 0
  private retryDelay = INITIAL_DELAY_MS
  private timer: ReturnType<typeof setTimeout> | null = null
  private aborted = false

  async attemptRestart(
    pc: RTCPeerConnection,
    sendOffer: (sdp: string) => void,
  ): Promise<boolean> {
    if (this.aborted) return false

    if (this.retryCount >= MAX_RETRIES) {
      signalingWarn(`ICE restart exhausted ${MAX_RETRIES} attempts`)
      return false
    }

    this.retryCount++
    signalingLog(
      `ICE restart attempt ${this.retryCount}/${MAX_RETRIES} in ${this.retryDelay}ms`,
    )

    await new Promise<void>((resolve) => {
      this.timer = setTimeout(resolve, this.retryDelay)
    })

    if (this.aborted) return false

    this.retryDelay = Math.min(this.retryDelay * 2, MAX_DELAY_MS)

    try {
      const offer = await pc.createOffer({ iceRestart: true })
      await pc.setLocalDescription(offer)

      if (offer.sdp) {
        sendOffer(offer.sdp)
        signalingLog("ICE restart offer sent")
        return true
      }

      signalingWarn("ICE restart produced empty offer")
      return false
    } catch (error) {
      signalingWarn("ICE restart failed", error)
      return false
    }
  }

  reset(): void {
    this.retryCount = 0
    this.retryDelay = INITIAL_DELAY_MS
    this.clearTimer()
  }

  dispose(): void {
    this.aborted = true
    this.clearTimer()
  }

  get exhausted(): boolean {
    return this.retryCount >= MAX_RETRIES
  }

  private clearTimer(): void {
    if (this.timer) {
      clearTimeout(this.timer)
      this.timer = null
    }
  }
}
