import { IconArrowsMinimize } from '@tabler/icons-react';
import React from 'react';
import ReactDOM from 'react-dom';

export type ImageModalProps = {
  children: React.ReactNode;
  onClose: () => void;
};

export const ImageModal: React.FC<ImageModalProps> = ({ children, onClose }) => {
  return ReactDOM.createPortal(
    <div className="w-size fixed inset-0 z-50 flex items-center justify-center" onClick={onClose}>
      <div className="absolute inset-0 bg-layer-1">
        <button onClick={onClose} className="button-primary absolute right-4 top-4 rounded px-2 py-1">
          <IconArrowsMinimize size={20} strokeWidth={2} />
        </button>
      </div>
      <div className="relative" onClick={e => e.stopPropagation()}>
        {children}
      </div>
    </div>,
    document.body,
  );
};
