import { Application } from '@/types/application';

export const generateMindmapFolderPath = (application?: Application): string => {
  if (!application) {
    return '';
  }
  const [, bucketId, applicationName] = application.name
    ? application.name.split('/')
    : (application.application?.split('/') ?? []);

  return `files/${bucketId}/appdata/mindmap/${applicationName}__${application.reference}/`;
};

export const getEncodedPathFromApplication = (application: Application): string => {
  const [, bucketId, applicationName] = application.name
    ? application.name.split('/')
    : (application.application?.split('/') ?? []);
  return encodeURIComponent(`applications/${bucketId}/${decodeURIComponent(applicationName)}`);
};
