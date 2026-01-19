import { Application } from '@/types/application';

export const getEncodedPathFromApplication = (application: Application): string => {
  const [, bucketId, applicationName] = application.name
    ? application.name.split('/')
    : (application.application?.split('/') ?? []);
  return encodeURIComponent(`applications/${bucketId}/${decodeURIComponent(applicationName)}`);
};

export const getAppPathWithEncodedAppName = (appId: string): string => {
  const [appSlug, bucketId, applicationName] = appId.split('/') ?? [];
  return [appSlug, bucketId, applicationName ? encodeURIComponent(applicationName) : undefined]
    .filter(Boolean)
    .join('/');
};

export const decodeAppPathSafely = (appPath: string): string =>
  getAppPathWithEncodedAppName(decodeURIComponent(appPath ?? ''));
