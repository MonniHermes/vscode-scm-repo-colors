export const OPEN_SCM_COMMAND = 'workbench.view.scm';
export const FOCUS_NEXT_INPUT_COMMAND = 'workbench.scm.action.focusNextInput';
export const EXPAND_ALL_REPOSITORIES_COMMAND = 'workbench.scm.action.expandAllRepositories';

export interface RevealCandidate {
  readonly key: string;
  readonly isSelected: () => boolean;
}

export interface RevealCommandAdapter {
  readonly getCommands: () => Promise<readonly string[]>;
  readonly execute: (command: string) => Promise<unknown>;
  readonly waitForSelectionChange: (timeoutMilliseconds: number) => Promise<boolean>;
  readonly isCancelled: () => boolean;
}

export type RevealResult = 'focused' | 'expanded-all' | 'missing' | 'cancelled';

export async function revealNativeRepository(
  repositories: readonly RevealCandidate[],
  targetKey: string,
  adapter: RevealCommandAdapter
): Promise<RevealResult> {
  const target = repositories.find(({ key }) => key === targetKey);
  if (target === undefined) return 'missing';
  if (adapter.isCancelled()) return 'cancelled';

  await adapter.execute(OPEN_SCM_COMMAND);
  const availableCommands = await adapter.getCommands();
  if (adapter.isCancelled()) return 'cancelled';
  if (!availableCommands.includes(FOCUS_NEXT_INPUT_COMMAND)) {
    await adapter.execute(EXPAND_ALL_REPOSITORIES_COMMAND);
    return 'expanded-all';
  }

  // The first invocation focuses and expands the selected repository input;
  // subsequent invocations cycle through the visible native repositories.
  for (let attempt = 0; attempt <= repositories.length; attempt += 1) {
    if (adapter.isCancelled()) return 'cancelled';
    const selectionChanged = target.isSelected()
      ? undefined
      : adapter.waitForSelectionChange(1_500);
    await adapter.execute(FOCUS_NEXT_INPUT_COMMAND);
    if (selectionChanged !== undefined) await selectionChanged;
    if (target.isSelected()) return 'focused';
  }

  // A repository hidden by VS Code's native repository selector cannot be
  // focused. Keep the native view useful by expanding all visible entries.
  if (adapter.isCancelled()) return 'cancelled';
  await adapter.execute(EXPAND_ALL_REPOSITORIES_COMMAND);
  return 'expanded-all';
}
