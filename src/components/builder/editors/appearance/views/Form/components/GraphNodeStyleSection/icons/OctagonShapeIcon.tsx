export const OctagonShapeIcon = ({ width = 30, height = 30, fill = 'currentColor', ...props }) => {
  return (
    <svg width={width} height={height} viewBox="0 0 30 30" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
      <path d="M8.7954 0L0 8.7954V21.2046L8.7954 30H21.2046L30 21.2046V8.7954L21.2046 0H8.7954Z" fill={fill} />
    </svg>
  );
};
