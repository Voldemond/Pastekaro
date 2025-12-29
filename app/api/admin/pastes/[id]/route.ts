import { NextRequest, NextResponse } from 'next/server';
import { redis, getPasteKey } from '@/lib/kv';

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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

    // Await params (Next.js 15 requirement)
    const { id } = await params;
    const key = getPasteKey(id);

    await redis.del(key);

    return NextResponse.json({ success: true, message: 'Paste deleted' });
  } catch (error) {
    console.error('Error deleting paste:', error);
    return NextResponse.json(
      { error: 'Failed to delete paste' },
      { status: 500 }
    );
  }
}