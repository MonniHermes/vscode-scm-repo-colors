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
  readonly pause: (milliseconds: number) => Promise<void>;
}

export type RevealResult = 'focused' | 'expanded-all' | 'missing';

export async function revealNativeRepository(
  repositories: readonly RevealCandidate[],
  targetKey: string,
  adapter: RevealCommandAdapter
): Promise<RevealResult> {
  const target = repositories.find(({ key }) => key === targetKey);
  if (target === undefined) return 'missing';

  await adapter.execute(OPEN_SCM_COMMAND);
  const availableCommands = await adapter.getCommands();
  if (!availableCommands.includes(FOCUS_NEXT_INPUT_COMMAND)) {
    await adapter.execute(EXPAND_ALL_REPOSITORIES_COMMAND);
    return 'expanded-all';
  }

  // The first invocation focuses and expands the selected repository input;
  // subsequent invocations cycle through the visible native repositories.
  for (let attempt = 0; attempt <= repositories.length; attempt += 1) {
    await adapter.execute(FOCUS_NEXT_INPUT_COMMAND);
    await adapter.pause(75);
    if (target.isSelected()) return 'focused';
  }

  // A repository hidden by VS Code's native repository selector cannot be
  // focused. Keep the native view useful by expanding all visible entries.
  await adapter.execute(EXPAND_ALL_REPOSITORIES_COMMAND);
  return 'expanded-all';
}
