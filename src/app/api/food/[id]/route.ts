import { NextResponse } from 'next/server';
import { getFoodById } from '../../../../lib/db';

export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  // params may be a promise in some runtime shapes; await to be safe
  const resolvedParams = await params;
  const id = resolvedParams.id;
  try {
    const data = await getFoodById(id);
    if (!data)
      return NextResponse.json({ error: 'not found' }, { status: 404 });
    return NextResponse.json(data);
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || String(err) },
      { status: 500 }
    );
  }
}
