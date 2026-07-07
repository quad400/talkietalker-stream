/** Build a URL query string from key/value pairs (skips undefined). */
export function buildQuery(params) {
    const search = new URLSearchParams();
    for (const [key, value] of Object.entries(params)) {
        if (value === undefined)
            continue;
        search.set(key, String(value));
    }
    const qs = search.toString();
    return qs ? `?${qs}` : '';
}
export function omitUndefined(obj) {
    const out = {};
    for (const [key, value] of Object.entries(obj)) {
        if (value !== undefined)
            out[key] = value;
    }
    return out;
}
