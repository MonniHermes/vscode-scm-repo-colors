# SCM Repository Status Colors

Color-coded multi-repository Git status directly inside VS Code's **Source Control** container.

> Screenshot placeholder — screenshots will be added after the first public release.

## Features

The **Repository Status** view lists every repository discovered by VS Code's built-in Git extension. Each row shows the branch, all active counters, a primary color and a one-character badge. Hover over a row for the complete status, including zero-valued counters.

Repositories with changes or sync activity are shown before clean repositories; each group is sorted alphabetically. The view refreshes when repositories open or close, whenever Git state changes, and through the **Refresh Repository Status** command. Click a repository to reveal and expand its input in VS Code's native Source Control view.

### Status legend and priority

When several states apply, the primary visual follows this fixed priority:

| Priority | Badge | State | Meaning |
| --- | --- | --- | --- |
| 1 | `!` | Conflict | Unresolved merge changes |
| 2 | `D` | Deleted | Deleted files |
| 3 | `A` | Added/untracked | Added, intent-to-add, or untracked files |
| 4 | `M` | Modified/renamed | Modified, renamed, copied, or type-changed files |
| 5 | `↓` | Behind | Incoming commits |
| 6 | `↑` | Ahead | Outgoing commits |
| 7 | `✓` | Clean | No local or synchronization changes |

All category counts remain visible in the description and tooltip. A file present in multiple Git collections (for example staged and then modified again) is counted once using the same highest-priority state shown above.

## Installation from VSIX

1. Download `scm-repo-colors-0.1.0.vsix` from the pull request's CI artifact.
2. In VS Code, run **Extensions: Install from VSIX...**.
3. Open a workspace containing one or more Git repositories, then open Source Control.

Or use the CLI:

```sh
code --install-extension scm-repo-colors-0.1.0.vsix
```

## Color customization

Override any token in `workbench.colorCustomizations`:

```json
{
  "workbench.colorCustomizations": {
    "scmRepoColors.conflictForeground": "#ff0000",
    "scmRepoColors.cleanForeground": "#808080"
  }
}
```

Available tokens end in `conflictForeground`, `deletedForeground`, `addedForeground`, `modifiedForeground`, `behindForeground`, `aheadForeground`, and `cleanForeground`.

## Limitations

VS Code's stable extension API cannot reliably restyle the native SCM repository headers. This extension therefore provides its own native **Repository Status** Tree View in the Source Control container. Repository text is colored through stable file decorations; no custom row background or injected CSS is used.

VS Code also exposes no public command that directly reveals one repository in the native SCM view. Repository clicks therefore feature-detect the long-standing built-in SCM focus command and fall back to expanding all visible native repositories if exact focus is unavailable. No proposed API or DOM manipulation is used.

## Development

Requires Node.js 22.

```sh
npm ci
npm run lint
npm run typecheck
npm test
npm run package
```

## License

[MIT](LICENSE)
