import { NextResponse } from 'next/server';
import { supabaseServer } from '../../../lib/supabaseServer';

export async function GET() {
  try {
    const { data, error } = await supabaseServer.from('days').select('date');
    if (error) throw error;
    const days = (data ?? []).map((r: any) => r.date);
    return NextResponse.json({ ok: true, days });
  } catch (err) {
    return NextResponse.json(
      { ok: false, error: String(err) },
      { status: 500 }
    );
  }
}
