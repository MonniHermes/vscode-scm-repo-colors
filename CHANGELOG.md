# Changelog

All notable changes to this project are documented here.

## [0.1.0] - 2026-07-31

### Added

- Repository Status view in the Source Control container.
- Status aggregation for conflicts, deleted, added/untracked, modified/renamed, behind, ahead, and clean repositories.
- Deterministic dirty-first sorting, branch display, counters, tooltips, badges, and theme colors.
- Automatic and manual refresh.
- Best-effort repository-root file decorations.
- CI lint, typecheck, unit test, and VSIX packaging checks.

### Fixed

- Count files present in multiple Git change collections only once, using the highest-priority state.
- Wait for native repository selection events instead of assuming a fixed UI delay.
- Serialize reveal requests and cancel stale work when repositories are clicked rapidly.

### Changed

- Clicking a repository now reveals and expands it in the native Source Control view when the built-in SCM focus command is available.
- Keep the contributed Tree View native and color repository text without a custom row background.
