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

export interface StatusChange {
  readonly key: string;
  readonly status: number;
}

export interface ChangeArrays {
  readonly indexChanges: readonly StatusChange[];
  readonly workingTreeChanges: readonly StatusChange[];
  readonly untrackedChanges: readonly StatusChange[];
  readonly mergeChanges: readonly StatusChange[];
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
  type FileStatus = 'conflict' | 'deleted' | 'added' | 'modified';
  const priority: Record<FileStatus, number> = { conflict: 4, deleted: 3, added: 2, modified: 1 };
  const files = new Map<string, FileStatus>();

  const classify = (change: StatusChange): FileStatus | undefined => {
    if (DELETED.has(change.status)) return 'deleted';
    if (ADDED.has(change.status)) return 'added';
    if (MODIFIED.has(change.status)) return 'modified';
    return undefined;
  };
  const record = (key: string, status: FileStatus): void => {
    const current = files.get(key);
    if (current === undefined || priority[status] > priority[current]) files.set(key, status);
  };

  for (const change of [...changes.indexChanges, ...changes.workingTreeChanges, ...changes.untrackedChanges]) {
    const status = classify(change);
    if (status !== undefined) record(change.key, status);
  }
  changes.mergeChanges.forEach(({ key }) => record(key, 'conflict'));

  const count = (status: FileStatus): number => [...files.values()].filter((value) => value === status).length;
  const counts: StatusCounts = {
    conflicts: count('conflict'),
    deleted: count('deleted'),
    added: count('added'),
    modified: count('modified'),
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
