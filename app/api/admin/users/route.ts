import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db';

export async function GET(request: NextRequest) {
    try {
        // Check admin secret
        const secret = request.nextUrl.searchParams.get('secret');
        const adminSecret = process.env.ADMIN_SECRET;

        if (secret !== adminSecret) {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            );
        }

        // Fetch all users
        const result = await sql`
      SELECT id, email, name, created_at 
      FROM users 
      ORDER BY created_at DESC
    `;

        return NextResponse.json({
            users: result.rows,
            count: result.rows.length
        });
    } catch (error: any) {
        console.error('Error fetching users:', error);
        return NextResponse.json(
            { error: error.message || 'Failed to fetch users' },
            { status: 500 }
        );
    }
}