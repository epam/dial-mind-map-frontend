export const Login = ({ onClick, shouldLogin }: { onClick: () => void; shouldLogin: boolean }) => {
  return (
    <div className="flex size-full flex-col items-center justify-center">
      <button disabled={shouldLogin} onClick={onClick} className="button button-primary">
        Login
      </button>
    </div>
  );
};
