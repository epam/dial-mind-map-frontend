export const BarrelShapeIcon = ({ width = 30, height = 30, fill = 'currentColor', ...props }) => {
  return (
    <svg width={width} height={height} viewBox="0 0 30 30" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
      <path
        d="M0 28.3846C0 29.2768 3.13831 30 7.00962 30H22.9904C26.8617 30 30 29.2768 30 28.3846V1.61538C30 0.723232 26.8617 0 22.9904 0H7.00962C3.13831 0 0 0.723232 0 1.61538V28.3846Z"
        fill={fill}
      />
    </svg>
  );
};
