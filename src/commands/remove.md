# `envoy remove` Command

Removes a stored environment entry from the local envoy store.

## Usage

```bash
envoy remove <environment>
```

## Arguments

| Argument      | Description                                      |
|---------------|--------------------------------------------------|
| `environment` | The name of the environment to remove (e.g. `staging`, `production`) |

## Examples

### Remove the `staging` environment

```bash
envoy remove staging
```

Output:
```
Removed environment "staging" from project "my-app".
```

## Notes

- The command reads the current project name from `.envoy/config.json`.
- Only the entry matching both the current **project** and the specified **environment** is removed.
- If no matching entry is found, an error is thrown.
- This command does **not** delete any `.env` files from disk — it only removes the encrypted entry from the envoy store.

## Errors

| Error | Cause |
|-------|-------|
| `No envoy config found` | `.envoy/config.json` is missing — run `envoy init` |
| `No envoy store found` | `.envoy/store.json` is missing — run `envoy init` |
| `No entry found for environment` | The specified environment has not been pushed yet |
