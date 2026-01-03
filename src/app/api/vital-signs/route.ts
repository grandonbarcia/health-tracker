import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { checkRateLimit, getClientIdentifier } from '../../../lib/rateLimit';
import { validateDate } from '../../../lib/validation';

function isFiniteNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value);
}

function isValidTimeOfDay(value: unknown): boolean {
  return (
    value === undefined ||
    value === null ||
    value === '' ||
    value === 'morning' ||
    value === 'afternoon' ||
    value === 'evening' ||
    value === 'night'
  );
}

function createSupabaseClient(authHeader: string) {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      global: {
        headers: {
          Authorization: authHeader,
        },
      },
    }
  );
}

export async function GET(req: NextRequest) {
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

  const authHeader = req.headers.get('authorization');
  if (!authHeader) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const supabase = createSupabaseClient(authHeader);

  try {
    const {
      data: { user },
    } = await supabase.auth.getUser(authHeader.replace('Bearer ', ''));
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

export async function POST(req: NextRequest) {
  // Rate limiting
  const clientId = getClientIdentifier(req);
  const rateLimit = checkRateLimit(`vitals-post:${clientId}`, {
    maxRequests: 60,
    windowSeconds: 60,
  });
  if (!rateLimit.success) {
    return NextResponse.json(
      { error: 'Too many requests. Try again later.' },
      { status: 429, headers: { 'Retry-After': String(rateLimit.resetIn) } }
    );
  }

  const authHeader = req.headers.get('authorization');
  if (!authHeader) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const supabase = createSupabaseClient(authHeader);

  try {
    const {
      data: { user },
    } = await supabase.auth.getUser(authHeader.replace('Bearer ', ''));
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();

    // Validate required field
    if (!body.date) {
      return NextResponse.json({ error: 'Date is required' }, { status: 400 });
    }

    // Validate date format
    const dateValidation = validateDate(body.date);
    if (!dateValidation.valid) {
      return NextResponse.json(
        { error: dateValidation.error },
        { status: 400 }
      );
    }

    // Validate time_of_day if provided
    if (!isValidTimeOfDay(body.time_of_day)) {
      return NextResponse.json(
        { error: 'Invalid time of day' },
        { status: 400 }
      );
    }

    // Validate vital signs ranges
    if (body.body_temperature !== undefined && body.body_temperature !== null) {
      if (!isFiniteNumber(body.body_temperature)) {
        return NextResponse.json(
          { error: 'Body temperature must be a number' },
          { status: 400 }
        );
      }
      // Stored in Celsius (client converts Fahrenheit -> Celsius)
      if (body.body_temperature < 30 || body.body_temperature > 45) {
        return NextResponse.json(
          { error: 'Body temperature out of valid range (30-45°C)' },
          { status: 400 }
        );
      }
    }
    if (body.pulse_rate !== undefined && body.pulse_rate !== null) {
      if (!isFiniteNumber(body.pulse_rate)) {
        return NextResponse.json(
          { error: 'Pulse rate must be a number' },
          { status: 400 }
        );
      }
      if (body.pulse_rate < 20 || body.pulse_rate > 300) {
        return NextResponse.json(
          { error: 'Pulse rate out of valid range (20-300 bpm)' },
          { status: 400 }
        );
      }
    }
    if (body.systolic_bp !== undefined && body.systolic_bp !== null) {
      if (!isFiniteNumber(body.systolic_bp)) {
        return NextResponse.json(
          { error: 'Systolic BP must be a number' },
          { status: 400 }
        );
      }
      if (body.systolic_bp < 60 || body.systolic_bp > 300) {
        return NextResponse.json(
          { error: 'Systolic BP out of valid range (60-300)' },
          { status: 400 }
        );
      }
    }
    if (body.diastolic_bp !== undefined && body.diastolic_bp !== null) {
      if (!isFiniteNumber(body.diastolic_bp)) {
        return NextResponse.json(
          { error: 'Diastolic BP must be a number' },
          { status: 400 }
        );
      }
      if (body.diastolic_bp < 30 || body.diastolic_bp > 200) {
        return NextResponse.json(
          { error: 'Diastolic BP out of valid range (30-200)' },
          { status: 400 }
        );
      }
    }
    if (
      body.oxygen_saturation !== undefined &&
      body.oxygen_saturation !== null
    ) {
      if (!isFiniteNumber(body.oxygen_saturation)) {
        return NextResponse.json(
          { error: 'Oxygen saturation must be a number' },
          { status: 400 }
        );
      }
      if (body.oxygen_saturation < 50 || body.oxygen_saturation > 100) {
        return NextResponse.json(
          { error: 'Oxygen saturation out of valid range (50-100%)' },
          { status: 400 }
        );
      }
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
        time_of_day: body.time_of_day || null,
        body_temperature: body.body_temperature,
        pulse_rate: body.pulse_rate,
        systolic_bp: body.systolic_bp,
        diastolic_bp: body.diastolic_bp,
        oxygen_saturation: body.oxygen_saturation,
        notes:
          typeof body.notes === 'string' ? body.notes.substring(0, 1000) : '',
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
