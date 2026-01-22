import { NextRequest, NextResponse } from 'next/server';
import { redis, PASTE_PREFIX } from '@/lib/kv';
import { sql } from '@/lib/db';
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

    // Fetch from BOTH databases
    const allPastes = [];

    // 1. FETCH REDIS PASTES (Anonymous)
    try {
      const redisKeys = await redis.keys(`${PASTE_PREFIX}*`);

      const redisPastes = await Promise.all(
        redisKeys.map(async (key) => {
          const data = await redis.get(key);
          if (!data) return null;

          const paste = JSON.parse(data);
          const id = key.replace(PASTE_PREFIX, '');

          const isExpired = isPasteExpired(paste);

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
            source: 'redis' as const,
          };
        })
      );

      allPastes.push(...redisPastes.filter((p) => p !== null));
    } catch (error) {
      console.error('Error fetching Redis pastes:', error);
    }

    // 2. FETCH POSTGRES PASTES (User pastes)
    try {
      const postgresResult = await sql`
        SELECT 
          p.id,
          p.title,
          p.content,
          p.created_at,
          p.ttl_seconds,
          p.max_views,
          p.view_count,
          u.name as user_name,
          u.email as user_email
        FROM pastes p
        LEFT JOIN users u ON p.user_id = u.id
        ORDER BY p.created_at DESC
      `;

      const postgresPastes = postgresResult.rows.map((row) => {
        const createdAt = new Date(row.created_at).getTime();
        const paste = {
          id: row.id,
          content: row.content,
          createdAt,
          ttlSeconds: row.ttl_seconds,
          maxViews: row.max_views,
          viewCount: row.view_count,
        };

        const isExpired = isPasteExpired(paste);

        let expiresIn = null;
        let expiredReason = null;

        if (paste.ttlSeconds) {
          const expiresAt = createdAt + paste.ttlSeconds * 1000;
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

        if (paste.maxViews !== undefined && paste.viewCount >= paste.maxViews) {
          expiredReason = 'View limit reached';
        }

        return {
          key: `postgres:${row.id}`,
          id: row.id,
          title: row.title,
          content: row.content,
          createdAt,
          ttlSeconds: paste.ttlSeconds,
          maxViews: paste.maxViews,
          viewCount: paste.viewCount,
          expiresIn,
          isExpired,
          expiredReason,
          source: 'postgres' as const,
          userName: row.user_name,
          userEmail: row.user_email,
        };
      });

      allPastes.push(...postgresPastes);
    } catch (error) {
      console.error('Error fetching Postgres pastes:', error);
    }

    // Sort by creation time (newest first)
    allPastes.sort((a, b) => {
      // Sort: Active first, then by creation time
      if (a!.isExpired !== b!.isExpired) {
        return a!.isExpired ? 1 : -1;
      }
      return b!.createdAt - a!.createdAt;
    });

    return NextResponse.json({ pastes: allPastes });
  } catch (error) {
    console.error('Error fetching pastes:', error);
    return NextResponse.json(
      { error: 'Failed to fetch pastes' },
      { status: 500 }
    );
  }
}