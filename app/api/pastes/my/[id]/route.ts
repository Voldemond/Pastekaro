import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { sql } from '@/lib/db';

// GET - Fetch a single paste
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await getServerSession(authOptions);

        if (!session) {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            );
        }

        const { id } = await params;

        const result = await sql`
            SELECT id, title, content, ttl_seconds, max_views, view_count, created_at, package_id
            FROM pastes
            WHERE id = ${id} AND user_id = ${session.user.id}
        `;

        if (result.rows.length === 0) {
            return NextResponse.json(
                { error: 'Paste not found' },
                { status: 404 }
            );
        }

        const row = result.rows[0];
        return NextResponse.json({
            id: row.id,
            title: row.title,
            content: row.content,
            ttlSeconds: row.ttl_seconds,
            maxViews: row.max_views,
            viewCount: row.view_count,
            createdAt: row.created_at,
            collectionId: row.package_id,
        });
    } catch (error) {
        console.error('Error fetching paste:', error);
        return NextResponse.json(
            { error: 'Failed to fetch paste' },
            { status: 500 }
        );
    }
}

// PUT - Update a paste (title, content, constraints)
export async function PUT(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await getServerSession(authOptions);

        if (!session) {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            );
        }

        const { id } = await params;
        const body = await request.json();
        const { title, content, maxViews, ttlSeconds } = body;

        // Validate
        if (content !== undefined && (typeof content !== 'string' || content.trim() === '')) {
            return NextResponse.json(
                { error: 'Content cannot be empty' },
                { status: 400 }
            );
        }

        const hasMaxViews = Object.hasOwn(body, 'maxViews');
        const hasTtl = Object.hasOwn(body, 'ttlSeconds');

        const result = await sql`
            UPDATE pastes
            SET
                title = COALESCE(${title}, title),
                content = COALESCE(${content}, content),
                max_views = CASE WHEN ${hasMaxViews}::boolean
                                 THEN ${maxViews ?? null}::integer
                                 ELSE max_views END,
                ttl_seconds = CASE WHEN ${hasTtl}::boolean
                                   THEN ${ttlSeconds ?? null}::integer
                                   ELSE ttl_seconds END
            WHERE id = ${id} AND user_id = ${session.user.id}
            RETURNING id, title, content, max_views, ttl_seconds, view_count
        `;

        if (result.rows.length === 0) {
            return NextResponse.json(
                { error: 'Paste not found or you do not own it' },
                { status: 404 }
            );
        }

        const row = result.rows[0];
        return NextResponse.json({
            success: true,
            paste: {
                id: row.id,
                title: row.title,
                content: row.content,
                maxViews: row.max_views,
                ttlSeconds: row.ttl_seconds,
                viewCount: row.view_count,
            }
        });
    } catch (error) {
        console.error('Error updating paste:', error);
        return NextResponse.json(
            { error: 'Failed to update paste' },
            { status: 500 }
        );
    }
}

// DELETE - Delete a paste
export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await getServerSession(authOptions);

        if (!session) {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            );
        }

        const { id } = await params;

        const result = await sql`
            DELETE FROM pastes
            WHERE id = ${id} AND user_id = ${session.user.id}
            RETURNING id
        `;

        if (result.rows.length === 0) {
            return NextResponse.json(
                { error: 'Paste not found or you do not own it' },
                { status: 404 }
            );
        }

        return NextResponse.json({ success: true, message: 'Paste deleted' });
    } catch (error) {
        console.error('Error deleting paste:', error);
        return NextResponse.json(
            { error: 'Failed to delete paste' },
            { status: 500 }
        );
    }
}