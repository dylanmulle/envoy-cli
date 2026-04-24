# `envoy list` Command

List all stored environment snapshots tracked by envoy.

## Usage

```bash
envoy list [options]
```

## Options

| Flag | Alias | Description |
|------|-------|-------------|
| `--environment <name>` | `-e` | Filter results to a specific environment |
| `--json` | | Output results as JSON |

## Examples

### List all environments

```bash
envoy list
```

```
Environment: development
────────────────────────────────────────
  Updated: 1/3/2024, 12:00:00 AM  |  6 keys

Environment: production
────────────────────────────────────────
  Updated: 1/2/2024, 12:00:00 AM  |  8 keys
```

### Filter by environment

```bash
envoy list --environment production
```

### JSON output (useful for scripting)

```bash
envoy list --json
```

```json
[
  {
    "environment": "development",
    "updatedAt": "2024-01-03T00:00:00.000Z",
    "keyCount": 6
  },
  {
    "environment": "production",
    "updatedAt": "2024-01-02T00:00:00.000Z",
    "keyCount": 8
  }
]
```

## Notes

- Requires an initialized envoy project (`envoy init`).
- Entries are grouped by environment in human-readable mode.
- `keyCount` reflects the number of keys at the time of the last `envoy push`.
