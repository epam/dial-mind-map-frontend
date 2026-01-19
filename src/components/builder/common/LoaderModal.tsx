import Loader from '@/components/common/Loader';

export const LoaderModal = ({ text }: { text?: string }) => {
  return (
    <div>
      <div className="fixed inset-0 z-[99] size-full bg-layer-2 opacity-75" />
      <div className="fixed inset-0 z-[100] flex items-center justify-center">
        <div className="flex h-[180px] w-[260px] flex-col items-center justify-center gap-4 rounded bg-layer-3">
          <Loader loaderClassName="size-[60px]" containerClassName="size-auto" />
          {text && <span className="text-xl text-primary">{text}</span>}
        </div>
      </div>
    </div>
  );
};
