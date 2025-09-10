export const RoundPentagonShapeIcon = ({ width = 30, height = 30, fill = 'currentColor', ...props }) => {
  return (
    <svg width={width} height={height} viewBox="0 0 30 30" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
      <path
        d="M13.1181 0.632379C14.2291 -0.210792 15.7709 -0.210793 16.8819 0.632377L28.7817 9.66311C29.8141 10.4466 30.2452 11.7865 29.8616 13.0195L25.2547 27.8296C24.8533 29.12 23.6524 30 22.2929 30H7.70713C6.34759 30 5.1467 29.12 4.74531 27.8296L0.138368 13.0195C-0.245202 11.7864 0.185899 10.4466 1.21829 9.66311L13.1181 0.632379Z"
        fill={fill}
      />
    </svg>
  );
};
