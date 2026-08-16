import { NextRequest, NextResponse } from 'next/server';
import { redis, getPasteKey } from '@/lib/kv';
import { sql } from '@/lib/db';

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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

    // Get source (redis or postgres)
    const source = request.nextUrl.searchParams.get('source') || 'redis';

    // Await params (Next.js 15 requirement)
    const { id } = await params;

    if (source === 'redis') {
      // Delete from Redis
      const key = getPasteKey(id);
      await redis.del(key);
    } else if (source === 'postgres') {
      // Delete from Postgres
      await sql`DELETE FROM pastes WHERE id = ${id}`;
    }

    return NextResponse.json({
      success: true,
      message: `Paste deleted from ${source}`
    });
  } catch (error) {
    console.error('Error deleting paste:', error);
    return NextResponse.json(
      { error: 'Failed to delete paste' },
      { status: 500 }
    );
  }
}