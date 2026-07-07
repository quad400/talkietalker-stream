import {
  ENV_NAMES,
  isPublishableKey,
  isSecretKey,
  isWebhookSecret,
  resolveBaseUrl,
} from './endpoints.js'
import { readEnv } from './env.js'
import { ConfigurationError } from '../server/errors.js'

/** Resolved server-side configuration for handlers and token minting. */
export type ServerConfig = {
  secretKey: string
  publishKey?: string
  webhookSecret?: string
  baseURL: string
}

export type TalkieTalkerStreamServerConfig = {
  secretKey?: string
  publishKey?: string
  webhookSecret?: string
  baseURL?: string
}

/**
 * Resolve server config from options or `TALKIETALKER_STREAM_*` environment variables.
 * Used by framework handlers — not required for direct REST client usage.
 */
export function resolveServerConfig(overrides?: TalkieTalkerStreamServerConfig): ServerConfig {
  const secretKey = overrides?.secretKey ?? readEnv(ENV_NAMES.secretKey)
  if (!secretKey) {
    throw new ConfigurationError(
      `Missing ${ENV_NAMES.secretKey}. Set it in your server environment.`,
    )
  }
  if (!isSecretKey(secretKey)) {
    throw new ConfigurationError(
      `${ENV_NAMES.secretKey} must start with sk_test_ or sk_live_.`,
    )
  }

  const publishKey =
    overrides?.publishKey ??
    readEnv(ENV_NAMES.publishKey) ??
    readEnv(ENV_NAMES.publishKeyPublic)

  if (publishKey && !isPublishableKey(publishKey)) {
    throw new ConfigurationError(
      'publishKey must start with pk_test_ or pk_live_.',
    )
  }

  const webhookSecret = overrides?.webhookSecret ?? readEnv(ENV_NAMES.webhookSecret)
  if (webhookSecret && !isWebhookSecret(webhookSecret)) {
    throw new ConfigurationError(
      `${ENV_NAMES.webhookSecret} must start with whsec_.`,
    )
  }

  const baseURL = resolveBaseUrl(
    secretKey,
    overrides?.baseURL ?? readEnv(ENV_NAMES.apiUrlOverride),
  )

  return { secretKey, publishKey, webhookSecret, baseURL }
}

/** Helper for typed server config in app bootstrap files. */
export function defineTalkieTalkerStreamConfig(config: TalkieTalkerStreamServerConfig): TalkieTalkerStreamServerConfig {
  return config
}
