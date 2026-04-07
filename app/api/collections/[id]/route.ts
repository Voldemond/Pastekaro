import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { sql } from '@/lib/db';

// GET - Fetch collection details
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await getServerSession(authOptions);
        const { id } = await params;

        // Fetch collection
        const collectionResult = await sql`
      SELECT 
        p.id,
        p.user_id as "userId",
        p.name,
        p.description,
        p.is_public as "isPublic",
        p.created_at as "createdAt",
        u.name as "userName"
      FROM packages p
      LEFT JOIN users u ON p.user_id = u.id
      WHERE p.id = ${id}
    `;

        if (collectionResult.rows.length === 0) {
            return NextResponse.json({ error: 'Collection not found' }, { status: 404 });
        }

        const collection = collectionResult.rows[0];

        // Check permission
        if (!collection.isPublic && (!session || session.user.id !== collection.userId)) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
        }

        // Fetch pastes in collection
        const pastesResult = await sql`
      SELECT 
        id,
        title,
        content,
        order_in_package as "order",
        created_at as "createdAt"
      FROM pastes
      WHERE package_id = ${id}
      ORDER BY order_in_package ASC
    `;

        const pastes = pastesResult.rows.map(row => ({
            id: row.id,
            title: row.title,
            content: row.content,
            order: row.order,
            createdAt: row.createdAt,
            sizeKB: new Blob([row.content]).size / 1024,
        }));

        return NextResponse.json({
            id: collection.id,
            name: collection.name,
            description: collection.description,
            isPublic: collection.isPublic,
            createdAt: collection.createdAt,
            userName: collection.userName,
            pastes,
        });
    } catch (error) {
        console.error('Error fetching collection:', error);
        return NextResponse.json(
            { error: 'Failed to fetch collection' },
            { status: 500 }
        );
    }
}

// PUT - Update collection
export async function PUT(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await getServerSession(authOptions);

        if (!session) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { id } = await params;
        const body = await request.json();
        const { name, description, isPublic, pastes } = body;

        // Verify ownership
        const ownerCheck = await sql`
      SELECT user_id as "userId" FROM packages WHERE id = ${id}
    `;

        if (ownerCheck.rows.length === 0) {
            return NextResponse.json({ error: 'Collection not found' }, { status: 404 });
        }

        if (ownerCheck.rows[0].userId !== session.user.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
        }

        // Update collection
        await sql`
      UPDATE packages
      SET 
        name = ${name},
        description = ${description || ''},
        is_public = ${isPublic !== false}
      WHERE id = ${id}
    `;

        // Process pastes: Bulk add, update order, and remove unselected
        if (pastes && Array.isArray(pastes)) {
            const pasteIds = pastes.map((p: any) => p.pasteId);

            // 1. Reset all pastes currently in this package
            await sql`
                UPDATE pastes
                SET package_id = NULL, order_in_package = 0
                WHERE package_id = ${id}
            `;

            // 2. Add or Update the pastes provided in the list
            for (const paste of pastes) {
                await sql`
                    UPDATE pastes
                    SET package_id = ${id}, order_in_package = ${paste.order}
                    WHERE id = ${paste.pasteId} AND user_id = ${session.user.id}
                `;
            }
        }

        return NextResponse.json({ success: true, message: 'Collection updated' });
    } catch (error) {
        console.error('Error updating collection:', error);
        return NextResponse.json(
            { error: 'Failed to update collection' },
            { status: 500 }
        );
    }
}

// DELETE - Delete collection
export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await getServerSession(authOptions);

        if (!session) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { id } = await params;

        // Verify ownership
        const ownerCheck = await sql`
      SELECT user_id as "userId" FROM packages WHERE id = ${id}
    `;

        if (ownerCheck.rows.length === 0) {
            return NextResponse.json({ error: 'Collection not found' }, { status: 404 });
        }

        if (ownerCheck.rows[0].userId !== session.user.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
        }

        // Remove package_id from pastes (don't delete pastes)
        await sql`
      UPDATE pastes
      SET package_id = NULL, order_in_package = 0
      WHERE package_id = ${id}
    `;

        // Delete collection
        await sql`DELETE FROM packages WHERE id = ${id}`;

        return NextResponse.json({ success: true, message: 'Collection deleted' });
    } catch (error) {
        console.error('Error deleting collection:', error);
        return NextResponse.json(
            { error: 'Failed to delete collection' },
            { status: 500 }
        );
    }
}

// PATCH - Update privacy only
export async function PATCH(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await getServerSession(authOptions);

        if (!session) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { id } = await params;
        const body = await request.json();
        const { isPublic } = body;

        // Verify ownership
        const ownerCheck = await sql`
      SELECT user_id as "userId" FROM packages WHERE id = ${id}
    `;

        if (ownerCheck.rows.length === 0) {
            return NextResponse.json({ error: 'Collection not found' }, { status: 404 });
        }

        if (ownerCheck.rows[0].userId !== session.user.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
        }

        // Update privacy
        await sql`
      UPDATE packages
      SET is_public = ${isPublic}
      WHERE id = ${id}
    `;

        return NextResponse.json({ success: true, message: 'Privacy updated' });
    } catch (error) {
        console.error('Error updating privacy:', error);
        return NextResponse.json(
            { error: 'Failed to update privacy' },
            { status: 500 }
        );
    }
}