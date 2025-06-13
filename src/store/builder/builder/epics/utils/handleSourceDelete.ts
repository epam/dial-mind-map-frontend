import sortBy from 'lodash-es/sortBy';

import { Source, SourceStatus } from '@/types/sources';

/**
 * Handles deletion of a source by its `id`, taking into account different versions and their statuses.
 *
 * Each source can have multiple versions (distinguished by `version`), and this function applies
 * specific rules to determine how the deletion is processed:
 *
 * 1. If the source has FAILED versions:
 *    - If there is only one version and it has FAILED status, it is removed entirely.
 *    - If there are multiple versions, all FAILED versions are removed, and the latest non-FAILED
 *      version is marked as active.
 * 2. If all versions are not in the graph (`in_graph === false`), all versions are removed.
 * 3. If any version is in the graph and there is an active version:
 *    - The active version is marked as REMOVED instead of being deleted.
 * 4. If none of the above conditions are met, the source list is returned unchanged.
 *
 * The function ensures that the deletion logic respects the relationships between versions
 * and their statuses, preserving the integrity of the source list.
 *
 * @param sources - The list of all sources (potentially with multiple versions per id)
 * @param sourceIdToDelete - The id of the source (not version-specific) to be deleted
 * @returns A new list of sources after applying the deletion logic
 */
export const handleSourceDelete = (sources: Source[], sourceIdToDelete: string): Source[] => {
  const targetVersions = sources.filter(s => s.id === sourceIdToDelete);
  const otherSources = sources.filter(s => s.id !== sourceIdToDelete);

  if (targetVersions.length === 0) {
    return sources;
  }

  const hasMultipleVersions = targetVersions.length > 1;
  const hasFailedVersions = targetVersions.some(v => v.status === SourceStatus.FAILED);

  if (hasFailedVersions) {
    if (!hasMultipleVersions) {
      return otherSources;
    } else {
      const filteredTargetVersions = targetVersions.filter(v => v.status !== SourceStatus.FAILED);
      const newActiveVersion = sortBy(filteredTargetVersions, 'version').at(-1);

      return sources.reduce((acc, source) => {
        if (source.id === sourceIdToDelete && source.status === SourceStatus.FAILED) {
          return acc;
        }

        if (newActiveVersion && source.id === sourceIdToDelete && source.version === newActiveVersion.version) {
          acc.push({
            ...newActiveVersion,
            active: true,
          });
        } else {
          acc.push(source);
        }

        return acc;
      }, [] as Source[]);
    }
  }

  const allOutOfGraph = targetVersions.every(v => !v.in_graph);

  if (allOutOfGraph) {
    return otherSources;
  }

  const activeVersion = targetVersions.find(v => v.active);
  const anyInGraph = targetVersions.some(v => v.in_graph);

  if (anyInGraph && activeVersion) {
    const filtered = sources.filter(s => !(s.id === sourceIdToDelete && s.version === activeVersion.version));
    return [...filtered, { ...activeVersion, status: SourceStatus.REMOVED }];
  }

  return sources;
};
