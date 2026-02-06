# AWS CDK Starter

**📖 Full details:** https://rehanvdm.com/blog/aws-cdk-starter-v2-multiple-environments-automatic-cicd-diff-pnpm-workspaces-turborepo

Going from a basic CDK setup to production ready infrastructure shouldn't require hours of
research and custom scripting. This starter gives you a tested foundation that handles the common patterns so you can
focus on building your actual application.

This updated CDK starter provides a lightweight monorepo setup with:
- **pnpm workspaces + Turborepo** for fast, cached builds
- **CDK Express Pipeline** that auto generates GitHub workflows from your TypeScript code
- **Multi environment support** (dev, stage, prod) with type safe configuration
- **Gitflow branching model** with automatic deployments and rich CDK diffs on PRs
- **Clear deployment ordering** using waves and stages

The starter is production ready and designed to scale from simple projects to complex multi stack deployments. It
eliminates the common pain points of managing CDK infrastructure across multiple environments while keeping everything
as code.

## Quick Start

```bash
# Install dependencies
pnpm install

# Deploy to dev
cd infra
pnpm cdk deploy '**' -c env=dev --concurrency 10 --require-approval never --exclusively
```
