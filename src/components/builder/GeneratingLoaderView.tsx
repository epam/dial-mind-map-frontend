import { DotLottieReact } from '@lottiefiles/dotlottie-react';

import { BuilderSelectors } from '@/store/builder/builder/builder.reducers';
import { useBuilderSelector } from '@/store/builder/hooks';

import { Space } from '../common/Space/Space';

export const GeneratingLoaderView = () => {
  const { title, details } = useBuilderSelector(BuilderSelectors.selectGeneratingStatus);

  return (
    <div className="m-1 flex size-full flex-col items-center justify-center gap-[60px] text-center">
      <div className="h-[160px]">
        <DotLottieReact src="/DarkLottieGeneratingLoader.json" loop autoplay />
      </div>
      <Space size="middle" direction="vertical" className="w-[360px]">
        <div className="text-[28px] leading-8">{title}</div>
        <div className="text-xl">{details ?? 'In progress...'}</div>
      </Space>
    </div>
  );
};
