import type { NextConfig } from "next"

const nextConfig: NextConfig = {
  transpilePackages: ["@talkietalker/stream-react", "@talkietalker/stream-sdk"],
}

export default nextConfig
