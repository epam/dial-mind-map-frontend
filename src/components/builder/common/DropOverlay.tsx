import { IconFileTextFilled } from '@tabler/icons-react';
import React from 'react';

interface Props {
  visible: boolean;
  message?: string;
  headerMessage?: string;
  supportedFormats?: string[];
}

export const DropOverlay: React.FC<Props> = ({
  visible,
  message = 'Drop files here to attach them to Mind Map',
  headerMessage = 'Attach sources',
  supportedFormats,
}) => {
  if (!visible) return null;

  const formattedFormats =
    supportedFormats && supportedFormats.length > 0
      ? supportedFormats.reduce((result, format, index) => {
          if (index === 0) return format;
          if (index === supportedFormats.length - 1) return `${result} and ${format}`;
          return `${result}, ${format}`;
        }, '')
      : null;

  return (
    <div className="absolute inset-0 z-50 flex size-full items-center justify-center bg-overlay backdrop-blur-sm">
      <div className="flex flex-col items-center gap-3">
        <div className="flex size-[100px] items-center justify-center rounded-lg text-primary">
          <IconFileTextFilled className="size-[100px] text-accent-primary" />
        </div>
        <h2 className="text-lg font-semibold text-primary">{headerMessage}</h2>
        <p className="text-sm text-primary">{message}</p>
        {formattedFormats && <p className="text-xs text-secondary">Supported formats: {formattedFormats}</p>}
      </div>
    </div>
  );
};

export default DropOverlay;
