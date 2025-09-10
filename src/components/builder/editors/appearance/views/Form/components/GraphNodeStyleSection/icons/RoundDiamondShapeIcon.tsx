export const RoundDiamondShapeIcon = ({ width = 30, height = 30, fill = 'currentColor', ...props }) => {
  return (
    <svg width={width} height={height} viewBox="0 0 30 30" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
      <path
        d="M12.6871 0.958045C13.9645 -0.31935 16.0355 -0.319348 17.3129 0.958048L29.042 12.6871C30.3194 13.9645 30.3193 16.0355 29.042 17.3129L17.3129 29.042C16.0355 30.3194 13.9645 30.3193 12.6871 29.042L0.958045 17.3129C-0.31935 16.0355 -0.319348 13.9645 0.958048 12.6871L12.6871 0.958045Z"
        fill={fill}
      />
    </svg>
  );
};
