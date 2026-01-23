import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { sql } from '@/lib/db';

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

        // Delete paste (only if it belongs to the user)
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