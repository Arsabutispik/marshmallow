# @stoatx/bot

## [0.2.1](https://github.com/stoatx-ts/stoatx/compare/bot-v0.2.0...bot-v0.2.1) (2026-05-23)


### Bug Fixes

* force version bump to sync workspace ([#38](https://github.com/stoatx-ts/stoatx/issues/38)) ([d7394b2](https://github.com/stoatx-ts/stoatx/commit/d7394b2f36f9d9e0c0ea5fd6394d853b370e0692))


### Dependencies

* The following workspace dependencies were updated
  * dependencies
    * stoatx bumped to 0.5.2

## [0.2.0](https://github.com/stoatx-ts/stoatx/compare/bot-v0.1.1...bot-v0.2.0) (2026-05-13)


### Features

* add @On and @Once decorators for event handling ([#15](https://github.com/stoatx-ts/stoatx/issues/15)) ([6922557](https://github.com/stoatx-ts/stoatx/commit/6922557a61c58535194ccee058b4ca6a453e769d))
* make Client wrap the handler seamlessly ([#12](https://github.com/stoatx-ts/stoatx/issues/12)) ([46e3a94](https://github.com/stoatx-ts/stoatx/commit/46e3a947c1e99831a07f63204b1c8ee4739c7571))
* rename project from Marshmallow to StoatX and update related dependencies ([#7](https://github.com/stoatx-ts/stoatx/issues/7)) ([9644ec9](https://github.com/stoatx-ts/stoatx/commit/9644ec92888db695d4706baa2aebb885f357a137))
* simplify auto-discovery by removing commands directory path ([d3f3554](https://github.com/stoatx-ts/stoatx/commit/d3f355411b2364338b9e19da5d3b9e3f64fc254b))
* update reply method to return Message object ([#16](https://github.com/stoatx-ts/stoatx/issues/16)) ([a2f3d46](https://github.com/stoatx-ts/stoatx/commit/a2f3d46ffb8c7e7c455a189e940aea7774a8f5b5))
* write own library for bots from scratch ([#19](https://github.com/stoatx-ts/stoatx/issues/19)) ([32c3977](https://github.com/stoatx-ts/stoatx/commit/32c397720beeaea4c8742c0ef2dbf0f21f52f770))

## 0.1.1

### Patch Changes

- Updated dependencies [[`a2f3d46`](https://github.com/stoatx-ts/stoatx/commit/a2f3d46ffb8c7e7c455a189e940aea7774a8f5b5)]:
  - stoatx@0.4.0

## 0.1.0

### Minor Changes

- [#12](https://github.com/stoatx-ts/stoatx/pull/12) [`46e3a94`](https://github.com/stoatx-ts/stoatx/commit/46e3a947c1e99831a07f63204b1c8ee4739c7571) Thanks [@Arsabutispik](https://github.com/Arsabutispik)! - - **stoatx**: Exported `DecoratorStore` to fix unused class IDE warnings, updated internal property typings on `StoatxHandler`, and restricted `StoatxHandler` to a type-only export to ensure users leverage the wrapper `Client` directly.
  - **@stoatx/bot**: Wrapped the initialization flow in an async `main()` function to resolve Node.js warnings regarding unsettled top-level awaits.

### Patch Changes

- Updated dependencies [[`6922557`](https://github.com/stoatx-ts/stoatx/commit/6922557a61c58535194ccee058b4ca6a453e769d), [`46e3a94`](https://github.com/stoatx-ts/stoatx/commit/46e3a947c1e99831a07f63204b1c8ee4739c7571)]:
  - stoatx@0.3.0

## 0.0.4

### Patch Changes

- Updated dependencies [[`c3b6fe4`](https://github.com/ispik/stoatx/commit/c3b6fe4495f34afe5fb50566de127dd5eedcd340), [`3ebc14f`](https://github.com/ispik/stoatx/commit/3ebc14fdf063745326aeb285afdbf7e70b0232c8)]:
  - stoatx@0.2.0

## 0.0.3

### Patch Changes

- Updated dependencies [[`5cf626c`](https://github.com/ispik/stoatx/commit/5cf626c4159580d43469458aa12efc1db79b9b19)]:
  - stoatx@0.1.2

## 0.0.2

### Patch Changes

- Updated dependencies [[`98ee537`](https://github.com/ispik/stoatx/commit/98ee537645ea10db4370f00ca18a31af8aee6842)]:
  - stoatx@0.1.1

## 0.0.1

### Patch Changes

- Updated dependencies [[`f8a9da8`](https://github.com/ispik/stoatx/commit/f8a9da821b5e5873ed7ab1a86740366a9832e5f7)]:
  - stoatx@0.1.0
