import { NextRequest, NextResponse } from 'next/server';
import { getPaste } from '@/lib/paste';
import { FetchPasteResponse } from '@/types/paste';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;

    // Handle test mode
    let currentTime: number | undefined;
    const testMode = process.env.TEST_MODE === '1';
    if (testMode) {
      const testNowMs = request.headers.get('x-test-now-ms');
      if (testNowMs) {
        currentTime = parseInt(testNowMs, 10);
      }
    }

    // Fetch paste and increment view count
    const paste = await getPaste(id, true, currentTime);

    if (!paste) {
      return NextResponse.json(
        { error: 'Paste not found or expired' },
        { status: 404 }
      );
    }

    // Calculate remaining views
    const remainingViews = paste.maxViews !== undefined
      ? paste.maxViews - paste.viewCount
      : null;

    // Calculate expires_at
    const expiresAt = paste.ttlSeconds
      ? new Date(paste.createdAt + paste.ttlSeconds * 1000).toISOString()
      : null;

    const response: FetchPasteResponse = {
      content: paste.content,
      remaining_views: remainingViews,
      expires_at: expiresAt,
    };

    return NextResponse.json(response, { status: 200 });
  } catch (error) {
    console.error('Error fetching paste:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}