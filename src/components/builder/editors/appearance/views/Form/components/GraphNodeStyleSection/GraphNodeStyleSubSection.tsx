import { NodeLayoutSettings } from './NodeLayoutSettings';
import { NodeShapeSubSection } from './NodeShapeSubSection';

export const GraphNodeStyleSubSection = () => {
  return (
    <div className="flex flex-col gap-5">
      <NodeShapeSubSection />
      <NodeLayoutSettings />
    </div>
  );
};
