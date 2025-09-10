import React, { useMemo } from 'react';

import { ChatSide } from '../../data/constants';

export interface ChatPreviewProps {
  panelPosition?: ChatSide;
  width?: number;
  height?: number;
  bgColor?: string;
  nodeColor?: string;
  lineColors?: string[];
  pillColors?: string[];
  inputColor?: string;
  borderColor: string;
  className?: string;
  textColor?: string;
}

export const ChatPreview: React.FC<ChatPreviewProps> = ({
  panelPosition = ChatSide.RIGHT,
  width = 300,
  height = 130,
  bgColor = '#EEF2F7',
  nodeColor = '#9CA3AF',
  lineColors = [],
  pillColors = [],
  inputColor = '#FFFFFF',
  borderColor,
  className,
  textColor = '#000000',
}) => {
  const viewWidth = width;
  const viewHeight = height;
  const padding = 10;
  const panelWidth = 100;
  const panelHeight = 160;
  const graphWidth = 110;
  const graphHeight = 80;

  const panelX = panelPosition === ChatSide.LEFT ? padding : viewWidth - padding - panelWidth;
  const panelY = (viewHeight - panelHeight) / 2;
  const mapX = panelPosition === ChatSide.LEFT ? viewWidth - graphWidth / 2 - padding - panelWidth : graphWidth / 2;
  const mapY = (viewHeight - graphHeight) / 2;

  const nodeWidth = 40;
  const nodeHeight = 20;
  const nodeX = mapX + (graphWidth - nodeWidth) / 2;
  const nodeY = mapY + (graphHeight - nodeHeight) / 2;

  const pillWidth = 36;
  const pillHeight = 12;
  const offset = 8;

  const pills = useMemo(() => {
    // add slight variations to pill positions for a more natural arrangement
    const variations = [
      { dx: -12, dy: -6 },
      { dx: 3, dy: 0 },
      { dx: -6, dy: 10 },
      { dx: 12, dy: 5 },
    ];

    const basePositions = [
      { x: nodeX - pillWidth - offset, y: nodeY - pillHeight - offset },
      { x: nodeX + nodeWidth + offset, y: nodeY - pillHeight - offset },
      { x: nodeX - pillWidth - offset, y: nodeY + nodeHeight + offset },
      { x: nodeX + nodeWidth + offset, y: nodeY + nodeHeight + offset },
    ];
    return basePositions.map((position, index) => ({
      x: position.x + variations[index].dx,
      y: position.y + variations[index].dy,
      color: pillColors[index] ?? '#FFFFFF',
    }));
  }, [nodeX, nodeY, pillColors]);

  const lines = useMemo(
    () =>
      pills.map((p, index) => ({
        x1: p.x + pillWidth / 2,
        y1: p.y + pillHeight / 2,
        x2: nodeX + nodeWidth / 2,
        y2: nodeY + nodeHeight / 2,
        stroke: lineColors[index] ?? '#FFFFFF',
      })),
    [pills, lineColors, nodeX, nodeY, nodeWidth, nodeHeight],
  );

  const skeletonHeight = 4;
  const skeletonGap = 4;
  const skeletonCount = 6;
  const panelPillWidth = (panelWidth - 16 - skeletonGap) / 2;
  const panelPillHeight = 8;

  return (
    <svg
      width={viewWidth}
      height={viewHeight}
      viewBox={`0 0 ${viewWidth} ${viewHeight}`}
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <rect x={0} y={0} width={viewWidth} height={viewHeight} fill={bgColor} rx={8} />

      <g className="origin-center transition-transform duration-200">
        {lines.map((l, i) => (
          <line key={i} x1={l.x1} y1={l.y1} x2={l.x2} y2={l.y2} stroke={l.stroke} strokeWidth={2} />
        ))}

        <rect x={nodeX} y={nodeY} width={nodeWidth} height={nodeHeight} fill={nodeColor} rx={4} />

        {pills.map((p, i) => (
          <rect
            key={i}
            x={p.x}
            y={p.y}
            width={pillWidth}
            height={pillHeight}
            fill={p.color}
            rx={pillHeight / 2}
            className="origin-center transition-transform duration-200 hover:scale-110"
          />
        ))}
      </g>

      <g className="origin-center transition-transform">
        <rect
          x={panelX}
          y={panelY}
          width={panelWidth}
          height={panelHeight}
          fill={bgColor}
          stroke={borderColor}
          strokeWidth={0.5}
          rx={4}
        />
        <rect
          x={panelX + 8}
          y={panelY + panelHeight - 16}
          width={panelWidth - 16}
          height={8}
          fill={inputColor}
          rx={4}
        />

        {Array.from({ length: skeletonCount }).map((_, i) => (
          <rect
            key={i}
            x={panelX + 8}
            y={panelY + 16 + i * (skeletonHeight + skeletonGap)}
            width={panelWidth - 16}
            height={skeletonHeight}
            fill={textColor}
            opacity={0.2}
            rx={2}
            className="animate-pulse"
          />
        ))}

        {pillColors.slice(0, 4).map((color, index) => {
          const col = index % 2;
          const row = Math.floor(index / 2);
          return (
            <rect
              key={index}
              x={panelX + 8 + col * (panelPillWidth + skeletonGap)}
              y={
                panelY +
                16 +
                skeletonCount * (skeletonHeight + skeletonGap) +
                skeletonGap +
                row * (panelPillHeight + skeletonGap)
              }
              width={panelPillWidth}
              height={panelPillHeight}
              fill={color}
              rx={panelPillHeight / 2}
            />
          );
        })}
      </g>
    </svg>
  );
};
