import { NextResponse } from 'next/server';
import { supabase } from '../../../../lib/supabaseClient';

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

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
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const body = await req.json();

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
        time_of_day: body.time_of_day,
        body_temperature: body.body_temperature,
        pulse_rate: body.pulse_rate,
        systolic_bp: body.systolic_bp,
        diastolic_bp: body.diastolic_bp,
        oxygen_saturation: body.oxygen_saturation,
        notes: body.notes,
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
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    const { error } = await supabase
      .from('user_vital_signs')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id);

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error('Error deleting vital sign:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
