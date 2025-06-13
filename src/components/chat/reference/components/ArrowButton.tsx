export const ArrowButton = ({ onClick, children }: { onClick: () => void; children: React.ReactNode }) => (
  <button onClick={onClick} className="text-secondary hover:text-accent-primary">
    {children}
  </button>
);
