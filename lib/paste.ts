import { nanoid } from 'nanoid';
import { kv, getPasteKey } from './kv';
import type { Paste, CreatePasteRequest } from '@/types/paste';

export async function createPaste(data: CreatePasteRequest): Promise<string> {
  const id = nanoid(10);
  const paste: Paste = {
    id,
    content: data.content,
    createdAt: Date.now(),
    ttlSeconds: data.ttl_seconds,
    maxViews: data.max_views,
    viewCount: 0,
  };

  const key = getPasteKey(id);
  
  // Store in KV with TTL if specified
  // NOTE: We DON'T use Redis TTL anymore so admins can see expired pastes
  await kv.set(key, JSON.stringify(paste));

  return id;
}

export async function getPaste(
  id: string,
  incrementView: boolean = false,
  currentTime?: number,
  adminMode: boolean = false // NEW: Admin can bypass expiry checks
): Promise<Paste | null> {
  const key = getPasteKey(id);
  const data = await kv.get<string>(key);

  if (!data) {
    return null;
  }

  const paste: Paste = JSON.parse(data);
  const now = currentTime ?? Date.now();

  // Check if paste is expired (but don't delete yet)
  let isExpired = false;

  // Check TTL expiry
  if (paste.ttlSeconds) {
    const expiresAt = paste.createdAt + paste.ttlSeconds * 1000;
    if (now >= expiresAt) {
      isExpired = true;
    }
  }

  // Check view limit
  if (paste.maxViews !== undefined && paste.viewCount >= paste.maxViews) {
    isExpired = true;
  }

  // If expired and NOT admin mode, return null
  if (isExpired && !adminMode) {
    return null;
  }

  // Increment view count if requested (and not expired)
  if (incrementView && !isExpired) {
    paste.viewCount += 1;

    // Update the paste with new view count
    await kv.set(key, JSON.stringify(paste));
  }

  return paste;
}

// NEW: Check if paste is expired (for admin display)
export function isPasteExpired(paste: Paste, currentTime?: number): boolean {
  const now = currentTime ?? Date.now();
  
  // Check TTL
  if (paste.ttlSeconds) {
    const expiresAt = paste.createdAt + paste.ttlSeconds * 1000;
    if (now >= expiresAt) return true;
  }
  
  // Check view limit
  if (paste.maxViews !== undefined && paste.viewCount >= paste.maxViews) {
    return true;
  }
  
  return false;
}