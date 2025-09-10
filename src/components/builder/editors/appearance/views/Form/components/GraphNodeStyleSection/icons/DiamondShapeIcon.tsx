export const DiamondShapeIcon = ({ width = 30, height = 30, fill = 'currentColor', ...props }) => {
  return (
    <svg width={width} height={height} viewBox="0 0 30 30" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
      <path d="M15 0L30 15L15 30L0 15L15 0Z" fill={fill} />
    </svg>
  );
};
