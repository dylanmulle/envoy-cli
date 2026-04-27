# `envoy diff <environment>`

Compare your local `.env` file against the encrypted version stored for a given environment.

## Usage

```bash
envoy diff <environment> [options]
```

## Arguments

| Argument      | Description                              |
|---------------|------------------------------------------|
| `environment` | The environment name to compare against  |

## Options

| Option              | Default | Description                          |
|---------------------|---------|--------------------------------------|
| `-f, --file <path>` | `.env`  | Path to the local `.env` file to use |

## Output Format

Each differing key is prefixed with a symbol:

- `+` — Key exists locally but **not** in the stored version
- `-` — Key exists in the stored version but **not** locally
- `~` — Key exists in both but has **different values**

If there are no differences, the command prints:

```
No differences found.
```

## Examples

```bash
# Compare local .env with the stored 'production' environment
envoy diff production

# Compare a custom file with the stored 'staging' environment
envoy diff staging --file .env.local
```

## Example Output

```
+ NEW_FEATURE_FLAG=true
- DEPRECATED_KEY=oldval
~ DATABASE_URL: postgres://old-host/db → postgres://new-host/db
```
