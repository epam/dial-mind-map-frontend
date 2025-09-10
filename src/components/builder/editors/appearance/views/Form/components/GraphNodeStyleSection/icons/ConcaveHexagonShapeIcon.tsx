export const ConcaveHexagonShapeIcon = ({ width = 30, height = 30, fill = 'currentColor', ...props }) => {
  return (
    <svg width={width} height={height} viewBox="0 0 30 30" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
      <path d="M0 0H30L26.0526 15L30 30H0L3.94737 15L0 0Z" fill={fill} />
    </svg>
  );
};
