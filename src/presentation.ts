import type { RepositoryStatus } from './status';

export interface RepositorySummary {
  readonly name: string;
  readonly branch: string;
  readonly status: RepositoryStatus;
}

const shortLabels = [
  ['C', 'conflicts'], ['D', 'deleted'], ['A', 'added'], ['M', 'modified'], ['↓', 'behind'], ['↑', 'ahead']
] as const;

export function sortRepositories<T extends RepositorySummary>(repositories: readonly T[]): T[] {
  return [...repositories].sort((left, right) => {
    if (left.status.dirty !== right.status.dirty) return left.status.dirty ? -1 : 1;
    return left.name.localeCompare(right.name, undefined, { sensitivity: 'base' });
  });
}

export function formatDescription(summary: RepositorySummary): string {
  const counts = shortLabels.map(([label, key]) => `${label}:${summary.status[key]}`).join(' ');
  return `${summary.branch} • ${counts}`;
}

export function formatTooltip(summary: RepositorySummary): string {
  const status = summary.status;
  return [
    summary.name,
    `Branch: ${summary.branch}`,
    `Primary status: ${status.primary}`,
    `Conflicts: ${status.conflicts}`,
    `Deleted: ${status.deleted}`,
    `Added/untracked: ${status.added}`,
    `Modified/renamed: ${status.modified}`,
    `Incoming (behind): ${status.behind}`,
    `Outgoing (ahead): ${status.ahead}`
  ].join('\n');
}
