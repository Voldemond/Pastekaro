import { nanoid } from 'nanoid';
import { kv, getPasteKey } from './kv';
import { Paste, CreatePasteRequest } from '@/types/paste';

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
  if (data.ttl_seconds) {
    await kv.set(key, JSON.stringify(paste), { ex: data.ttl_seconds });
  } else {
    await kv.set(key, JSON.stringify(paste));
  }

  return id;
}

export async function getPaste(
  id: string,
  incrementView: boolean = false,
  currentTime?: number
): Promise<Paste | null> {
  const key = getPasteKey(id);
  const data = await kv.get<string>(key);

  if (!data) {
    return null;
  }

  const paste: Paste = JSON.parse(data);

  // Check TTL expiry
  const now = currentTime ?? Date.now();
  if (paste.ttlSeconds) {
    const expiresAt = paste.createdAt + paste.ttlSeconds * 1000;
    if (now >= expiresAt) {
      await kv.del(key);
      return null;
    }
  }

  // Check view limit
  if (paste.maxViews !== undefined) {
    if (paste.viewCount >= paste.maxViews) {
      await kv.del(key);
      return null;
    }
  }

  // Increment view count if requested
  if (incrementView) {
    paste.viewCount += 1;

    // Check if this view exhausts the limit
    if (paste.maxViews !== undefined && paste.viewCount >= paste.maxViews) {
      await kv.del(key);
    } else {
      // Update the paste with new view count
      if (paste.ttlSeconds) {
        const remainingTtl = Math.max(
          1,
          Math.floor((paste.createdAt + paste.ttlSeconds * 1000 - now) / 1000)
        );
        await kv.set(key, JSON.stringify(paste), { ex: remainingTtl });
      } else {
        await kv.set(key, JSON.stringify(paste));
      }
    }
  }

  return paste;
}