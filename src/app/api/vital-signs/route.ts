import { NextResponse } from 'next/server';
import { supabase } from '../../../lib/supabaseClient';

export async function GET(req: Request) {
  const url = new URL(req.url);
  const date = url.searchParams.get('date');
  const startDate = url.searchParams.get('startDate');
  const endDate = url.searchParams.get('endDate');
  const limit = parseInt(url.searchParams.get('limit') || '50');

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
    return NextResponse.json({ error: err.message }, { status: 500 });
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
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
