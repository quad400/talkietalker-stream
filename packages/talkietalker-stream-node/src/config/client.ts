import {
  ENV_NAMES,
  isPublishableKey,
  isSecretKey,
  resolveBaseUrl,
} from './endpoints.js'
import { readEnv } from './env.js'
import type { TalkieTalkerStreamConfig } from '../types/index.js'

export type ResolvedClientConfig = TalkieTalkerStreamConfig & {
  secretKey: string
  baseURL: string
}

/**
 * Resolve and validate client configuration from explicit options or environment.
 * @throws If `secretKey` is missing or malformed.
 */
export function resolveClientConfig(overrides: TalkieTalkerStreamConfig = {}): ResolvedClientConfig {
  const secretKey = overrides.secretKey ?? readEnv(ENV_NAMES.secretKey)
  if (!secretKey) {
    throw new Error(
      `Missing secretKey. Pass secretKey or set ${ENV_NAMES.secretKey}.`,
    )
  }
  if (!isSecretKey(secretKey)) {
    throw new Error('secretKey must start with sk_test_ or sk_live_.')
  }

  const publishKey =
    overrides.publishKey ??
    readEnv(ENV_NAMES.publishKey) ??
    readEnv(ENV_NAMES.publishKeyPublic)

  if (publishKey && !isPublishableKey(publishKey)) {
    throw new Error('publishKey must start with pk_test_ or pk_live_.')
  }

  const baseURL = resolveBaseUrl(
    secretKey,
    overrides.baseURL ?? readEnv(ENV_NAMES.apiUrlOverride),
  )

  return {
    ...overrides,
    secretKey,
    publishKey,
    baseURL,
    maxRetries: overrides.maxRetries ?? 3,
  }
}