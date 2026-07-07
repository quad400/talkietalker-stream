// src/signaling/types.ts
var SIMULCAST_LAYERS = [
  { rid: "q", maxBitrate: 15e4, scaleResolutionDownBy: 4 },
  { rid: "h", maxBitrate: 5e5, scaleResolutionDownBy: 2 },
  { rid: "f", maxBitrate: 25e5, scaleResolutionDownBy: 1 }
];
function parseEnvList(value) {
  return value?.split(",").map((item) => item.trim()).filter(Boolean);
}
function buildIceServers() {
  const stunUrls = parseEnvList(process.env.NEXT_PUBLIC_WEBRTC_STUN_URLS);
  const turnUrls = parseEnvList(process.env.NEXT_PUBLIC_WEBRTC_TURN_URLS);
  const username = process.env.NEXT_PUBLIC_WEBRTC_TURN_USERNAME;
  const credential = process.env.NEXT_PUBLIC_WEBRTC_TURN_CREDENTIAL;
  const servers = [];
  for (const url of stunUrls ?? []) {
    servers.push({ urls: url });
  }
  for (const url of turnUrls ?? []) {
    servers.push({
      urls: url,
      username: username || void 0,
      credential: credential || void 0
    });
  }
  if (servers.length > 0) return servers;
  return [
    { urls: "stun:localhost:3478" },
    {
      urls: "turn:localhost:3478",
      username: "turnuser",
      credential: "turnpass"
    }
  ];
}
var DEFAULT_ICE_SERVERS = buildIceServers();
var DEFAULT_RTC_CONFIG = {
  iceServers: DEFAULT_ICE_SERVERS,
  bundlePolicy: "max-bundle",
  rtcpMuxPolicy: "require",
  iceCandidatePoolSize: 10
};

export {
  SIMULCAST_LAYERS,
  DEFAULT_ICE_SERVERS,
  DEFAULT_RTC_CONFIG
};
//# sourceMappingURL=chunk-GWIKW3Y4.js.map