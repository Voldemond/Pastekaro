import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db';

// GET - Public collection view (no auth required)
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;

        // Fetch collection
        const collectionResult = await sql`
      SELECT 
        p.id,
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

        // Check if public
        if (!collection.isPublic) {
            return NextResponse.json({ error: 'This collection is private' }, { status: 403 });
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
            createdAt: collection.createdAt,
            userName: collection.userName,
            pastes,
        });
    } catch (error) {
        console.error('Error fetching public collection:', error);
        return NextResponse.json(
            { error: 'Failed to fetch collection' },
            { status: 500 }
        );
    }
}