import { TalkieTalkerStream } from "@talkietalker/stream-sdk"

let client: TalkieTalkerStream | null = null

export function getTalkieTalkerStream() {
  if (!client) {
    client = new TalkieTalkerStream({
      secretKey: process.env.TALKIETALKER_STREAM_SECRET_KEY,
      publishKey:
        process.env.TALKIETALKER_STREAM_PUBLISH_KEY ??
        process.env.NEXT_PUBLIC_TALKIETALKER_STREAM_PUBLISH_KEY,
      baseURL: process.env.TALKIETALKER_STREAM_API_URL,
    })
  }
  return client
}
