export const EllipseShapeIcon = ({ width = 30, height = 30, fill = 'currentColor', ...props }) => {
  return (
    <svg width={width} height={height} viewBox="0 0 30 30" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
      <circle cx="15" cy="15" r="15" fill={fill} />
    </svg>
  );
};
