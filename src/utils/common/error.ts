export const isAbortError = (err: any) => err.name === 'AbortError';

export const isNetworkError = (err: any) => err instanceof TypeError && err.message === 'network error';
