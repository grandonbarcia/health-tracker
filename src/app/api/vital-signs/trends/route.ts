import { NextResponse } from 'next/server';
import { supabase } from '../../../../lib/supabaseClient';

export async function GET(req: Request) {
  const url = new URL(req.url);
  const days = parseInt(url.searchParams.get('days') || '30');

  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Calculate date range
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const startDateStr = startDate.toISOString().split('T')[0];
    const endDateStr = endDate.toISOString().split('T')[0];

    // Fetch all readings in date range
    const { data: readings, error } = await supabase
      .from('user_vital_signs')
      .select('*')
      .eq('user_id', user.id)
      .gte('date', startDateStr)
      .lte('date', endDateStr)
      .order('date', { ascending: true });

    if (error) throw error;

    // Group by date and calculate averages
    const trendsByDate: Record<string, any> = {};

    (readings || []).forEach((reading) => {
      if (!trendsByDate[reading.date]) {
        trendsByDate[reading.date] = {
          date: reading.date,
          temperatures: [],
          pulse_rates: [],
          systolic_bps: [],
          diastolic_bps: [],
          oxygen_saturations: [],
        };
      }

      if (reading.body_temperature !== null) {
        trendsByDate[reading.date].temperatures.push(reading.body_temperature);
      }
      if (reading.pulse_rate !== null) {
        trendsByDate[reading.date].pulse_rates.push(reading.pulse_rate);
      }
      if (reading.systolic_bp !== null) {
        trendsByDate[reading.date].systolic_bps.push(reading.systolic_bp);
      }
      if (reading.diastolic_bp !== null) {
        trendsByDate[reading.date].diastolic_bps.push(reading.diastolic_bp);
      }
      if (reading.oxygen_saturation !== null) {
        trendsByDate[reading.date].oxygen_saturations.push(
          reading.oxygen_saturation
        );
      }
    });

    // Calculate averages and format response
    const trends = Object.values(trendsByDate).map((day: any) => {
      const avg = (arr: number[]) =>
        arr.length > 0
          ? Math.round((arr.reduce((a, b) => a + b, 0) / arr.length) * 10) / 10
          : undefined;

      const min = (arr: number[]) =>
        arr.length > 0 ? Math.min(...arr) : undefined;
      const max = (arr: number[]) =>
        arr.length > 0 ? Math.max(...arr) : undefined;

      return {
        date: day.date,
        avg_temperature: avg(day.temperatures),
        avg_pulse_rate: avg(day.pulse_rates),
        avg_systolic_bp: avg(day.systolic_bps),
        avg_diastolic_bp: avg(day.diastolic_bps),
        avg_oxygen: avg(day.oxygen_saturations),
        min_temperature: min(day.temperatures),
        max_temperature: max(day.temperatures),
        min_pulse_rate: min(day.pulse_rates),
        max_pulse_rate: max(day.pulse_rates),
        reading_count:
          day.temperatures.length +
          day.pulse_rates.length +
          day.systolic_bps.length +
          day.diastolic_bps.length +
          day.oxygen_saturations.length,
      };
    });

    return NextResponse.json(trends);
  } catch (err: any) {
    console.error('Error fetching vital signs trends:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
