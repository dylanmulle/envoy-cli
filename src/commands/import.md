# `envoy import` Command

Import an existing `.env` file into the envoy encrypted store for a given environment.

## Usage

```bash
envoy import <file> [options]
```

## Arguments

| Argument | Description                         |
|----------|-------------------------------------|
| `file`   | Path to the `.env` file to import   |

## Options

| Option                        | Description                                              | Default       |
|-------------------------------|----------------------------------------------------------|---------------|
| `-e, --env <environment>`     | Target environment name to store the file under          | `development` |
| `-p, --passphrase <phrase>`   | Passphrase used to encrypt the file contents             | _(from config)_ |
| `--overwrite`                 | Overwrite an existing entry for the same environment     | `false`       |

## Examples

### Import a local `.env` file into the default environment

```bash
envoy import .env
```

### Import into a specific environment

```bash
envoy import .env.staging --env staging
```

### Import and overwrite an existing entry

```bash
envoy import .env --env development --overwrite
```

### Import with an explicit passphrase

```bash
envoy import .env --env production --passphrase my-secret-phrase
```

## Notes

- The file must exist at the given path or the command will exit with an error.
- If an entry for the specified environment already exists, you must pass `--overwrite` to replace it.
- If no `--passphrase` is provided, the `defaultPassphrase` from the envoy config will be used.
- Run `envoy init` before using this command to ensure the store and config are initialized.
