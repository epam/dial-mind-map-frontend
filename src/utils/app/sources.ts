import { SourceProcessingTimeLimitMs } from '@/constants/app';
import { Source, SourceStatus } from '@/types/sources';

/**
 * Adjusts the statuses of a list of sources based on their current status and timestamps.
 *
 * This function iterates over an array of `Source` objects and checks if the source's status is `INPROGRESS`.
 * If the source has a status of `INPROGRESS` and has either an `updated` or `created` timestamp, it calculates
 * the time difference between the current time and the most recent timestamp (`updated` or `created`).
 *
 * - If the time difference exceeds SourceProcessingTimeLimitMs (2 minutes), the source's status is updated to `FAILED` with a descriptive message.
 * - Otherwise, the source remains unchanged.
 *
 * If the source's status is not `INPROGRESS` or it lacks both `updated` and `created` timestamps, the source is returned as-is.
 *
 * @param sources - An array of `Source` objects to be processed.
 * @returns A new array of `Source` objects with adjusted statuses where applicable.
 */
export const adjustSourcesStatuses = (sources: Source[]) =>
  sources.map(s => {
    if (s.status !== SourceStatus.INPROGRESS || (!s.updated && !s.created)) {
      return s;
    }

    const updatedTimeMs = (s.updated ?? s.created)! * 1000;
    const currentTimeMs = Date.now();
    const timeDiff = currentTimeMs - updatedTimeMs;

    if (timeDiff > SourceProcessingTimeLimitMs) {
      return {
        ...s,
        status: SourceStatus.FAILED,
        status_description: 'Source processing failed due to exceeding the time limit',
      };
    } else {
      return s;
    }
  });
