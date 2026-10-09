# AnyPS5 Controls

A browser-based keyboard and mouse input configurator for [AnyPS5](https://github.com/boykopovar/AnyPS5), maintained by Amr Yasser. This independent companion repository is not an official AnyPS5 release or an emulator.

## Use locally

Requires Node.js 22 or later. No dependency installation is needed.

```sh
npm start
```

Open http://127.0.0.1:4173. If that port is occupied, choose another port with the `PORT` environment variable. In PowerShell:

```powershell
$env:PORT = '4174'
npm start
```

The app uses ES modules and needs an HTTP server; do not open `index.html` through `file://`. All configuration processing happens in the browser. Export before reloading because edits are kept in memory.

## Configure inputs

Choose a control group, add keyboard/mouse/wheel bindings, and preview, copy or download `anyps5-input.ini`. Search covers all groups. Arrow keys, Home and End navigate the group selector. Keyboard capture uses physical key positions as SDL scancodes; browser and OS shortcuts may require manual selection.

Controls, Configuration and Help are separate views. Configuration replaces the input editor and provides the full-width preview and export controls; switching views preserves your bindings. Help contains expandable answers to common setup questions.

Open the translation button to choose from 22 interface and FAQ languages. First visits use English; a saved language choice takes priority on later visits. Egyptian Arabic is first in the language list. Arabic, Urdu and Persian use a right-to-left layout. The language preference is saved locally; input configurations are still kept in memory.

Input and language menus use a searchable custom picker, anchored to the field on larger screens and presented as a bottom sheet on phones. Escape dismisses a picker without changing its selection. Arrow keys, Home, End and Enter navigate and select options. The responsive layout keeps fields and export controls within narrow windows and uses subtle focus feedback without white outlines.

Only configured actions are exported. Their first binding replaces built-in inputs; further bindings are alternatives. Omitted actions retain their built-in inputs. Removing all bindings restores defaults rather than disabling an action. Physical controller mapping is handled separately by AnyPS5.

Save the exported file beside the generated game executable, or point `ANYPS5_INPUT_CONFIG` at it. Invalid bindings block export; duplicates and shared inputs are reported. Imports report line errors and preserve the current configuration when invalid. The app targets the upstream parser snapshot listed in [UPSTREAM.md](UPSTREAM.md), which must be revisited if AnyPS5 changes its format.

## Test

```sh
npm test
```

The suite checks serialization, input restrictions, imports, conflicts and keyboard conversion. Two source-contract tests use pinned C++ snapshots under `tests/fixtures`; they do not compile or execute the emulator.

## Hosting

Serve the repository root with any static HTTP host. GitHub Pages can serve the root of `main` without a build step; `.nojekyll` is included. Hosting is configured separately from the source code.

## Credits and license

Interface: © Amr Yasser. AnyPS5 action definitions, defaults and parser snapshots originate from the AnyPS5 project and its contributors. This distribution includes the upstream [GNU GPL v2 license](LICENSE). See [UPSTREAM.md](UPSTREAM.md) for provenance and pinned versions.

The interface uses system fonts and supports keyboard navigation and reduced-motion preferences.
