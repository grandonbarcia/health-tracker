import { NextResponse } from 'next/server';
import { createSupabaseClient } from '../../../lib/supabaseServer';
import { checkRateLimit, getClientIdentifier } from '../../../lib/rateLimit';
import { validateDate, validateMealItems } from '../../../lib/validation';

export async function POST(req: Request) {
  try {
    // Rate limiting
    const clientId = getClientIdentifier(req);
    const rateLimit = checkRateLimit(`save-day:${clientId}`, {
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

    const body = await req.json();

    // Validate date
    const dateValidation = validateDate(body?.date);
    if (!dateValidation.valid) {
      return NextResponse.json(
        { ok: false, error: dateValidation.error },
        { status: 400 }
      );
    }
    const date = body.date;

    // Validate meal items
    const itemsValidation = validateMealItems(body.items);
    if (!itemsValidation.valid) {
      return NextResponse.json(
        { ok: false, error: itemsValidation.error },
        { status: 400 }
      );
    }

    // normalize body to DayMeals. Support legacy array shape: items: ItemWithQty[]
    let payload = body.items;
    if (!payload) payload = { breakfast: [], lunch: [], dinner: [] };
    if (Array.isArray(payload)) {
      payload = { breakfast: [], lunch: [], dinner: payload };
    }

    // upsert into Supabase 'days' table
    const { error } = await supabase
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
