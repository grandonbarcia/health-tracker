import { NextResponse } from 'next/server';
import { supabaseServer } from '../../../lib/supabaseServer';

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const date = url.searchParams.get('date');
    if (!date)
      return NextResponse.json(
        { ok: false, error: 'missing date' },
        { status: 400 }
      );

    const { data, error } = await supabaseServer
      .from('days')
      .select('data')
      .eq('date', date)
      .maybeSingle();

    if (error) {
      // if no row found, return empty meals
      return NextResponse.json({
        ok: true,
        items: { breakfast: [], lunch: [], dinner: [] },
      });
    }

    const items = data?.data ?? { breakfast: [], lunch: [], dinner: [] };
    return NextResponse.json({ ok: true, items });
  } catch (err) {
    return NextResponse.json(
      { ok: false, error: String(err) },
      { status: 500 }
    );
  }
}
