import { NextRequest, NextResponse } from 'next/server';
import { createPaste } from '@/lib/paste';
import { CreatePasteRequest, CreatePasteResponse } from '@/types/paste';

export async function POST(request: NextRequest) {
  try {
    const body: CreatePasteRequest = await request.json();

    // Validate content
    if (!body.content || typeof body.content !== 'string' || body.content.trim() === '') {
      return NextResponse.json(
        { error: 'content is required and must be a non-empty string' },
        { status: 400 }
      );
    }

    // Validate ttl_seconds
    if (body.ttl_seconds !== undefined) {
      if (!Number.isInteger(body.ttl_seconds) || body.ttl_seconds < 1) {
        return NextResponse.json(
          { error: 'ttl_seconds must be an integer >= 1' },
          { status: 400 }
        );
      }
    }

    // Validate max_views
    if (body.max_views !== undefined) {
      if (!Number.isInteger(body.max_views) || body.max_views < 1) {
        return NextResponse.json(
          { error: 'max_views must be an integer >= 1' },
          { status: 400 }
        );
      }
    }

    const id = await createPaste(body);
    const baseUrl = request.nextUrl.origin;
    const url = `${baseUrl}/p/${id}`;

    const response: CreatePasteResponse = { id, url };

    return NextResponse.json(response, { status: 201 });
  } catch (error) {
    console.error('Error creating paste:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}