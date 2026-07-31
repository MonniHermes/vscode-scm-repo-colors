export type PrimaryStatus = 'conflict' | 'deleted' | 'added' | 'modified' | 'behind' | 'ahead' | 'clean';

/** Ordinals from the stable v1 API exposed by VS Code's built-in Git extension. */
export enum GitChangeStatus {
  IndexModified = 0,
  IndexAdded = 1,
  IndexDeleted = 2,
  IndexRenamed = 3,
  IndexCopied = 4,
  Modified = 5,
  Deleted = 6,
  Untracked = 7,
  Ignored = 8,
  IntentToAdd = 9,
  IntentToRename = 10,
  TypeChanged = 11
}

export interface StatusCounts {
  readonly conflicts: number;
  readonly deleted: number;
  readonly added: number;
  readonly modified: number;
  readonly behind: number;
  readonly ahead: number;
}

export interface ChangeArrays {
  readonly indexChanges: readonly { readonly status: number }[];
  readonly workingTreeChanges: readonly { readonly status: number }[];
  readonly untrackedChanges: readonly { readonly status: number }[];
  readonly mergeChanges: readonly { readonly status: number }[];
  readonly ahead?: number;
  readonly behind?: number;
}

export interface RepositoryStatus extends StatusCounts {
  readonly primary: PrimaryStatus;
  readonly dirty: boolean;
}

const DELETED = new Set([GitChangeStatus.IndexDeleted, GitChangeStatus.Deleted]);
const ADDED = new Set([GitChangeStatus.IndexAdded, GitChangeStatus.Untracked, GitChangeStatus.IntentToAdd]);
const MODIFIED = new Set([
  GitChangeStatus.IndexModified,
  GitChangeStatus.IndexRenamed,
  GitChangeStatus.IndexCopied,
  GitChangeStatus.Modified,
  GitChangeStatus.IntentToRename,
  GitChangeStatus.TypeChanged
]);

export function aggregateStatus(changes: ChangeArrays): RepositoryStatus {
  let deleted = 0;
  let added = 0;
  let modified = 0;
  for (const change of [...changes.indexChanges, ...changes.workingTreeChanges, ...changes.untrackedChanges]) {
    if (DELETED.has(change.status)) deleted += 1;
    else if (ADDED.has(change.status)) added += 1;
    else if (MODIFIED.has(change.status)) modified += 1;
  }
  const counts: StatusCounts = {
    conflicts: changes.mergeChanges.length,
    deleted,
    added,
    modified,
    behind: changes.behind ?? 0,
    ahead: changes.ahead ?? 0
  };
  const primary: PrimaryStatus = counts.conflicts > 0 ? 'conflict'
    : counts.deleted > 0 ? 'deleted'
    : counts.added > 0 ? 'added'
    : counts.modified > 0 ? 'modified'
    : counts.behind > 0 ? 'behind'
    : counts.ahead > 0 ? 'ahead'
    : 'clean';
  return { ...counts, primary, dirty: primary !== 'clean' };
}
