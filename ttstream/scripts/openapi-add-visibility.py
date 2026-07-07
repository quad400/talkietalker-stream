#!/usr/bin/env python3
"""Add x-visibility to every OpenAPI operation based on path rules."""

from __future__ import annotations

import re
import sys
from pathlib import Path

PUBLIC_PATH_PATTERNS = [
    r"^/health$",
    r"^/api/v1/auth/(register|login|refresh|verify-email)$",
    r"^/api/v1/streams/live$",
    r"^/api/v1/streams/\{id\}$",  # GET only handled below
    r"^/api/v1/streams/\{id\}/watch$",
    r"^/api/v1/streams/\{stream_id\}/chat/guest-session$",
    r"^/api/v1/streams/\{stream_id\}/chat/ws$",
    r"^/api/v1/ws$",
    r"^/watch/",
    r"^/room/demo$",
    r"^/api/v1/tiers/channel/",
    r"^/api/v1/tiers/\{id\}$",  # GET only
]

INTERNAL_PATH_PATTERNS = [
    r"^/internal/",
    r"^/api/v1/audit-logs",
    r"/health/snapshot$",
]


def visibility_for(path: str, method: str) -> str:
    for pat in INTERNAL_PATH_PATTERNS:
        if re.search(pat, path):
            return "internal"
    if path == "/api/v1/streams/{id}" and method == "get":
        return "public"
    if path == "/api/v1/tiers/{id}" and method == "get":
        return "public"
    for pat in PUBLIC_PATH_PATTERNS:
        if re.match(pat, path):
            return "public"
    return "dashboard"


def main() -> int:
    root = Path(__file__).resolve().parents[1]
    spec_path = root / "stream-web" / "docs" / "openapi.yaml"
    text = spec_path.read_text()
    lines = text.splitlines(keepends=True)

    out: list[str] = []
    i = 0
    current_path: str | None = None

    while i < len(lines):
        line = lines[i]
        path_match = re.match(r'^  "(/[^"]+)":\s*$', line)
        if path_match:
            current_path = path_match.group(1)
            out.append(line)
            i += 1
            continue

        method_match = re.match(r"^    (get|post|patch|delete|put):\s*$", line)
        if method_match and current_path:
            method = method_match.group(1)
            out.append(line)
            i += 1
            # Skip if x-visibility already on next lines inside operation
            j = i
            has_visibility = False
            while j < len(lines) and not re.match(r"^    [a-z]+:\s*$", lines[j]) and not re.match(r'^  "/', lines[j]):
                if lines[j].strip().startswith("x-visibility:"):
                    has_visibility = True
                    break
                if lines[j].startswith("  ") and not lines[j].startswith("    "):
                    break
                j += 1
            if not has_visibility:
                vis = visibility_for(current_path, method)
                out.append(f"      x-visibility: {vis}\n")
            continue

        out.append(line)
        i += 1

    spec_path.write_text("".join(out))
    print(f"Updated x-visibility tags in {spec_path}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
