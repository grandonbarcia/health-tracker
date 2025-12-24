import { NextResponse } from 'next/server';
import { createSupabaseClient } from '../../../lib/supabaseServer';
import { checkRateLimit, getClientIdentifier } from '../../../lib/rateLimit';
import { validateDate } from '../../../lib/validation';

export async function GET(req: Request) {
  try {
    // Rate limiting
    const clientId = getClientIdentifier(req);
    const rateLimit = checkRateLimit(`load-day:${clientId}`, {
      maxRequests: 120,
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

    const url = new URL(req.url);
    const date = url.searchParams.get('date');

    // Validate date
    const dateValidation = validateDate(date);
    if (!dateValidation.valid) {
      return NextResponse.json(
        { ok: false, error: dateValidation.error },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
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
