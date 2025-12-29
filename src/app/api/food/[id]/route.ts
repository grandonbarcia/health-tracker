import { NextRequest, NextResponse } from 'next/server';
import { getFoodById } from '../../../../lib/db';
import { checkRateLimit, getClientIdentifier } from '@/lib/rateLimit';

export async function GET(req: NextRequest, { params }: { params: any }) {
  // Rate limiting
  const clientId = getClientIdentifier(req);
  const rateLimit = checkRateLimit(`food-id:${clientId}`, {
    maxRequests: 60,
    windowSeconds: 60,
  });
  if (!rateLimit.success) {
    return NextResponse.json(
      { error: 'Too many requests. Try again later.' },
      { status: 429, headers: { 'Retry-After': String(rateLimit.resetIn) } }
    );
  }

  // params may be a promise in some runtime shapes; await to be safe
  const resolvedParams = await params;
  const id = (resolvedParams as any).id;

  // Validate id format (max 200 chars, alphanumeric with common separators)
  if (!id || typeof id !== 'string' || id.length > 200) {
    return NextResponse.json({ error: 'Invalid food ID' }, { status: 400 });
  }

  try {
    const data = await getFoodById(id);
    if (!data)
      return NextResponse.json({ error: 'not found' }, { status: 404 });
    return NextResponse.json(data);
  } catch (err: any) {
    console.error('Error fetching food:', err);
    return NextResponse.json(
      { error: 'Failed to fetch food' },
      { status: 500 }
    );
  }
}
