import * as vscode from 'vscode';
import { getGitApi, watchRepositories } from './git';
import type { GitExtensionExports } from './git';
import { RepositoryStatusProvider } from './repositoryStatusProvider';

export async function activate(context: vscode.ExtensionContext): Promise<void> {
  const gitExtension = vscode.extensions.getExtension<GitExtensionExports>('vscode.git');
  if (gitExtension === undefined) {
    void vscode.window.showWarningMessage('SCM Repository Status Colors requires the built-in Git extension.');
    return;
  }

  const api = await getGitApi(gitExtension);
  const provider = new RepositoryStatusProvider(api);
  context.subscriptions.push(
    provider,
    vscode.window.registerTreeDataProvider('scmRepoColors.repositoryStatus', provider),
    vscode.window.registerFileDecorationProvider(provider),
    vscode.commands.registerCommand('scmRepoColors.refresh', () => provider.refresh()),
    vscode.commands.registerCommand('scmRepoColors.revealRepository', (rootUri: string) => provider.revealRepository(rootUri)),
    ...watchRepositories(api, () => provider.refresh())
  );
}

export function deactivate(): void {
  // VS Code disposes all registered subscriptions.
}
