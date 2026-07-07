import { describe, expect, it } from "vitest"

import { defaultLabelsEn } from "./defaultLabels.en.js"
import { resolveLabels } from "./labels.js"

describe("resolveLabels", () => {
  it("returns English defaults", () => {
    expect(resolveLabels("en").joinButton).toBe(defaultLabelsEn.joinButton)
  })

  it("merges overrides", () => {
    expect(resolveLabels("en", { joinButton: "Enter" }).joinButton).toBe("Enter")
    expect(resolveLabels("en", { joinButton: "Enter" }).leaveButton).toBe(
      defaultLabelsEn.leaveButton,
    )
  })

  it("falls back to English for unknown locales", () => {
    expect(resolveLabels("fr").joinButton).toBe(defaultLabelsEn.joinButton)
  })
})
