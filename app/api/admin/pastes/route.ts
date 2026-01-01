import { NextRequest, NextResponse } from 'next/server';
import { redis, PASTE_PREFIX } from '@/lib/kv';
import { isPasteExpired } from '@/lib/paste';

export async function GET(request: NextRequest) {
  try {
    // Check admin secret
    const secret = request.nextUrl.searchParams.get('secret');
    const adminSecret = process.env.ADMIN_SECRET || 'unknown';
    
    if (secret !== adminSecret) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get all paste keys
    const keys = await redis.keys(`${PASTE_PREFIX}*`);
    
    if (keys.length === 0) {
      return NextResponse.json({ pastes: [] });
    }

    // Fetch all paste data
    const pastes = await Promise.all(
      keys.map(async (key) => {
        const data = await redis.get(key);
        if (!data) return null;

        const paste = JSON.parse(data);
        const id = key.replace(PASTE_PREFIX, '');

        // Check if expired (but still show to admin)
        const isExpired = isPasteExpired(paste);

        // Calculate expiry info
        let expiresIn = null;
        let expiredReason = null;

        if (paste.ttlSeconds) {
          const expiresAt = paste.createdAt + paste.ttlSeconds * 1000;
          const remaining = Math.max(0, expiresAt - Date.now());
          const seconds = Math.floor(remaining / 1000);
          
          if (seconds <= 0) {
            expiredReason = 'Time expired';
          } else if (seconds > 3600) {
            expiresIn = `${Math.floor(seconds / 3600)}h`;
          } else if (seconds > 60) {
            expiresIn = `${Math.floor(seconds / 60)}m`;
          } else {
            expiresIn = `${seconds}s`;
          }
        }

        // Check view limit expiry
        if (paste.maxViews !== undefined && paste.viewCount >= paste.maxViews) {
          expiredReason = 'View limit reached';
        }

        return {
          key,
          id,
          content: paste.content,
          createdAt: paste.createdAt,
          ttlSeconds: paste.ttlSeconds,
          maxViews: paste.maxViews,
          viewCount: paste.viewCount,
          expiresIn,
          isExpired,
          expiredReason,
        };
      })
    );

    // Filter out null values and sort by creation time (newest first)
    const validPastes = pastes
      .filter((p) => p !== null)
      .sort((a, b) => {
        // Sort: Active first, then by creation time
        if (a!.isExpired !== b!.isExpired) {
          return a!.isExpired ? 1 : -1; // Active pastes first
        }
        return b!.createdAt - a!.createdAt; // Newest first
      });

    return NextResponse.json({ pastes: validPastes });
  } catch (error) {
    console.error('Error fetching pastes:', error);
    return NextResponse.json(
      { error: 'Failed to fetch pastes' },
      { status: 500 }
    );
  }
}