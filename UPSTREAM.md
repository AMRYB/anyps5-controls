# Upstream compatibility and provenance

The input definitions and format follow [boykopovar/AnyPS5](https://github.com/boykopovar/AnyPS5).

Compatibility baseline: AnyPS5 commit `ae3d5f95a0248158394d897c8d8925dcedbbf374`.

The C++ files under `tests/fixtures` are unmodified copies of:

- `core/libs/prx/libSceVideoOut/src/InputMapping.cpp`
- `core/libs/prx/libScePad/include/InputMapping.hpp`

These files preserve their original notices. They are included only for source-contract tests; the standalone app does not execute C++.

The key catalogue contains the unique canonical SDL scancode names from SDL commit `4b69833bc54abf3dd3288d4aa7afbba527775e5b`, `src/events/SDL_keyboard.c`. Names containing INI comment characters are rejected for export.

Related upstream work: [Issue #392](https://github.com/boykopovar/AnyPS5/issues/392) and native-editor [PR #674](https://github.com/boykopovar/AnyPS5/pull/674). Compatibility with future parser extensions must be reviewed before an upstream contribution.
