/** Read a process environment variable (Node.js only). */
export function readEnv(name: string): string | undefined {
  if (typeof process !== 'undefined' && process.env?.[name]) {
    return process.env[name]
  }
  return undefined
}
