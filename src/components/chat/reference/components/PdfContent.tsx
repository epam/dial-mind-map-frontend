'use client';

import '@react-pdf-viewer/core/lib/styles/index.css';
import '@react-pdf-viewer/default-layout/lib/styles/index.css';
import '@react-pdf-viewer/selection-mode/lib/styles/index.css';
import 'pdfjs-dist/build/pdf.worker.min.js';

import { ScrollMode, SpecialZoomLevel, Viewer, Worker } from '@react-pdf-viewer/core';
import { defaultLayoutPlugin, ToolbarProps, ToolbarSlot } from '@react-pdf-viewer/default-layout';
import { GlobalWorkerOptions } from 'pdfjs-dist';
import { useState } from 'react';

import { Space } from '@/components/common/Space/Space';
import { Spinner } from '@/components/common/Spinner';
import { useChatSelector } from '@/store/chat/hooks';
import { ChatUISelectors } from '@/store/chat/ui/ui.reducers';
import { DocsReference } from '@/types/graph';
import { constructPath } from '@/utils/app/file';

GlobalWorkerOptions.workerSrc = 'https://unpkg.com/pdfjs-dist@3.11.174/build/pdf.worker.min.js';

interface PdfContentProps {
  reference: DocsReference;
  folderPath: string;
  initialPage?: number;
}

enum SelectionMode {
  Hand = 'Hand',
  Text = 'Text',
}

export const PdfContent: React.FC<PdfContentProps> = ({ reference, folderPath, initialPage = 1 }) => {
  const { doc_url } = reference;
  const pdfUrl = `/${constructPath('api', folderPath, doc_url)}`;
  const theme = useChatSelector(ChatUISelectors.selectThemeName);

  const renderToolbar = (Toolbar: (props: ToolbarProps) => React.ReactElement) => (
    <Toolbar>
      {(slots: ToolbarSlot) => {
        const { ZoomOut, Zoom, ZoomIn, SwitchSelectionMode } = slots;
        return (
          <Space size="middle" className="bg-layer-0 px-2" align="center" fullWidth={true} justify="center">
            <ZoomOut />
            <Zoom />
            <ZoomIn />
            <Space>
              <SwitchSelectionMode mode={SelectionMode.Hand} />
              <SwitchSelectionMode mode={SelectionMode.Text} />
            </Space>
          </Space>
        );
      }}
    </Toolbar>
  );

  const defaultLayout = defaultLayoutPlugin({ renderToolbar });

  const [isLoaded, setIsLoaded] = useState(false);

  return (
    <div className="relative size-full">
      {!isLoaded && (
        <div className="absolute inset-0 flex size-full items-center justify-center bg-layer-1">
          <Spinner />
        </div>
      )}

      <Worker workerUrl="https://unpkg.com/pdfjs-dist@3.11.174/build/pdf.worker.min.js">
        <Viewer
          fileUrl={pdfUrl}
          theme={theme}
          initialPage={initialPage}
          onDocumentLoad={() => {
            setIsLoaded(true);
            window.dispatchEvent(new Event('resize'));
          }}
          renderLoader={() => <Spinner />}
          scrollMode={ScrollMode.Vertical}
          plugins={[defaultLayout]}
          defaultScale={SpecialZoomLevel.PageWidth}
        />
      </Worker>
    </div>
  );
};
