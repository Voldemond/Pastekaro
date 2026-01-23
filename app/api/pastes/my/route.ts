import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { sql } from '@/lib/db';

export async function GET() {
    try {
        const session = await getServerSession(authOptions);

        if (!session) {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            );
        }

        // Fetch user's pastes from Postgres
        const result = await sql`
      SELECT id, title, content, created_at, ttl_seconds, max_views, view_count
      FROM pastes
      WHERE user_id = ${session.user.id}
      ORDER BY created_at DESC
    `;

        const pastes = result.rows.map((row) => ({
            id: row.id,
            title: row.title,
            content: row.content,
            createdAt: row.created_at,
            ttlSeconds: row.ttl_seconds,
            maxViews: row.max_views,
            viewCount: row.view_count,
        }));

        return NextResponse.json({ pastes });
    } catch (error) {
        console.error('Error fetching user pastes:', error);
        return NextResponse.json(
            { error: 'Failed to fetch pastes' },
            { status: 500 }
        );
    }
}