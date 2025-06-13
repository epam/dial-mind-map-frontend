import { useSearchParams } from 'next/navigation';
import { useMemo } from 'react';

interface UseChatAuthProviderProps {
  isAllowApiKeyAuth: boolean;
  providers?: string[];
}

export const useChatAuthProvider = ({ isAllowApiKeyAuth, providers }: UseChatAuthProviderProps) => {
  const searchParams = useSearchParams();
  const chatAuthProvider = searchParams.get('authProvider');

  const isAllowProvider = useMemo(() => {
    return isAllowApiKeyAuth || !!providers?.some(provider => provider === chatAuthProvider);
  }, [providers, chatAuthProvider, isAllowApiKeyAuth]);

  return { chatAuthProvider, isAllowProvider };
};
