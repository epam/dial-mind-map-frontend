import { IconPin, IconX } from '@tabler/icons-react';
import { SetState } from 'ahooks/lib/createUseStorageState';
import classNames from 'classnames';
import { useMemo } from 'react';

import Button from '@/components/common/Button/Button';
import { Space } from '@/components/common/Space/Space';
import { GraphSelectors } from '@/store/builder/graph/graph.reducers';
import { useBuilderSelector } from '@/store/builder/hooks';
import { SourcesSelectors } from '@/store/builder/sources/sources.selectors';
import { isEdge, isNode } from '@/utils/app/graph/typeGuards';

interface StatisticsProps {
  setPinnedStatistics: (value?: SetState<boolean | undefined>) => void;
  pinnedStatistics?: boolean;
}

export const Statistics: React.FC<StatisticsProps> = ({ setPinnedStatistics, pinnedStatistics }) => {
  const elements = useBuilderSelector(GraphSelectors.selectElements);
  const sources = useBuilderSelector(SourcesSelectors.selectSources);
  const stats = useMemo(() => {
    const nodes = elements.filter(el => isNode(el.data)).length;
    const edges = elements.filter(el => isEdge(el.data)).length;
    const sourcesCount = sources.length;
    return { nodes, edges, sourcesCount };
  }, [elements, sources]);

  return (
    <Space
      size={2}
      direction="vertical"
      className={classNames('bg-layer-0 rounded px-3 py-2', {
        'rounded border border-primary shadow': pinnedStatistics,
      })}
    >
      <div className="flex w-full items-center justify-between gap-2 text-sm text-primary">
        <span>Statistics</span>
        <Button
          onClick={() => setPinnedStatistics(!pinnedStatistics)}
          className="p-0 text-secondary hover:text-accent-primary"
          icon={pinnedStatistics ? <IconX size={18} /> : <IconPin size={18} />}
        />
      </div>
      <div className="flex w-full justify-between gap-1 text-sm text-secondary">
        <span>Nodes: </span>
        <span className="text-primary">{stats.nodes}</span>
      </div>
      <div className="flex w-full justify-between gap-1 text-sm text-secondary">
        <span>Edges: </span>
        <span className="text-primary">{stats.edges}</span>
      </div>
      <div className="flex w-full justify-between gap-1 text-sm text-secondary">
        <span>Sources: </span>
        <span className="text-primary">{stats.sourcesCount}</span>
      </div>
    </Space>
  );
};
