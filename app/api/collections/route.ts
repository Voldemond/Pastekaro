import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { sql } from '@/lib/db';
import { nanoid } from 'nanoid';

// GET - List user's collections
export async function GET(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);

        if (!session) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Fetch user's collections with paste count
        const result = await sql`
      SELECT 
        p.id,
        p.name,
        p.description,
        p.is_public as "isPublic",
        p.created_at as "createdAt",
        COUNT(pa.id) as "pasteCount"
      FROM packages p
      LEFT JOIN pastes pa ON pa.package_id = p.id
      WHERE p.user_id = ${session.user.id}
      GROUP BY p.id, p.name, p.description, p.is_public, p.created_at
      ORDER BY p.created_at DESC
    `;

        const collections = result.rows.map(row => ({
            id: row.id,
            name: row.name,
            description: row.description,
            isPublic: row.isPublic,
            createdAt: row.createdAt,
            pasteCount: parseInt(row.pasteCount) || 0,
        }));

        return NextResponse.json({ collections });
    } catch (error) {
        console.error('Error fetching collections:', error);
        return NextResponse.json(
            { error: 'Failed to fetch collections' },
            { status: 500 }
        );
    }
}

// POST - Create new collection
export async function POST(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);

        if (!session) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();
        const { name, description, isPublic, pasteIds } = body;

        // Validate
        if (!name || typeof name !== 'string' || name.trim() === '') {
            return NextResponse.json(
                { error: 'Collection name is required' },
                { status: 400 }
            );
        }

        // Create collection
        const collectionId = nanoid(12);

        await sql`
      INSERT INTO packages (id, user_id, name, description, is_public)
      VALUES (
        ${collectionId},
        ${session.user.id},
        ${name.trim()},
        ${description || ''},
        ${isPublic !== false}
      )
    `;

        // Add pastes to collection if provided
        if (pasteIds && Array.isArray(pasteIds) && pasteIds.length > 0) {
            for (let i = 0; i < pasteIds.length; i++) {
                await sql`
          UPDATE pastes
          SET package_id = ${collectionId}, order_in_package = ${i}
          WHERE id = ${pasteIds[i]} AND user_id = ${session.user.id}
        `;
            }
        }

        return NextResponse.json(
            { id: collectionId, message: 'Collection created' },
            { status: 201 }
        );
    } catch (error) {
        console.error('Error creating collection:', error);
        return NextResponse.json(
            { error: 'Failed to create collection' },
            { status: 500 }
        );
    }
}