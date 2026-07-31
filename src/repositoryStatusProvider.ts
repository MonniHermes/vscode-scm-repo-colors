import * as path from 'node:path';
import * as vscode from 'vscode';
import type { GitApi, GitRepository } from './git';
import { aggregateStatus, type PrimaryStatus, type RepositoryStatus } from './status';
import { formatDescription, formatTooltip, sortRepositories, type RepositorySummary } from './presentation';
import { revealNativeRepository } from './reveal';

interface RepositoryModel extends RepositorySummary {
  readonly repository: GitRepository;
}

const presentation: Record<PrimaryStatus, { readonly badge: string; readonly color: string }> = {
  conflict: { badge: '!', color: 'scmRepoColors.conflictForeground' },
  deleted: { badge: 'D', color: 'scmRepoColors.deletedForeground' },
  added: { badge: 'A', color: 'scmRepoColors.addedForeground' },
  modified: { badge: 'M', color: 'scmRepoColors.modifiedForeground' },
  behind: { badge: '↓', color: 'scmRepoColors.behindForeground' },
  ahead: { badge: '↑', color: 'scmRepoColors.aheadForeground' },
  clean: { badge: '✓', color: 'scmRepoColors.cleanForeground' }
};

function statusFor(repository: GitRepository): RepositoryStatus {
  const head = repository.state.HEAD;
  const changes = (items: readonly { readonly uri: vscode.Uri; readonly status: number }[]) =>
    items.map(({ uri, status }) => ({ key: uri.toString(), status }));
  return aggregateStatus({
    indexChanges: changes(repository.state.indexChanges),
    workingTreeChanges: changes(repository.state.workingTreeChanges),
    untrackedChanges: changes(repository.state.untrackedChanges),
    mergeChanges: changes(repository.state.mergeChanges),
    ahead: head?.ahead,
    behind: head?.behind
  });
}

function modelFor(repository: GitRepository): RepositoryModel {
  return {
    repository,
    name: path.basename(repository.rootUri.fsPath) || repository.rootUri.fsPath,
    branch: repository.state.HEAD?.name ?? 'detached HEAD',
    status: statusFor(repository)
  };
}

export class RepositoryStatusProvider implements vscode.TreeDataProvider<RepositoryModel>, vscode.FileDecorationProvider {
  private readonly treeEmitter = new vscode.EventEmitter<void>();
  private readonly decorationEmitter = new vscode.EventEmitter<vscode.Uri[]>();
  readonly onDidChangeTreeData = this.treeEmitter.event;
  readonly onDidChangeFileDecorations = this.decorationEmitter.event;

  constructor(private readonly api: GitApi) {}

  refresh(): void {
    this.treeEmitter.fire();
    this.decorationEmitter.fire(this.api.repositories.map(({ rootUri }) => rootUri));
  }

  getTreeItem(model: RepositoryModel): vscode.TreeItem {
    const visual = presentation[model.status.primary];
    const item = new vscode.TreeItem(model.name, vscode.TreeItemCollapsibleState.None);
    item.description = formatDescription(model);
    item.tooltip = formatTooltip(model);
    item.resourceUri = model.repository.rootUri;
    item.iconPath = new vscode.ThemeIcon('repo', new vscode.ThemeColor(visual.color));
    item.command = {
      command: 'scmRepoColors.revealRepository',
      title: 'Reveal Repository in Source Control',
      arguments: [model.repository.rootUri.toString()]
    };
    item.contextValue = `scmRepoColors.${model.status.primary}`;
    item.accessibilityInformation = {
      label: `${model.name}, ${model.branch}, ${model.status.primary}`,
      role: 'listitem'
    };
    return item;
  }

  getChildren(element?: RepositoryModel): RepositoryModel[] {
    return element === undefined ? sortRepositories(this.api.repositories.map(modelFor)) : [];
  }

  async revealRepository(rootUri: string): Promise<void> {
    await revealNativeRepository(
      this.api.repositories.map((repository) => ({
        key: repository.rootUri.toString(),
        isSelected: () => repository.ui.selected
      })),
      rootUri,
      {
        getCommands: () => Promise.resolve(vscode.commands.getCommands(true)),
        execute: (command) => Promise.resolve(vscode.commands.executeCommand(command)),
        pause: (milliseconds) => new Promise((resolve) => setTimeout(resolve, milliseconds))
      }
    );
  }

  provideFileDecoration(uri: vscode.Uri): vscode.FileDecoration | undefined {
    const repository = this.api.repositories.find(({ rootUri }) => rootUri.toString() === uri.toString());
    if (repository === undefined) return undefined;
    const model = modelFor(repository);
    const visual = presentation[model.status.primary];
    return new vscode.FileDecoration(visual.badge, formatTooltip(model), new vscode.ThemeColor(visual.color));
  }

  dispose(): void {
    this.treeEmitter.dispose();
    this.decorationEmitter.dispose();
  }
}
