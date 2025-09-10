import React, { useState } from 'react';
import { TransformComponent, TransformWrapper } from 'react-zoom-pan-pinch';

import { ImageModal } from './ImageModal';

export type ImageRendererProps = {
  src?: string;
  alt?: string;
};

export const ImageRenderer = ({ src, alt }: ImageRendererProps) => {
  const [isModalOpen, setModalOpen] = useState(false);

  const handleClick = (event: React.MouseEvent<HTMLImageElement>) => {
    // Prevent maximizing if image is inside a link
    const isInsideLink = event.currentTarget.closest('a');
    if (!isInsideLink) {
      setModalOpen(true);
    }
  };

  return (
    <>
      <img src={src} alt={alt} className="cursor-zoom-in" onClick={handleClick} />

      {isModalOpen && (
        <ImageModal onClose={() => setModalOpen(false)}>
          <div className="relative">
            <TransformWrapper>
              <TransformComponent>
                <img src={src} alt={alt} className="max-h-[90vh] max-w-[90vw] object-contain" />
              </TransformComponent>
            </TransformWrapper>
          </div>
        </ImageModal>
      )}
    </>
  );
};
