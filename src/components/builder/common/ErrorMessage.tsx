import { IconExclamationCircle } from '@tabler/icons-react';
import classNames from 'classnames';

export interface Props {
  error?: string;
  classes?: string;
}

export const ErrorMessage = ({ error, classes }: Props) => {
  if (!error?.length) {
    return null;
  }

  return (
    <div className={classNames(['flex gap-3 rounded border border-error bg-error p-3', classes])}>
      <span className="flex shrink-0 items-center text-error">
        <IconExclamationCircle size={24} />
      </span>
      <span className="truncate whitespace-pre-wrap" data-qa="error-text">
        {error}
      </span>
    </div>
  );
};
