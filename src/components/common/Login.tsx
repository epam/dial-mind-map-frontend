import { useEffect, useState } from 'react';

import Loader from './Loader';

export const Login = ({ onClick, shouldLogin }: { onClick: () => void; shouldLogin: boolean }) => {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setVisible(true), 3000);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="flex size-full flex-col items-center justify-center">
      {!visible && <Loader />}

      <button
        disabled={shouldLogin || !visible}
        onClick={onClick}
        className={`button button-primary transition-opacity duration-700 ${
          visible ? 'opacity-100' : 'pointer-events-none opacity-0'
        }`}
      >
        Login
      </button>
    </div>
  );
};
