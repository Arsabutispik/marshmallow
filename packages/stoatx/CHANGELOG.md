# Changelog

## [0.5.1](https://github.com/stoatx-ts/stoatx/compare/stoatx-v0.5.0...stoatx-v0.5.1) (2026-05-20)


### Bug Fixes

* update message handling to use correct types ([#28](https://github.com/stoatx-ts/stoatx/issues/28)) ([26a5f00](https://github.com/stoatx-ts/stoatx/commit/26a5f00f370cbcbbdf1e1ab50815e41f4b3c766b))

## [0.5.0](https://github.com/stoatx-ts/stoatx/compare/stoatx@0.4.0...stoatx-v0.5.0) (2026-05-13)


### Features

* write own library for bots from scratch ([#19](https://github.com/stoatx-ts/stoatx/issues/19)) ([32c3977](https://github.com/stoatx-ts/stoatx/commit/32c397720beeaea4c8742c0ef2dbf0f21f52f770))

## 0.4.0

### Minor Changes

- [#16](https://github.com/stoatx-ts/stoatx/pull/16) [`a2f3d46`](https://github.com/stoatx-ts/stoatx/commit/a2f3d46ffb8c7e7c455a189e940aea7774a8f5b5) Thanks [@Arsabutispik](https://github.com/Arsabutispik)! - Make reply context return the message

## 0.3.0

### Minor Changes

- [#15](https://github.com/stoatx-ts/stoatx/pull/15) [`6922557`](https://github.com/stoatx-ts/stoatx/commit/6922557a61c58535194ccee058b4ca6a453e769d) Thanks [@Arsabutispik](https://github.com/Arsabutispik)! - feat: add `@On` and `@Once` decorators for event handling

  Introduced the `@On` and `@Once` method decorators to allow easy binding of client events directly within `@Stoat()` decorated classes.
  - Methods marked with `@On("eventName")` will execute every time the event is emitted.
  - Methods marked with `@Once("eventName")` will execute only the first time the event is emitted.
  - Event handlers automatically receive the event arguments followed by the `Client` instance.
  - Updated startup logs to display the number of loaded events alongside commands.

- [#12](https://github.com/stoatx-ts/stoatx/pull/12) [`46e3a94`](https://github.com/stoatx-ts/stoatx/commit/46e3a947c1e99831a07f63204b1c8ee4739c7571) Thanks [@Arsabutispik](https://github.com/Arsabutispik)! - - **stoatx**: Exported `DecoratorStore` to fix unused class IDE warnings, updated internal property typings on `StoatxHandler`, and restricted `StoatxHandler` to a type-only export to ensure users leverage the wrapper `Client` directly.
  - **@stoatx/bot**: Wrapped the initialization flow in an async `main()` function to resolve Node.js warnings regarding unsettled top-level awaits.

## 0.2.0

### Minor Changes

- [#4](https://github.com/ispik/stoatx/pull/4) [`c3b6fe4`](https://github.com/ispik/stoatx/commit/c3b6fe4495f34afe5fb50566de127dd5eedcd340) Thanks [@Arsabutispik](https://github.com/Arsabutispik)! - Implement auto-discovery for command modules

- [#6](https://github.com/ispik/stoatx/pull/6) [`3ebc14f`](https://github.com/ispik/stoatx/commit/3ebc14fdf063745326aeb285afdbf7e70b0232c8) Thanks [@Arsabutispik](https://github.com/Arsabutispik)! - - Removed legacy class-based command APIs: `@Command()`, `BaseCommand`, `CommandOptions`, `MallyCommand`, and `CommandConstructor`.

## 0.1.2

### Patch Changes

- [`5cf626c`](https://github.com/ispik/stoatx/commit/5cf626c4159580d43469458aa12efc1db79b9b19) Thanks [@Arsabutispik](https://github.com/Arsabutispik)! - Fix package.json

## 0.1.1

### Patch Changes

- [`98ee537`](https://github.com/ispik/stoatx/commit/98ee537645ea10db4370f00ca18a31af8aee6842) Thanks [@Arsabutispik](https://github.com/Arsabutispik)! - Fix readme where it mentions @marshmallow instead of @stoatx

## 0.1.0

### Minor Changes

- [`f8a9da8`](https://github.com/ispik/stoatx/commit/f8a9da821b5e5873ed7ab1a86740366a9832e5f7) Thanks [@Arsabutispik](https://github.com/Arsabutispik)! - Initial release of stoatx - a decorator-based command handler for the Stoat ecosystem.

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

This is the initial release of `stoatx`. The API is considered unstable and may change in future minor versions until 1.0.0.
