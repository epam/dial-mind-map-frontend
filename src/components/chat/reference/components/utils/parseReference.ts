import { DocsReference, NodeReference, Reference } from '@/types/graph';

export interface ParsedChunkId {
  chunkId: string;
  docId: string;
  version: number;
}

export interface ParsedNodeId {
  nodeId: string;
}

export const parseReference = (
  input: string | undefined,
  references?: Reference,
): ParsedChunkId | ParsedNodeId | null => {
  if (!input) {
    return null;
  }

  const regexWithVersion = /\[(\d+)\.(\d+)\.(\d+)\]/;
  const matchWithVersion = input.match(regexWithVersion);
  if (matchWithVersion) {
    const [, docId, version, chunkId] = matchWithVersion;
    return { docId, chunkId, version: parseInt(version, 10) };
  }

  const regexWithChunk = /\[(\d+)\.(\d+)\]/;
  const regexWithoutChunk = /\[(\d+)\]/;

  const matchWithChunk = input.match(regexWithChunk);
  if (matchWithChunk) {
    const [, docId, chunkId] = matchWithChunk;
    return { docId, chunkId, version: 1 }; // Default version to 1 if not specified
  }

  const matchWithoutChunk = input.match(regexWithoutChunk);
  if (matchWithoutChunk) {
    const [, nodeId] = matchWithoutChunk;
    return { nodeId };
  }

  if (references?.nodes.some(node => node.id === input.replaceAll('[', '').replaceAll(']', ''))) {
    return { nodeId: input.replaceAll('[', '').replaceAll(']', '') };
  }

  return null;
};

export const isDocsId = (ids?: ParsedChunkId | ParsedNodeId): ids is ParsedChunkId => {
  if (!ids) {
    return false;
  }
  return 'chunkId' in ids;
};

export const isDocsReference = (reference?: DocsReference | NodeReference): reference is DocsReference => {
  if (!reference) {
    return false;
  }
  return 'doc_id' in reference;
};

export const isNodeReference = (reference?: DocsReference | NodeReference): reference is NodeReference => {
  if (!reference) {
    return false;
  }
  return 'id' in reference && !('doc_id' in reference);
};
