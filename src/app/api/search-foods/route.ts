import { NextResponse } from 'next/server';
import { searchFoods } from '../../../lib/db';

export async function GET(req: Request) {
  const url = new URL(req.url);
  const q = url.searchParams.get('q') ?? '';
  const limit = Number(url.searchParams.get('limit') ?? '8');
  try {
    const data = await searchFoods(q, limit);
    return NextResponse.json(data);
  } catch (err: any) {
    console.error('Error searching foods:', err);
    return NextResponse.json(
      { error: 'Failed to search foods' },
      { status: 500 }
    );
  }
}
