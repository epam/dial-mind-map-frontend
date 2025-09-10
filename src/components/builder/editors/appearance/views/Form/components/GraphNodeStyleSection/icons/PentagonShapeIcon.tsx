export const PentagonShapeIcon = ({ width = 30, height = 30, fill = 'currentColor', ...props }) => {
  return (
    <svg width={width} height={height} viewBox="0 0 30 30" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
      <path d="M15 0L30 11.459L24.2705 30H5.72949L0 11.459L15 0Z" fill={fill} />
    </svg>
  );
};
