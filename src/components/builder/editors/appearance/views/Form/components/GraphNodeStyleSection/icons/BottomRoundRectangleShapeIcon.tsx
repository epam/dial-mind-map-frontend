export const BottomRoundRectangleShapeIcon = ({ width = 30, height = 30, fill = 'currentColor', ...props }) => {
  return (
    <svg width={width} height={height} viewBox="0 0 30 30" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
      <path d="M0 0H30V20C30 25.5228 25.5228 30 20 30H10C4.47715 30 0 25.5228 0 20V0Z" fill={fill} />
    </svg>
  );
};
