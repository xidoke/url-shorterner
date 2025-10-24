# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a URL shortener monorepo built with Turborepo. The project uses pnpm as the package manager and requires Node.js >=20.

### Architecture

The monorepo is organized into:

- **apps/api**: NestJS backend application for the URL shortener API
  - Entry point: [apps/api/src/main.ts](apps/api/src/main.ts)
  - Runs on port 3000 (configurable via PORT env var)
  - Standard NestJS module-controller-service pattern

- **packages/typescript-config**: Shared TypeScript configurations used across the monorepo

Note: The `docs` and `web` Next.js apps mentioned in the README have been removed from this repository.

## Development Commands

### Package Manager
This project uses **pnpm** (version 10.13.1). Always use `pnpm` commands, not npm or yarn.

### Root Level Commands

```bash
# Install dependencies
pnpm install

# Run all apps in development mode
pnpm dev

# Build all apps
pnpm build

# Type checking across all packages
pnpm check-types

# Linting and formatting with Biome
pnpm biome:lint      # Lint with auto-fix
pnpm biome:format    # Format code
pnpm biome:check     # Run both lint and format
```

### API Application Commands

Navigate to `apps/api` or use turbo filters:

```bash
# Development
pnpm --filter=@xidoke/url-shortener-api dev
# Or: cd apps/api && pnpm start:dev

# Production build and run
pnpm --filter=@xidoke/url-shortener-api build
pnpm --filter=@xidoke/url-shortener-api start:prod

# Testing
pnpm --filter=@xidoke/url-shortener-api test           # Run unit tests
pnpm --filter=@xidoke/url-shortener-api test:watch    # Watch mode
pnpm --filter=@xidoke/url-shortener-api test:cov      # With coverage
pnpm --filter=@xidoke/url-shortener-api test:e2e      # End-to-end tests

# Debug mode
pnpm --filter=@xidoke/url-shortener-api start:debug
```

### Turborepo Filters

To run commands for specific packages, use the `--filter` flag:

```bash
# Build only the API
turbo build --filter=@xidoke/url-shortener-api

# Dev mode for specific package
turbo dev --filter=@xidoke/url-shortener-api
```

## Code Style and Formatting

This project uses **Biome** (not ESLint/Prettier) for linting and formatting:

- **Indentation**: Tabs (not spaces)
- **Quotes**: Double quotes for JavaScript/TypeScript
- **Import organization**: Automatically enabled via Biome assist
- Configuration: [biome.json](biome.json)

Always run `pnpm biome:check` before committing to ensure code style compliance.

## TypeScript Configuration

This monorepo uses **shared TypeScript configurations** from `packages/typescript-config`:

- **base.json**: Common settings for all TypeScript projects (strict mode, ES2022, NodeNext resolution)
- **nestjs.json**: Extends base.json with NestJS-specific settings (decorators, relaxed strictness)
- **nextjs.json**: For Next.js applications
- **react-library.json**: For React library packages

The API app extends `nestjs.json` using relative path: `"extends": "../../packages/typescript-config/nestjs.json"`

Key settings for NestJS:
- Decorators enabled (`experimentalDecorators`, `emitDecoratorMetadata`)
- Target: ES2023, Module: NodeNext
- `strict` mode enabled but with `noImplicitAny: false` for NestJS compatibility

## Testing

The API uses Jest for testing:

- Unit tests: Located alongside source files with `.spec.ts` suffix
- E2E tests: Located in `apps/api/test/` directory
- Test command uses the configuration in [apps/api/package.json](apps/api/package.json) jest section
- E2E tests use separate Jest config at `apps/api/test/jest-e2e.json`

## Turborepo Task Pipeline

Tasks are configured in [turbo.json](turbo.json):

- **build**: Has dependency graph (dependsOn: ["^build"]), outputs to `.next/**`, reads `.env*` files
- **check-types**: Has dependency graph, runs type checking across packages
- **dev**: Not cached, persistent task for development servers

The dependency graph means tasks will run in topological order based on package dependencies.
