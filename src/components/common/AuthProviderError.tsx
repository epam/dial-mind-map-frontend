import { IconAlertTriangle } from '@tabler/icons-react';

interface AuthProviderErrorProps {
  provider: string;
  availableProviders: string[];
}

export function AuthProviderError({ provider, availableProviders }: AuthProviderErrorProps) {
  const availableProvidersList = availableProviders.map(p => `“${p}”`);
  return (
    <div className="relative flex size-full flex-row">
      <div className="size-full flex-1">
        <div className="flex size-full flex-col items-center justify-center gap-4">
          <IconAlertTriangle size={80} stroke={0.5} className="text-secondary" role="alert" />
          <div className="text-lg font-semibold ">
            Please sign in to the dial by {availableProvidersList.join(' or ')} to use Mind Map. Your current
            authorization method “{provider}” is not supported.
          </div>
        </div>
      </div>
    </div>
  );
}
