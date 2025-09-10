import { AuthParams } from '@/types/api';
import { Application } from '@/types/application';
import { DialAIError } from '@/types/error';

import { getApiHeaders } from './get-headers';
import { getAuthParamsFromServer } from './getAuthParamsFromServer';
import { getEntityUrlFromSlugs } from './getEntityUrlFromSlugs';
import { logger } from './logger';

export async function fetchEntityFromDial<T>(slugs: string[], auth: AuthParams): Promise<T> {
  const host = process.env.DIAL_API_HOST!;
  const url = getEntityUrlFromSlugs(host, slugs);

  let res: Response;
  try {
    res = await fetch(url, {
      headers: getApiHeaders({ authParams: auth, contentType: 'application/json' }),
      method: 'GET',
    });
    logger.info({ status: res.status, statusText: res.statusText }, 'Received response from entity API.');
  } catch (e) {
    logger.error({ error: e, url }, 'Failed to fetch entity API.');
    throw new DialAIError('Failed to fetch entity API.', '', '', '500');
  }

  if (!res.ok) {
    const text = await res.text().catch(() => '');
    logger.error({ url, status: res.status, statusText: res.statusText, responseText: text }, 'Entity API error.');
    throw new DialAIError(
      `Entity API responded with an error: ${res.status} ${res.statusText}`,
      '',
      text,
      String(res.status),
    );
  }

  try {
    return (await res.json()) as T;
  } catch (e) {
    logger.error({ error: e }, 'Failed to parse JSON from entity API.');
    throw new DialAIError('Failed to parse JSON response from entity API.', '', '', '500');
  }
}

export const fetchApplication = async (
  mindmapId: string,
): Promise<{ application?: Application; error?: { status?: number; message?: string } }> => {
  try {
    const slugs = mindmapId.split('/').filter(el => el !== 'applications');
    const auth = await getAuthParamsFromServer();

    const app = await fetchEntityFromDial<Application>(slugs, auth);
    return { application: app };
  } catch (error: any) {
    const status = Number(error?.code) || 500;
    const message = error?.message || 'An error occurred while fetching the application';
    logger.error({ err: error, status }, 'fetchApplication failed');
    return { error: { status, message } };
  }
};
