#!/usr/bin/env python3
"""Produce openapi-sdk.yaml by removing internal (x-visibility: internal) operations."""

from __future__ import annotations

import sys
from pathlib import Path

try:
    import yaml
except ImportError:
    print("PyYAML required: pip install pyyaml", file=sys.stderr)
    sys.exit(1)


def filter_spec(spec: dict) -> dict:
    paths = spec.get("paths", {})
    filtered_paths: dict = {}

    for path, path_item in paths.items():
        if not isinstance(path_item, dict):
            continue

        kept: dict = {}
        for method, operation in path_item.items():
            if method.startswith("x-"):
                continue
            if not isinstance(operation, dict):
                kept[method] = operation
                continue
            visibility = operation.get("x-visibility", "dashboard")
            if visibility == "internal":
                continue
            kept[method] = operation

        # Preserve path-level extensions
        for key, value in path_item.items():
            if key.startswith("x-") and key not in kept:
                kept[key] = value

        if any(k in kept for k in ("get", "post", "put", "patch", "delete", "head", "options")):
            filtered_paths[path] = kept

    spec = dict(spec)
    spec["paths"] = filtered_paths
    info = dict(spec.get("info", {}))
    info["description"] = (
        (info.get("description") or "")
        + "\n\nFiltered SDK spec: internal endpoints removed."
    ).strip()
    spec["info"] = info
    return spec


def main() -> int:
    root = Path(__file__).resolve().parents[1]
    src = root / "stream-web" / "docs" / "openapi.yaml"
    dst = root / "stream-web" / "docs" / "openapi-sdk.yaml"

    with src.open() as f:
        spec = yaml.safe_load(f)

    filtered = filter_spec(spec)

    with dst.open("w") as f:
        yaml.safe_dump(filtered, f, sort_keys=False, default_flow_style=False, width=120)

    print(f"Wrote {dst} ({len(filtered.get('paths', {}))} paths)")
    return 0


if __name__ == "__main__":
    sys.exit(main())
