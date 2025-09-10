import { signOut } from 'next-auth/react';

// Will be updated
export const Forbidden = () => {
  const handleReload = async () => {
    await signOut();
    window.location.reload();
  };

  return (
    <div className="flex size-full flex-col items-center justify-center">
      <button className="button button-primary mt-4" onClick={handleReload}>
        Reload
      </button>
    </div>
  );
};
