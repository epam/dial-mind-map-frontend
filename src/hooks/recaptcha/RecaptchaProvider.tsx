import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';

import { AnonymSessionSelectors } from '@/store/chat/anonymSession/anonymSession.slice';
import { useChatSelector } from '@/store/chat/hooks';

import { useRecaptcha } from './useRecaptcha';

const RecaptchaContext = createContext<{
  isLoaded: boolean;
  isExecuting: boolean;
  isEnabled: boolean;
  executeRecaptcha: (onToken: (token: string) => void) => void;
} | null>(null);

export const RecaptchaProvider: React.FC<{
  siteKey: string;
  isApiKeyAllowed: boolean;
  children: React.ReactNode;
}> = ({ siteKey, children, isApiKeyAllowed }) => {
  const isRecaptchaRequired = useChatSelector(AnonymSessionSelectors.selectIsRecaptchaRequired);
  const isEnabled = isApiKeyAllowed && isRecaptchaRequired;
  const isScriptLoaded = useRecaptcha(siteKey, isEnabled);
  const [isExecuting, setIsExecuting] = useState(false);
  const recaptchaDivID = useRef<number | null>(null);
  const recaptchaDiv = useRef<HTMLDivElement | null>(null);

  const onTokenCallback = useRef<(token: string) => void | null>(null) as React.MutableRefObject<
    (token: string) => void | null
  >;

  const handleToken = useCallback((token: string) => {
    setIsExecuting(false);

    // Reset the reCAPTCHA widget to allow future executions
    const grecaptcha = (globalThis as any).window.grecaptcha;
    if (recaptchaDivID.current != null && grecaptcha) {
      grecaptcha.reset(recaptchaDivID.current);
    }

    // Call the stored callback function
    if (onTokenCallback.current) {
      onTokenCallback.current(token);
    }
  }, []);

  useEffect(() => {
    if (!isScriptLoaded || recaptchaDivID.current != null) {
      return;
    }

    const grecaptcha = (globalThis as any).window.grecaptcha;
    if (!grecaptcha) {
      console.error('reCAPTCHA library is not loaded.');
      return;
    }

    grecaptcha.ready(() => {
      const id = grecaptcha.render(recaptchaDiv.current as any, {
        sitekey: siteKey,
        size: 'invisible',
        callback: (token: string) => {
          handleToken(token);
        },
      });
      recaptchaDivID.current = id;
    });
  }, [isScriptLoaded, siteKey, handleToken]);

  const executeRecaptcha = useCallback(
    (onToken: (token: string) => void) => {
      if (!isEnabled || !isScriptLoaded) {
        onToken('');
        console.debug('The system is configured to skip the reCAPTCHA.');
        return;
      }

      const grecaptcha = (globalThis as any).window.grecaptcha;
      if (!grecaptcha) {
        console.error('reCAPTCHA library is not loaded.');
        return;
      }

      console.debug('The reCAPTCHA verification is executed.');

      setIsExecuting(true);
      onTokenCallback.current = onToken;
      grecaptcha.execute(recaptchaDivID.current);
    },
    [isEnabled, isScriptLoaded],
  );

  return (
    <RecaptchaContext.Provider value={{ isLoaded: isScriptLoaded, isExecuting, executeRecaptcha, isEnabled }}>
      {children}
      {/* Render the reCAPTCHA widget here */}
      <div ref={recaptchaDiv} style={{ display: 'none' }}></div>
    </RecaptchaContext.Provider>
  );
};

export const useRecaptchaContext = () => {
  const context = useContext(RecaptchaContext);
  if (!context) {
    throw new Error('useRecaptchaContext must be used within a RecaptchaProvider');
  }
  return context;
};
