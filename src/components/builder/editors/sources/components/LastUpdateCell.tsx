interface LastUpdateCellProps {
  date: number | undefined;
}

export const LastUpdateCell: React.FC<LastUpdateCellProps> = ({ date }) => {
  return (
    <div className="text-text-secondary px-4 py-2">
      {date ? (
        <span>
          {new Date(date * 1000).toLocaleString(undefined, {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
          })}
        </span>
      ) : (
        <span>-</span>
      )}
    </div>
  );
};
