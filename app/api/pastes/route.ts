import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { createPaste } from '@/lib/paste';
import { sql } from '@/lib/db';
import { nanoid } from 'nanoid';
import type { CreatePasteRequest, CreatePasteResponse } from '@/types/paste';

export async function POST(request: NextRequest) {
  try {
    const body: any = await request.json();

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

    // Check if user is logged in
    const session = await getServerSession(authOptions);

    // If user wants to save to account (logged in + saveToAccount flag)
    if (session && body.saveToAccount) {
      // Save to Postgres with title
      const pasteId = nanoid(10);
      const title = body.title || 'Untitled Paste';
      const collectionId = body.collectionId || null;

      // If adding to collection, get the next order number
      let orderInPackage = 0;
      if (collectionId) {
        const orderResult = await sql`
          SELECT COALESCE(MAX(order_in_package), -1) + 1 as next_order
          FROM pastes
          WHERE package_id = ${collectionId}
        `;
        orderInPackage = orderResult.rows[0]?.next_order || 0;
      }

      await sql`
        INSERT INTO pastes (
          id, user_id, title, content, 
          package_id, order_in_package,
          ttl_seconds, max_views, view_count
        )
        VALUES (
          ${pasteId}, 
          ${session.user.id}, 
          ${title}, 
          ${body.content},
          ${collectionId},
          ${orderInPackage},
          ${body.ttl_seconds || null},
          ${body.max_views || null},
          0
        )
      `;

      const baseUrl = request.nextUrl.origin;
      const url = `${baseUrl}/p/${pasteId}`;

      return NextResponse.json({
        id: pasteId,
        url,
        saved: true,
        collectionId: collectionId,
        message: collectionId ? 'Paste saved and added to collection' : 'Paste saved to your account'
      }, { status: 201 });
    } else {
      // Save to Redis (anonymous or user chose not to save)
      const pasteData: CreatePasteRequest = {
        content: body.content,
        ttl_seconds: body.ttl_seconds,
        max_views: body.max_views,
      };

      const id = await createPaste(pasteData);
      const baseUrl = request.nextUrl.origin;
      const url = `${baseUrl}/p/${id}`;

      const response: CreatePasteResponse = { id, url };

      return NextResponse.json(response, { status: 201 });
    }
  } catch (error) {
    console.error('Error creating paste:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}