# Changelog

## 0.1.0

### Minor Changes

- [`f8a9da8`](https://github.com/Arsabutispik/marshmallow/commit/f8a9da821b5e5873ed7ab1a86740366a9832e5f7) Thanks [@Arsabutispik](https://github.com/Arsabutispik)! - Initial release of @marshmallow/mally - a decorator-based command handler for the Stoat ecosystem.

  ### Features
  - **Decorator System**: `@Stoat()`, `@SimpleCommand()`, `@Guard()`, `@Command()` decorators
  - **Command Loading**: Directory-based loading with `commandsDir` option
  - **Guard System**: Permission checks with multiple guards and `guardFail()` handling
  - **Cooldowns**: Per-command cooldown with `onCooldown` handler
  - **Context API**: `reply()`, args parsing, dynamic prefix support
  - **TypeScript**: Full type definitions and `BaseCommand` abstract class

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.1.0] - 2026-02-28

### Added

- **Decorator System** - discordx-style decorators for command definition
  - `@Stoat()` - Class decorator for command containers
  - `@SimpleCommand()` - Method decorator for individual commands
  - `@Command()` - Legacy class-based command decorator
  - `@Guard()` - Guard decorator for permission checks

- **Command Loading** - Directory-based command loading
  - Configure with `commandsDir` option
  - Supports both `@Stoat` classes and legacy `@Command` classes

- **Command Features**
  - Aliases support
  - Permission checks
  - Cooldown system with `onCooldown` handler
  - Owner-only commands
  - NSFW command flag
  - Category auto-detection from directory structure

- **Guard System**
  - Multiple guards per command/class
  - `guardFail()` method for handling failed checks
  - Validation at build time

- **Context API**
  - `reply()` - Reply to messages
  - Access to client, message, args, author info
  - Dynamic prefix support (string or async function)
  - Mention prefix support (`@bot command`)

- **TypeScript Support**
  - Full type definitions
  - `BaseCommand` abstract class for convenience
  - Exported types: `Context`, `CommandMetadata`, `MallyGuard`, etc.

### Notes

This is the initial release of `@marshmallow/mally`. The API is considered unstable and may change in future minor versions until 1.0.0.
