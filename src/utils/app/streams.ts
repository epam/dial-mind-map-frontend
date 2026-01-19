import { Observable } from 'rxjs';

export const parseSSEStream = (reader: ReadableStreamDefaultReader, controller: AbortController) => {
  const decoder = new TextDecoder('utf-8');
  return new Observable<string>(observer => {
    const read = async () => {
      try {
        let buffer = '';
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split('\n');
          for (let i = 0; i < lines.length - 1; i++) {
            const line = lines[i];
            if (line.startsWith('data:')) {
              observer.next(line.slice(5).trim());
            }
          }
          buffer = lines[lines.length - 1];
        }
        observer.complete();
      } catch (error) {
        observer.error(error);
      }
    };
    read();
    return () => {
      controller.abort();
      reader.cancel();
    };
  });
};
