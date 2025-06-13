import React, { useState } from 'react';
import { TransformComponent, TransformWrapper } from 'react-zoom-pan-pinch';

import { ImageModal } from './ImageModal';

export type ImageRendererProps = {
  src?: string;
  alt?: string;
};

export const ImageRenderer = ({ src, alt }: ImageRendererProps) => {
  const [isModalOpen, setModalOpen] = useState(false);

  return (
    <>
      <img src={src} alt={alt} className="cursor-zoom-in" onClick={() => setModalOpen(true)} />

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
