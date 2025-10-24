import { NextResponse } from 'next/server';
import { supabaseServer } from '../../../lib/supabaseServer';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const date = body?.date;
    if (!date)
      return NextResponse.json(
        { ok: false, error: 'missing date' },
        { status: 400 }
      );

    // normalize body to DayMeals. Support legacy array shape: items: ItemWithQty[]
    let payload = body.items;
    if (!payload) payload = { breakfast: [], lunch: [], dinner: [] };
    if (Array.isArray(payload)) {
      payload = { breakfast: [], lunch: [], dinner: payload };
    }

    // upsert into Supabase 'days' table
    const { error } = await supabaseServer
      .from('days')
      .upsert({ date, data: payload }, { onConflict: 'date' });
    if (error) throw error;

    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json(
      { ok: false, error: String(err) },
      { status: 500 }
    );
  }
}
