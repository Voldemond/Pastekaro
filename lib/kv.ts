import { kv } from '@vercel/kv';

export { kv };

export const PASTE_PREFIX = 'paste:';

export function getPasteKey(id: string): string {
  return `${PASTE_PREFIX}${id}`;
}