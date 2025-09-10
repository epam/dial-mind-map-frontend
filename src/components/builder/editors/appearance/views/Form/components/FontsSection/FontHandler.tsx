import classNames from 'classnames';
import { useState } from 'react';

import { useBuilderSelector } from '@/store/builder/hooks';
import { SettingsSelectors } from '@/store/builder/settings/settings.reducers';

import { FontUploader } from './FontUploader';
import { GoogleFontInput } from './GoogleFontInput';
import { GoogleFontSelector } from './GoogleFontSelector';

type tabs = 'google' | 'upload';

interface Props {
  uploadKey: string;
  fontFamily?: string;
  fontFileName?: string;
  onSelectFile: (file: File, preparedName: string) => void;
  onSuccessFileUpload: (fontFileName: string, fontFamilyName: string) => void;
  onDeleteFile: () => void;
  onSelectorChange: (value?: string) => void;
  onInputChange: (value?: string) => void;
  selectorPlaceholder?: string;
}

export const FontHandler = ({
  uploadKey,
  fontFamily,
  fontFileName,
  onSelectFile,
  onDeleteFile,
  onSuccessFileUpload,
  onSelectorChange,
  onInputChange,
  selectorPlaceholder,
}: Props) => {
  const googleFontsApiKey = useBuilderSelector(SettingsSelectors.selectGoogleFontsApiKey);
  const [activeTab, setActiveTab] = useState<tabs>(fontFileName ? 'upload' : 'google');

  const getTabContent = () => {
    if (activeTab === 'upload')
      return (
        <FontUploader
          onSelect={onSelectFile}
          onDelete={onDeleteFile}
          onSuccessUpload={onSuccessFileUpload}
          uploadKey={uploadKey}
          fontName={fontFileName}
        />
      );

    const placeholder = fontFileName ? 'Uploaded font' : selectorPlaceholder;
    const font = fontFileName ? undefined : fontFamily;

    if (googleFontsApiKey) {
      return (
        <GoogleFontSelector
          placeholder={placeholder}
          googleFontsApiKey={googleFontsApiKey}
          onChange={onSelectorChange}
          fontFamily={font}
        />
      );
    }

    return <GoogleFontInput fontFamily={font} onChange={onInputChange} placeholder={placeholder} />;
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex">
        <button
          className={classNames('px-2 pb-2 relative', activeTab === 'google' && 'text-accent-primary')}
          onClick={() => setActiveTab('google')}
        >
          Google Fonts
          {activeTab === 'google' && <span className="absolute inset-x-0 bottom-0 h-px bg-accent-primary" />}
        </button>
        <button
          className={classNames('px-2 pb-2 relative', activeTab === 'upload' && 'text-accent-primary')}
          onClick={() => setActiveTab('upload')}
        >
          Upload
          {activeTab === 'upload' && <span className="absolute inset-x-0 bottom-0 h-px bg-accent-primary" />}
        </button>
      </div>
      <div>{getTabContent()}</div>
    </div>
  );
};
