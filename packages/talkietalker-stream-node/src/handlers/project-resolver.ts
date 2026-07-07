import { isPublishableKey } from '../config/endpoints.js'
import type { ServerConfig } from '../config/server.js'

let cachedProjectId: { secretKey: string; projectId: string } | null = null

/** Fetch project_id from the SDK config endpoint for a given key. */
export async function readSdkConfig(config: ServerConfig, key: string): Promise<string> {
  const res = await fetch(`${config.baseURL}/api/v1/sdk/config`, {
    headers: { Authorization: `Bearer ${key}` },
  })
  if (!res.ok) {
    throw new Error('invalid key')
  }

  const json = (await res.json()) as { data?: { project_id?: string }; project_id?: string }
  const projectId = json.data?.project_id ?? json.project_id
  if (!projectId) {
    throw new Error('project_id missing from sdk config')
  }
  return projectId
}

/** Resolve and cache the project ID for the configured secret key. */
export async function resolveProjectId(config: ServerConfig): Promise<string> {
  if (cachedProjectId?.secretKey === config.secretKey) {
    return cachedProjectId.projectId
  }

  const projectId = await readSdkConfig(config, config.secretKey)
  cachedProjectId = { secretKey: config.secretKey, projectId }
  return projectId
}

/**
 * Ensure the publish key belongs to the same project as the secret key.
 * Called on every embed token request from the browser.
 */
export async function validatePublishKey(config: ServerConfig, publishKey: string): Promise<void> {
  if (!isPublishableKey(publishKey)) {
    throw new Error('invalid publish key')
  }

  const publishProjectId = await readSdkConfig(config, publishKey)
  const secretProjectId = await resolveProjectId(config)
  if (publishProjectId !== secretProjectId) {
    throw new Error('publish key does not match secret key project')
  }
}
