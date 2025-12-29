import { NextRequest, NextResponse } from 'next/server';
import { searchFoods } from '../../../lib/db';
import { checkRateLimit, getClientIdentifier } from '@/lib/rateLimit';

export async function GET(req: NextRequest) {
  // Rate limiting
  const clientId = getClientIdentifier(req);
  const rateLimit = checkRateLimit(`search-foods:${clientId}`, {
    maxRequests: 60,
    windowSeconds: 60,
  });
  if (!rateLimit.success) {
    return NextResponse.json(
      { error: 'Too many requests. Try again later.' },
      { status: 429, headers: { 'Retry-After': String(rateLimit.resetIn) } }
    );
  }

  const url = new URL(req.url);
  const q = url.searchParams.get('q') ?? '';
  // Limit search to prevent abuse
  const limit = Math.min(
    Math.max(1, Number(url.searchParams.get('limit') ?? '8')),
    50
  );

  try {
    const data = await searchFoods(q.substring(0, 100), limit);
    return NextResponse.json(data);
  } catch (err: any) {
    console.error('Error searching foods:', err);
    return NextResponse.json(
      { error: 'Failed to search foods' },
      { status: 500 }
    );
  }
}
