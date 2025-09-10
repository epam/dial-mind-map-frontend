export const StarShapeIcon = ({ width = 30, height = 30, fill = 'currentColor', ...props }) => {
  return (
    <svg width={width} height={height} viewBox="0 0 30 30" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
      <path
        d="M15 0L20.5623 8.53375L30 11.459L24 19.6584L24.2705 30L15 26.5337L5.72949 30L6 19.6584L0 11.459L9.43769 8.53375L15 0Z"
        fill={fill}
      />
    </svg>
  );
};
