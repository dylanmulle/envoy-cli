# envoy-cli

> A CLI tool for managing and syncing `.env` files across environments with team sharing support.

## Installation

```bash
npm install -g envoy-cli
```

## Usage

Initialize envoy in your project, then push and pull `.env` files across your team.

```bash
# Initialize envoy in your project
envoy init

# Push your local .env to the shared store
envoy push --env production

# Pull the latest .env for your environment
envoy pull --env production

# List all tracked environments
envoy list
```

### Example Workflow

```bash
# First-time setup
envoy init --project my-app

# Share your .env with the team
envoy push

# A teammate syncs their local environment
envoy pull
```

## Configuration

Envoy reads from a `.envoy.config.json` file in your project root, generated automatically by `envoy init`.

```json
{
  "project": "my-app",
  "store": "remote",
  "environments": ["development", "staging", "production"]
}
```

## Requirements

- Node.js >= 16
- npm or yarn

## Contributing

Pull requests are welcome. For major changes, please open an issue first to discuss what you would like to change.

## License

[MIT](LICENSE)