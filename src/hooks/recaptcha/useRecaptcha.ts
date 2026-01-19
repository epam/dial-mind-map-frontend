import { useEffect, useState } from 'react';

const loadScript = (src: string) => {
  const script = document.createElement('script');

  return new Promise((resolve, reject) => {
    script.addEventListener('load', resolve);
    script.addEventListener('error', reject);

    script.async = true;
    script.src = src;
    globalThis.document.head.appendChild(script);
  });
};

export const useRecaptchaScript = (siteKey: string, isRecaptchaRequired: boolean) => {
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (!isRecaptchaRequired) {
      setLoaded(false);
      return;
    }

    let isMounted = true;

    const loader = async () => {
      try {
        await loadScript(`https://www.google.com/recaptcha/enterprise.js?render=${siteKey}`);
        if (isMounted) {
          setLoaded(true);
        }
      } catch (error) {
        console.error('Failed to load ReCaptcha script', error);
        if (isMounted) {
          setLoaded(false);
        }
      }
    };

    loader();

    return () => {
      isMounted = false;
    };
  }, [siteKey, isRecaptchaRequired]);

  return loaded;
};
