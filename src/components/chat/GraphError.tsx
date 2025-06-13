import GraphIcon from '@/icons/graph.svg';

interface GraphErrorProps {
  title?: string;
  description?: string;
  iconSize?: number;
}

export const GraphError: React.FC<GraphErrorProps> = ({
  title = 'Mindmap is not available.',
  description = 'Please generate the graph.',
  iconSize = 60,
}) => {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-3">
      <GraphIcon role="img" height={iconSize} width={iconSize} />
      <div className="flex flex-col gap-1 text-center">
        <span>{title}</span>
        <span>{description}</span>
      </div>
    </div>
  );
};
