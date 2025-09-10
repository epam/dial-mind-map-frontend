export const HexagonShapeIcon = ({ width = 30, height = 30, fill = 'currentColor', ...props }) => {
  return (
    <svg width={width} height={height} viewBox="0 0 30 30" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
      <path d="M15 0L30 7.5V22.5L15 30L0 22.5V7.5L15 0Z" fill={fill} />
    </svg>
  );
};
