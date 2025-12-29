import { NextResponse } from 'next/server';
import { kv } from '@/lib/kv';

export async function GET() {
  try {
    // Test Redis connection
    await kv.ping();
    
    return NextResponse.json({ ok: true }, { status: 200 });
  } catch (error) {
    console.error('Health check failed:', error);
    return NextResponse.json({ ok: false }, { status: 200 });
  }
}