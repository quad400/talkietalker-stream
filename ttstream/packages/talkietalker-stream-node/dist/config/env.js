/** Read a process environment variable (Node.js only). */
export function readEnv(name) {
    if (typeof process !== 'undefined' && process.env?.[name]) {
        return process.env[name];
    }
    return undefined;
}
