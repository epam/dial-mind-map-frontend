import { DocsReference } from '@/types/graph';

export const getReferenceName = (ref: DocsReference) =>
  ref.source_name ?? (ref.doc_name.split('/').at(-1) || ref.doc_name.split('/').at(-2));
