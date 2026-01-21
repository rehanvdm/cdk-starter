# CDK Starter

A starter project for AWS CDK with pnpm workspaces and Turborepo.

## Prerequisites

- Node.js 22+
- pnpm 10+ (`npm install -g pnpm`)
- AWS CLI configured with appropriate credentials

## Quick Start

```bash
# Install dependencies
pnpm install

# Build all workspaces
pnpm build

# Run tests
pnpm test

# Deploy to dev environment
pnpm cdk:deploy:dev
```

## Project Structure

```
├── pnpm-workspace.yaml     # Workspace definitions and catalog
├── turbo.json              # Turborepo task definitions
├── package.json            # Root package with scripts
├── tsconfig.base.json      # Shared TypeScript config
│
├── src/                    # Application code
│   ├── backend/
│   │   ├── api/            # API Lambda function
│   │   │   ├── index.ts
│   │   │   ├── index.test.ts
│   │   │   ├── environment.ts
│   │   │   └── dist/       # esbuild output
│   │   └── cron/           # Daily cron Lambda
│   │       ├── index.ts
│   │       ├── index.test.ts
│   │       ├── environment.ts
│   │       └── dist/       # esbuild output
│   └── frontend/
│       └── index.html
│
├── infra/                  # CDK infrastructure
│   ├── cdk.json
│   ├── index.ts            # CDK app entry
│   ├── config/
│   │   └── index.ts        # Environment configs
│   └── stacks/
│       ├── backend.ts
│       └── frontend.ts
│
└── packages/               # Shared packages
    └── utils/
        ├── src/
        │   └── index.ts    # getRandomNumberBetween()
        └── index.test.ts
```

## Commands

### Build & Test

```bash
pnpm build          # Build all workspaces
pnpm test           # Run all tests
pnpm lint           # Lint all workspaces
```

### CDK Commands

```bash
# Diff against AWS
pnpm cdk:diff:dev
pnpm cdk:diff:stage
pnpm cdk:diff:prod

# Deploy to AWS
pnpm cdk:deploy:dev
pnpm cdk:deploy:stage
pnpm cdk:deploy:prod
```

### Working with Workspaces

```bash
# Run command in specific workspace
pnpm --filter api build
pnpm --filter @app/utils test

# Add dependency to workspace
pnpm --filter api add lodash
```

## Workspaces

| Workspace | Path | Description |
|-----------|------|-------------|
| `api` | `src/backend/api` | API Lambda function |
| `cron` | `src/backend/cron` | Daily cron Lambda |
| `frontend` | `src/frontend` | Static frontend |
| `infra` | `infra` | CDK infrastructure |
| `@app/utils` | `packages/utils` | Shared utilities |

## Environment Configuration

Environments are defined in `infra/config/index.ts`:

- **dev**: Development environment
- **stage**: Staging environment
- **prod**: Production environment

Each environment has its own AWS account/region and configuration values.

## Features

- **pnpm Workspaces**: Native monorepo support with workspace dependencies
- **pnpm Catalog**: Centralized dependency versions with exact pinning
- **Turborepo**: Build orchestration with caching
- **tsx**: Fast TypeScript execution for CDK
- **esbuild**: Fast Lambda bundling
- **tsdown**: Shared package bundling
- **Vitest**: Fast unit testing

## Dependency Safety

This project uses two layers of dependency safety:

1. **Exact versions**: No `^` or `~` - packages are pinned to specific versions
2. **Delayed installs**: pnpm requires packages to be at least 7 days old

To update dependencies, Renovate will create weekly PRs with updates.
