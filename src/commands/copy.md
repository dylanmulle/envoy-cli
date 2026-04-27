# `envoy copy` — Copy Environment Variables

Copy all encrypted entries from one environment to another within the same project store.

## Usage

```bash
envoy copy <sourceEnv> <targetEnv> [options]
```

## Arguments

| Argument    | Description                              |
|-------------|------------------------------------------|
| `sourceEnv` | The environment to copy entries **from** |
| `targetEnv` | The environment to copy entries **to**   |

## Options

| Flag          | Description                                          | Default |
|---------------|------------------------------------------------------|---------|
| `--overwrite` | Overwrite keys that already exist in the target env  | `false` |

## Examples

### Copy staging → production

```bash
envoy copy staging production
```

Copies all keys from `staging` into `production`. Existing keys in `production` are **skipped**.

### Copy and overwrite existing keys

```bash
envoy copy staging production --overwrite
```

Copies all keys from `staging` into `production`, **replacing** any keys that already exist.

## Notes

- Entries are copied in their **encrypted form** — no decryption occurs during the copy.
- The source environment must contain at least one entry, otherwise the command exits with an error.
- Run `envoy list <targetEnv>` after copying to verify the result.
