# `envoy rotate` — Rotate Encryption Passphrase

Re-encrypts all stored `.env` entries using a new passphrase. Useful when a passphrase has been compromised or needs to be rotated as part of a security policy.

## Usage

```bash
envoy rotate --old-passphrase <current> --new-passphrase <new> [--env <environment>]
```

## Options

| Option | Alias | Description | Required |
|---|---|---|---|
| `--old-passphrase` | `-o` | The current passphrase used to decrypt entries | Yes |
| `--new-passphrase` | `-n` | The new passphrase to re-encrypt entries with | Yes |
| `--env` | `-e` | Limit rotation to a specific environment | No |

## Examples

### Rotate all environments

```bash
envoy rotate --old-passphrase mysecret --new-passphrase mynewsecret
```

### Rotate only production

```bash
envoy rotate -o mysecret -n mynewsecret --env production
```

## Notes

- If the old passphrase is incorrect for any entry, the command will abort without saving changes to that entry.
- The `updatedAt` timestamp is refreshed for every rotated entry.
- It is recommended to run `envoy list` before and after rotating to verify entries are intact.
- Always store your new passphrase securely (e.g., a password manager or secrets vault).
