# Contributing

Thank you for contributing to SCM Repository Status Colors.

## Development

Use Node.js 22 and create branches from `rc`:

```sh
git switch rc
git pull --ff-only
git switch -c feat/short-description
npm ci
```

Before opening a pull request, run:

```sh
npm run lint
npm run typecheck
npm test
npm run package
```

Keep pure status and presentation logic independent from the `vscode` module. Add or update unit tests for behavioral changes. Use Conventional Commits (for example, `fix: count renamed files as modified`). Pull requests should target `rc`; maintainers promote tested changes separately.

## Reporting issues

Include your VS Code version, operating system, workspace repository layout, and a concise reproduction. Never include credentials or private repository content.
