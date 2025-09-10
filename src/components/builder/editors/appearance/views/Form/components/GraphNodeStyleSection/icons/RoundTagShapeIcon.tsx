export const RoundTagShapeIcon = ({ width = 30, height = 30, fill = 'currentColor', ...props }) => {
  return (
    <svg width={width} height={height} viewBox="0 0 30 30" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
      <path
        d="M0 3V27C0 28.6569 1.37728 30 3.07625 30H17.7392C18.7099 30 19.6238 29.5531 20.2044 28.7945L29.389 16.7945C30.2037 15.7301 30.2037 14.2699 29.389 13.2055L20.2044 1.20553C19.6238 0.446862 18.7099 0 17.7392 0H3.07624C1.37728 0 0 1.34315 0 3Z"
        fill={fill}
      />
    </svg>
  );
};
