---
"stoatx": minor
---

feat: add `@On` and `@Once` decorators for event handling

Introduced the `@On` and `@Once` method decorators to allow easy binding of client events directly within `@Stoat()` decorated classes.

- Methods marked with `@On("eventName")` will execute every time the event is emitted.
- Methods marked with `@Once("eventName")` will execute only the first time the event is emitted.
- Event handlers automatically receive the event arguments followed by the `Client` instance.
- Updated startup logs to display the number of loaded events alongside commands.
