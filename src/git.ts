import type { Disposable, Event, Extension, Uri } from 'vscode';

export interface GitChange {
  readonly status: number;
}

export interface GitBranch {
  readonly name?: string;
  readonly ahead?: number;
  readonly behind?: number;
}

export interface GitRepositoryState {
  readonly HEAD?: GitBranch;
  readonly indexChanges: readonly GitChange[];
  readonly workingTreeChanges: readonly GitChange[];
  readonly mergeChanges: readonly GitChange[];
  readonly onDidChange: Event<void>;
}

export interface GitRepository {
  readonly rootUri: Uri;
  readonly state: GitRepositoryState;
}

export interface GitApi {
  readonly repositories: readonly GitRepository[];
  readonly onDidOpenRepository: Event<GitRepository>;
  readonly onDidCloseRepository: Event<GitRepository>;
}

export interface GitExtensionExports {
  getAPI(version: 1): GitApi;
}

export async function getGitApi(extension: Extension<GitExtensionExports>): Promise<GitApi> {
  const exports = extension.isActive ? extension.exports : await extension.activate();
  return exports.getAPI(1);
}

export function watchRepositories(api: GitApi, listener: () => void): Disposable[] {
  const stateSubscriptions = new Map<GitRepository, Disposable>();
  const watch = (repository: GitRepository): void => {
    stateSubscriptions.get(repository)?.dispose();
    stateSubscriptions.set(repository, repository.state.onDidChange(listener));
  };
  const unwatch = (repository: GitRepository): void => {
    stateSubscriptions.get(repository)?.dispose();
    stateSubscriptions.delete(repository);
  };
  api.repositories.forEach(watch);
  return [
    api.onDidOpenRepository((repository) => { watch(repository); listener(); }),
    api.onDidCloseRepository((repository) => { unwatch(repository); listener(); }),
    { dispose: () => { stateSubscriptions.forEach((subscription) => { subscription.dispose(); }); stateSubscriptions.clear(); } }
  ];
}
