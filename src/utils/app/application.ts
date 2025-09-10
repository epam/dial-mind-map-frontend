import { Application } from '@/types/application';

export const generateMindmapFolderPath = (application?: Application): string => {
  if (!application) {
    return '';
  }

  return buildMindmapFolderPath(application.name ?? application.application ?? '', application.reference);
};

export const buildMindmapFolderPath = (appName: string, appRef: string) => {
  const [, bucketId, applicationName] = appName.split('/');

  return `files/${bucketId}/appdata/mindmap/${applicationName}__${appRef}/`;
};

export const getEncodedPathFromApplication = (application: Application): string => {
  const [, bucketId, applicationName] = application.name
    ? application.name.split('/')
    : (application.application?.split('/') ?? []);
  return encodeURIComponent(`applications/${bucketId}/${decodeURIComponent(applicationName)}`);
};
