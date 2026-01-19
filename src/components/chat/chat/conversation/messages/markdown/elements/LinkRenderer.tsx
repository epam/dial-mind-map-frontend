import React from 'react';

const YoutubeDomain = 'www.youtube-nocookie.com';

const extractYouTubeID = (url: string) => {
  const regExp = /(?:youtube\.com\/(?:[^\/\n\s]+\/\S+\/|(?:v|e(?:mbed)?)\/|\S*?[?&]v=)|youtu\.be\/)([a-zA-Z0-9_-]{11})/;
  const match = url.match(regExp);
  return match ? match[1] : null;
};

export const LinkRenderer = ({ href, children }: { href?: string; children?: React.ReactNode }) => {
  const isYouTube = href && (href.includes('youtube.com') || href.includes('youtu.be'));
  const videoId = isYouTube ? extractYouTubeID(href) : null;

  if (!isYouTube || !videoId) {
    return (
      <a href={href} target="_blank" rel="noopener noreferrer">
        {children}
      </a>
    );
  }

  return (
    <span className="relative block h-0 w-full overflow-hidden pb-[56.25%]">
      <iframe
        className="absolute left-0 top-0 size-full border-0"
        src={`https://${YoutubeDomain}/embed/${videoId}`}
        title="YouTube video player"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
        referrerPolicy="strict-origin-when-cross-origin"
        allowFullScreen
      ></iframe>
    </span>
  );
};
