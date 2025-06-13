interface Props {
  src: string;
  onClose: () => void;
}

export const FullScreenImage = ({ src, onClose }: Props) => {
  return (
    <div
      className="fixed left-0 top-0 z-[1000] flex size-full cursor-pointer items-center justify-center bg-blackout"
      onClick={onClose}
      data-testid="fullscreen-image-container"
    >
      <img role="img" src={src} alt="" className="max-h-[90%] max-w-[90%] cursor-pointer" />
    </div>
  );
};
