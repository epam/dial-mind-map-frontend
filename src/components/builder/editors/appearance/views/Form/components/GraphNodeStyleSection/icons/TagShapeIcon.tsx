export const TagShapeIcon = ({ width = 30, height = 30, fill = 'currentColor', ...props }) => {
  return (
    <svg width={width} height={height} viewBox="0 0 30 30" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
      <path d="M0 0V30H18.8038L30 15L18.8038 0H0Z" fill={fill} />
    </svg>
  );
};
