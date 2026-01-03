import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { checkRateLimit, getClientIdentifier } from '@/lib/rateLimit';
import { validateUUID, validateDate } from '@/lib/validation';

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

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  // Rate limiting
  const clientId = getClientIdentifier(req);
  const rateLimit = checkRateLimit(`vitals-id-get:${clientId}`, {
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

    const { id } = await params;

    // Validate UUID format
    const uuidValidation = validateUUID(id);
    if (!uuidValidation.valid) {
      return NextResponse.json({ error: 'Invalid ID format' }, { status: 400 });
    }

    const { data, error } = await supabase
      .from('user_vital_signs')
      .select('*')
      .eq('id', id)
      .eq('user_id', user.id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json({ error: 'Not found' }, { status: 404 });
      }
      throw error;
    }

    return NextResponse.json(data);
  } catch (err: any) {
    console.error('Error fetching vital sign:', err);
    return NextResponse.json(
      { error: 'Failed to fetch vital sign' },
      { status: 500 }
    );
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  // Rate limiting
  const clientId = getClientIdentifier(req);
  const rateLimit = checkRateLimit(`vitals-id-put:${clientId}`, {
    maxRequests: 30,
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

    const { id } = await params;

    // Validate UUID format
    const uuidValidation = validateUUID(id);
    if (!uuidValidation.valid) {
      return NextResponse.json({ error: 'Invalid ID format' }, { status: 400 });
    }

    const body = await req.json();

    // Validate time_of_day if provided
    if (!isValidTimeOfDay(body.time_of_day)) {
      return NextResponse.json(
        { error: 'Invalid time of day' },
        { status: 400 }
      );
    }

    // Validate date if provided
    if (body.date) {
      const dateValidation = validateDate(body.date);
      if (!dateValidation.valid) {
        return NextResponse.json(
          { error: dateValidation.error },
          { status: 400 }
        );
      }
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
      .update({
        date: body.date,
        time_of_day: body.time_of_day || null,
        body_temperature: body.body_temperature,
        pulse_rate: body.pulse_rate,
        systolic_bp: body.systolic_bp,
        diastolic_bp: body.diastolic_bp,
        oxygen_saturation: body.oxygen_saturation,
        notes:
          typeof body.notes === 'string' ? body.notes.substring(0, 1000) : '',
        measurement_context: body.measurement_context,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .eq('user_id', user.id)
      .select()
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json({ error: 'Not found' }, { status: 404 });
      }
      throw error;
    }

    return NextResponse.json(data);
  } catch (err: any) {
    console.error('Error updating vital sign:', err);
    return NextResponse.json(
      { error: 'Failed to update vital sign' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  // Rate limiting
  const clientId = getClientIdentifier(req);
  const rateLimit = checkRateLimit(`vitals-id-delete:${clientId}`, {
    maxRequests: 30,
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

    const { id } = await params;

    // Validate UUID format
    const uuidValidation = validateUUID(id);
    if (!uuidValidation.valid) {
      return NextResponse.json({ error: 'Invalid ID format' }, { status: 400 });
    }

    const { error } = await supabase
      .from('user_vital_signs')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id);

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error('Error deleting vital sign:', err);
    return NextResponse.json(
      { error: 'Failed to delete vital sign' },
      { status: 500 }
    );
  }
}
