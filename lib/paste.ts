import { nanoid } from 'nanoid';
import { kv, getPasteKey } from './kv';
import { sql } from './db';
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
  adminMode: boolean = false // Admin can bypass expiry checks
): Promise<Paste | null> {
  const now = currentTime ?? Date.now();

  // Try Redis first
  const key = getPasteKey(id);
  const redisData = await kv.get<string>(key);

  if (redisData) {
    const paste: Paste = JSON.parse(redisData);

    // Check if paste is expired
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
      await kv.set(key, JSON.stringify(paste));
    }

    return paste;
  }

  // Try Postgres if not in Redis
  try {
    const result = await sql`
      SELECT id, title, content, created_at, ttl_seconds, max_views, view_count
      FROM pastes
      WHERE id = ${id}
    `;

    if (result.rows.length === 0) {
      return null;
    }

    const row = result.rows[0];
    const paste: Paste = {
      id: row.id,
      content: row.content,
      createdAt: new Date(row.created_at).getTime(),
      ttlSeconds: row.ttl_seconds,
      maxViews: row.max_views,
      viewCount: row.view_count,
    };

    // Check if expired
    let isExpired = false;

    if (paste.ttlSeconds) {
      const expiresAt = paste.createdAt + paste.ttlSeconds * 1000;
      if (now >= expiresAt) {
        isExpired = true;
      }
    }

    if (paste.maxViews !== undefined && paste.viewCount >= paste.maxViews) {
      isExpired = true;
    }

    if (isExpired && !adminMode) {
      return null;
    }

    // Increment view count
    if (incrementView && !isExpired) {
      await sql`
        UPDATE pastes 
        SET view_count = view_count + 1 
        WHERE id = ${id}
      `;
      paste.viewCount += 1;
    }

    return paste;
  } catch (error) {
    console.error('Error fetching from Postgres:', error);
    return null;
  }
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