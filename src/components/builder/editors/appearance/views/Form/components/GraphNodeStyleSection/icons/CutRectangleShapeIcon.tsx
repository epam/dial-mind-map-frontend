export const CutRectangleShapeIcon = ({ width = 30, height = 30, fill = 'currentColor', ...props }) => {
  return (
    <svg width={width} height={height} viewBox="0 0 30 30" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
      <path d="M0 6L6 0H24L30 6V24L24 30H6L0 24V6Z" fill={fill} />
    </svg>
  );
};
