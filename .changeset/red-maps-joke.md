---
"@marshmallow/mally": minor
---

Initial release of @marshmallow/mally - a decorator-based command handler for the Stoat ecosystem.

### Features

- **Decorator System**: `@Stoat()`, `@SimpleCommand()`, `@Guard()`, `@Command()` decorators
- **Command Loading**: Directory-based loading with `commandsDir` option
- **Guard System**: Permission checks with multiple guards and `guardFail()` handling
- **Cooldowns**: Per-command cooldown with `onCooldown` handler
- **Context API**: `reply()`, args parsing, dynamic prefix support
- **TypeScript**: Full type definitions and `BaseCommand` abstract class

