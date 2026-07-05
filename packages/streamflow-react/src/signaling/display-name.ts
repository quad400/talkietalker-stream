export function sanitizeDisplayName(value: string, maxLength = 64): string {
  return (
    value
      .replace(/[\u0000-\u001F\u007F]/g, "")
      .trim()
      .slice(0, maxLength) || "Guest"
  )
}
