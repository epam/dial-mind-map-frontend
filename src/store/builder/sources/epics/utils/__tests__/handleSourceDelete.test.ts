import { Source, SourceStatus, SourceType } from '@/types/sources';

import { handleSourceDelete } from '../handleSourceDelete';

describe('handleSourceDelete', () => {
  it('deletes only failed version', () => {
    const sources: Source[] = [
      { id: '1', url: '1', type: SourceType.LINK },
      { id: '2', version: 1, url: '2', type: SourceType.LINK, status: SourceStatus.INDEXED },
      { id: '2', version: 2, url: '2', type: SourceType.LINK, status: SourceStatus.FAILED },
      { id: '3', url: '3', type: SourceType.LINK },
      { id: '4', version: 1, url: '4', type: SourceType.LINK },
      { id: '4', version: 2, url: '4', type: SourceType.LINK, status: SourceStatus.FAILED },
    ];
    const sourceIdToDelete = '2';

    const result = handleSourceDelete(sources, sourceIdToDelete);

    expect(result).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ id: '1', url: '1', type: SourceType.LINK }),
        expect.objectContaining({ id: '2', version: 1, url: '2', type: SourceType.LINK, status: SourceStatus.INDEXED }),
        expect.objectContaining({ id: '3', url: '3', type: SourceType.LINK }),
        expect.objectContaining({ id: '4', url: '4', type: SourceType.LINK }),
        expect.objectContaining({ id: '4', version: 2, url: '4', type: SourceType.LINK, status: SourceStatus.FAILED }),
      ]),
    );
  });

  it('deletes sources that are not in graph', () => {
    const sources: Source[] = [
      { id: '1', url: '1', type: SourceType.LINK, in_graph: true },
      { id: '2', version: 1, url: '2', type: SourceType.LINK, in_graph: false },
      { id: '2', version: 2, url: '2', type: SourceType.LINK, in_graph: false },
      { id: '3', url: '3', type: SourceType.LINK, in_graph: true },
      { id: '4', url: '4', type: SourceType.LINK, in_graph: true },
    ];
    const sourceIdToDelete = '2';

    const result = handleSourceDelete(sources, sourceIdToDelete);

    expect(result).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ id: '1', url: '1', type: SourceType.LINK }),
        expect.objectContaining({ id: '3', url: '3', type: SourceType.LINK }),
        expect.objectContaining({ id: '4', url: '4', type: SourceType.LINK }),
      ]),
    );
  });

  it('sets removed status for active in-graph version', () => {
    const sources: Source[] = [
      { id: '1', url: '1', type: SourceType.LINK, in_graph: true },
      { id: '2', version: 1, url: '2', type: SourceType.LINK, in_graph: true, active: true },
      { id: '2', version: 2, url: '2', type: SourceType.LINK, in_graph: true },
      { id: '3', url: '3', type: SourceType.LINK, in_graph: true },
      { id: '4', url: '4', type: SourceType.LINK, in_graph: true },
    ];
    const sourceIdToDelete = '2';

    const result = handleSourceDelete(sources, sourceIdToDelete);

    expect(result).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ id: '1', url: '1', type: SourceType.LINK, in_graph: true }),
        expect.objectContaining({
          id: '2',
          version: 1,
          url: '2',
          type: SourceType.LINK,
          in_graph: true,
          active: true,
          status: SourceStatus.REMOVED,
        }),
        expect.objectContaining({ id: '2', version: 2, url: '2', type: SourceType.LINK, in_graph: true }),
        expect.objectContaining({ id: '3', url: '3', type: SourceType.LINK, in_graph: true }),
        expect.objectContaining({ id: '4', url: '4', type: SourceType.LINK, in_graph: true }),
      ]),
    );
  });

  it('returns original sources when sourceIdToDelete does not exist', () => {
    const sources: Source[] = [
      { id: '1', url: '1', type: SourceType.LINK },
      { id: '2', url: '2', type: SourceType.LINK },
    ];
    const sourceIdToDelete = 'nonexistent';

    const result = handleSourceDelete(sources, sourceIdToDelete);

    expect(result).toEqual(sources);
  });

  it('removes all versions if multiple and all are FAILED', () => {
    const sources: Source[] = [
      { id: '2', version: 1, url: '2', type: SourceType.LINK, status: SourceStatus.FAILED },
      { id: '2', version: 2, url: '2', type: SourceType.LINK, status: SourceStatus.FAILED },
    ];
    const sourceIdToDelete = '2';

    const result = handleSourceDelete(sources, sourceIdToDelete);

    expect(result).toEqual([]);
  });
});
