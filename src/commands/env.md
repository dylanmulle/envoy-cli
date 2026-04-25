# `envoy env` Command

Display or export environment variables stored for a given environment.

## Usage

```bash
envoy env <environment> [options]
```

## Arguments

| Argument      | Description                                          |
|---------------|------------------------------------------------------|
| `environment` | The target environment name (e.g. `development`, `staging`, `production`) |

## Options

| Flag                  | Description                                              |
|-----------------------|----------------------------------------------------------|
| `-o, --output <file>` | Write the variables to a file instead of printing to stdout |
| `--export`            | Prefix each variable line with the `export` keyword      |

## Examples

### Print variables to stdout

```bash
envoy env development
```

Output:
```
DATABASE_URL=postgres://localhost/mydb
SECRET_KEY=supersecret
```

### Write variables to a file

```bash
envoy env staging --output .env.staging
```

This writes the decrypted variables to `.env.staging` in the current directory.

### Export-ready output

```bash
envoy env production --export
```

Output:
```
export DATABASE_URL=postgres://prod-host/mydb
export SECRET_KEY=prodsecret
```

You can source this directly in a shell script:

```bash
eval $(envoy env production --export)
```

## Notes

- The encryption key is read from the project's `envoy.json` config.
- Run `envoy init` before using this command.
- Run `envoy push` to store encrypted variables for an environment.
