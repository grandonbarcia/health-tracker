import { NextResponse } from 'next/server';
import { supabase } from '../../../lib/supabaseClient';
import { checkRateLimit, getClientIdentifier } from '../../../lib/rateLimit';
import { validateDate } from '../../../lib/validation';

export async function GET(req: Request) {
  // Rate limiting
  const clientId = getClientIdentifier(req);
  const rateLimit = checkRateLimit(`vitals:${clientId}`, {
    maxRequests: 100,
    windowSeconds: 60,
  });
  if (!rateLimit.success) {
    return NextResponse.json(
      { error: 'Too many requests. Try again later.' },
      { status: 429, headers: { 'Retry-After': String(rateLimit.resetIn) } }
    );
  }

  const url = new URL(req.url);
  const date = url.searchParams.get('date');
  const startDate = url.searchParams.get('startDate');
  const endDate = url.searchParams.get('endDate');
  const limit = Math.min(parseInt(url.searchParams.get('limit') || '50'), 500); // Cap at 500

  // Validate date parameters if provided
  if (date) {
    const dateValidation = validateDate(date);
    if (!dateValidation.valid) {
      return NextResponse.json(
        { error: dateValidation.error },
        { status: 400 }
      );
    }
  }
  if (startDate) {
    const startValidation = validateDate(startDate);
    if (!startValidation.valid) {
      return NextResponse.json(
        { error: startValidation.error },
        { status: 400 }
      );
    }
  }
  if (endDate) {
    const endValidation = validateDate(endDate);
    if (!endValidation.valid) {
      return NextResponse.json({ error: endValidation.error }, { status: 400 });
    }
  }

  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    let query = supabase
      .from('user_vital_signs')
      .select('*')
      .eq('user_id', user.id)
      .order('date', { ascending: false })
      .order('created_at', { ascending: false })
      .limit(limit);

    if (date) {
      query = query.eq('date', date);
    } else if (startDate && endDate) {
      query = query.gte('date', startDate).lte('date', endDate);
    }

    const { data, error } = await query;
    if (error) throw error;

    return NextResponse.json(data || []);
  } catch (err: any) {
    console.error('Error fetching vital signs:', err);
    return NextResponse.json(
      { error: 'Failed to fetch vital signs' },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();

    // Validate required field
    if (!body.date) {
      return NextResponse.json({ error: 'Date is required' }, { status: 400 });
    }

    // Validate blood pressure if both are provided
    if (body.systolic_bp && body.diastolic_bp) {
      if (body.systolic_bp <= body.diastolic_bp) {
        return NextResponse.json(
          { error: 'Systolic BP must be greater than diastolic BP' },
          { status: 400 }
        );
      }
    }

    const { data, error } = await supabase
      .from('user_vital_signs')
      .insert({
        user_id: user.id,
        date: body.date,
        time_of_day: body.time_of_day,
        body_temperature: body.body_temperature,
        pulse_rate: body.pulse_rate,
        systolic_bp: body.systolic_bp,
        diastolic_bp: body.diastolic_bp,
        oxygen_saturation: body.oxygen_saturation,
        notes: body.notes,
        measurement_context: body.measurement_context || {},
        updated_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) throw error;
    return NextResponse.json(data, { status: 201 });
  } catch (err: any) {
    console.error('Error creating vital signs:', err);
    return NextResponse.json(
      { error: 'Failed to save vital signs' },
      { status: 500 }
    );
  }
}
