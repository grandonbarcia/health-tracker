import { NextResponse } from 'next/server';
import { createSupabaseClient } from '../../../lib/supabaseServer';
import { checkRateLimit, getClientIdentifier } from '../../../lib/rateLimit';

export async function GET(req: Request) {
  try {
    // Rate limiting
    const clientId = getClientIdentifier(req);
    const rateLimit = checkRateLimit(`list-days:${clientId}`, {
      maxRequests: 60,
      windowSeconds: 60,
    });
    if (!rateLimit.success) {
      return NextResponse.json(
        { ok: false, error: 'Too many requests. Try again later.' },
        { status: 429, headers: { 'Retry-After': String(rateLimit.resetIn) } }
      );
    }

    const authHeader = req.headers.get('authorization');
    if (!authHeader) {
      return NextResponse.json(
        { ok: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }
    const supabase = createSupabaseClient(authHeader);

    const { data, error } = await supabase.from('days').select('date');
    if (error) throw error;
    const days = (data ?? []).map((r: any) => r.date);
    return NextResponse.json({ ok: true, days });
  } catch (err) {
    console.error('Error listing days:', err);
    return NextResponse.json(
      { ok: false, error: 'Failed to list days' },
      { status: 500 }
    );
  }
}
