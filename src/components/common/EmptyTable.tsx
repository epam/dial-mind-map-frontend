import { IconSearch } from '@tabler/icons-react';

interface EmptyTableProps {
  /**
   * Title to display in the empty table component.
   */
  title?: string;
  /**
   * Description to display below the title.
   */
  description?: string;
  /**
   * Icon to display above the title.
   */
  icon?: React.ReactNode;
}

export const EmptyTable: React.FC<EmptyTableProps> = ({
  title = 'No results found',
  description = 'Sorry, we couldn’t find any results for your search.',
  icon = <IconSearch size={80} stroke={0.5} role="img" />,
}) => {
  return (
    <div className="flex size-full min-w-full flex-col items-center justify-center gap-7 text-center text-primary">
      {icon}
      <div className="flex flex-col gap-4">
        <div className="text-[20px]">{title}</div>
        <div className="text-sm text-secondary">{description}</div>
      </div>
    </div>
  );
};
